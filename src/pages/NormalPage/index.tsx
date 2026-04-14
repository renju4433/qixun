import HeaderLogo from '@/components/Header/Logo';
import { submitFeedback } from '@/services/api';
import { useModel } from '@umijs/max';
import { Button, Image, Input, Modal, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useState } from 'react';
import styles from './style.less';

interface NormalPageProps {
  title?: string;
  desc?: string;
  fullscreen?: boolean;
  children?: React.ReactNode;
  feedbackButton?: boolean;
}

const NormalPage = (props: NormalPageProps) => {
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedbackContent, setFeedbackContent] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const getImageUrl = (file: UploadFile) => {
    const key = (file.response as { data?: string } | undefined)?.data || file.url || '';
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    return `https://b68v.daai.fun/${key}`;
  };

  const imageKeys = fileList
    .map((file) => (file.response as { data?: string } | undefined)?.data)
    .filter((item): item is string => !!item);
  const remainCount = Math.max(0, 3 - fileList.length);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isAllowedType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isAllowedType) {
      message.error('仅支持 jpg/jpeg/png/webp 格式');
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 <= 10;
    if (!isLt10M) {
      message.error('单张图片不能超过 10MB');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleSubmitFeedback = async () => {
    const content = feedbackContent.trim();
    if (!content && imageKeys.length === 0) {
      message.error('请输入反馈内容或上传图片');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFeedback({
        feedback: content,
        extra: JSON.stringify({ feedbackImages: imageKeys }),
      });
      if (res.success) {
        message.success('反馈提交成功');
        setShowFeedback(false);
        setFeedbackContent('');
        setFileList([]);
      } else {
        message.error(res.errorMessage || '反馈提交失败');
      }
    } catch (error) {
      message.error('反馈提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`${styles.wrapper} ${
        props.fullscreen ? styles.fullscreen : ''
      } ${isInApp ? styles.inApp : ''}`}
    >
      <HeaderLogo canBack={true} className={styles.header} />
      {props.feedbackButton !== false && (
        <div
          className={styles.feedback}
          style={{
            position: 'absolute',
            top: isInApp ? '3rem' : '15px',
            right: '15px',
            zIndex: 3,
          }}
        >
          <Button onClick={() => setShowFeedback(true)}>反馈</Button>
          {showFeedback && (
            <Modal
              title="反馈"
              open={showFeedback}
              onCancel={() => setShowFeedback(false)}
              onOk={handleSubmitFeedback}
              okText="提交"
              confirmLoading={submitting}
            >
              <Input.TextArea
                placeholder="请输入反馈的内容，不能用于举报用户或给用户发消息。"
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                rows={4}
              />
              <div style={{ marginTop: 12 }}>
                <Upload
                  name="file"
                  action="/api/upload_image"
                  listType="picture-card"
                  fileList={fileList}
                  data={(file) => ({ fileName: file.name })}
                  beforeUpload={beforeUpload}
                  onChange={(info) => {
                    setFileList(info.fileList);
                    if (info.file.status === 'error') {
                      message.error('上传失败，请稍后重试');
                    }
                    if (info.file.status === 'done' && !info.file.response?.success) {
                      message.error(info.file.response?.errorMessage || '上传失败');
                    }
                  }}
                  onPreview={(file) => {
                    const url = getImageUrl(file);
                    if (!url) {
                      message.error('图片预览失败');
                      return;
                    }
                    setPreviewImage(url);
                    setPreviewOpen(true);
                  }}
                  multiple
                  maxCount={3}
                >
                  {fileList.length >= 3 ? null : '+ 上传'}
                </Upload>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                  还可上传 {remainCount} 张，支持拖拽上传；
                </div>
              </div>
              <Image
                style={{ display: 'none' }}
                preview={{
                  visible: previewOpen,
                  src: previewImage,
                  onVisibleChange: (visible) => setPreviewOpen(visible),
                }}
              />
            </Modal>
          )}
        </div>
      )}
      {!props.fullscreen ? (
        <div className={styles.container}>
          {props.title && (
            <h2 style={{ textAlign: 'center', fontSize: '28px' }}>
              {props.title}
            </h2>
          )}
          {props.desc && (
            <div
              style={{ textAlign: 'center', color: 'grey', fontSize: '14px' }}
            >
              {props.desc}
            </div>
          )}
          {props.children}
        </div>
      ) : (
        props.children
      )}
    </div>
  );
};

export default NormalPage;
