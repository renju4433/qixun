import NormalPage from '@/pages/NormalPage';
import { xuntuImage } from '@/services/api';
import { Button, Image, Spin, Upload, UploadProps, message } from 'antd';
import { useEffect, useState } from 'react';
import styles from './style.less';

const XunTu = () => {
  const [imageName, setImageName] = useState<string | null>();
  const [knowledge, setKnowledge] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [needVip, setNeedVip] = useState<boolean>(false);

  const props: UploadProps = {
    name: 'file',
    action: 'https://saiyuan.top/api/upload_image',
    data(file) {
      return { fileName: file.name };
    },

    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        if (info.file.response.errorCode) {
          console.log(info.file.response);
          message.error(info.file.response.errorMessage);
        } else setImageName(info.file.response.data);
      } else if (info.file.status === 'error') message.error(`上传失败`);
    },
  };

  useEffect(() => {
    if (imageName) {
      message.success('上传成功');
      setKnowledge(null);
      xuntuImage({ img: imageName })
        .then((res) => {
          setLoading(false);
          if (res.success) setKnowledge(res.data);
        })
        .catch(() => setLoading(false));
      setLoading(true);
      setNeedVip(false);
    }
  }, [imageName]);

  return (
    <NormalPage title="图解">
      <div className={styles.desc}>
        <div>* 智能推理图片大概位置，学习地理知识，不保证能解出。</div>
        <div>
          *
          因成本原因，会员每24小时免费使用3次，非会员以及超出免费额度的用户每次使用需要消耗{' '}
          <span style={{ color: 'gold' }}>2宝石</span>
        </div>
        <div>* 请勿在棋寻积分以及每日挑战赛事过程中使用，违者封号处理</div>
      </div>
      <div style={{ height: '1rem' }}></div>
      {imageName && (
        <Image
          width={200}
          height={200}
          src={`https://b68v.daai.fun/${imageName}?x-oss-process=image/resize,h_800`}
        />
      )}
      <div></div>
      <Upload {...props} style={{ marginRight: '5px' }}>
        <Button>上传图片</Button>
      </Upload>
      <div style={{ height: '1rem' }}></div>
      {knowledge && <div style={{ whiteSpace: 'pre-wrap' }}>{knowledge}</div>}
      {loading && <Spin size="large" tip="正在解析推理..." />}
      {needVip && (
        <div style={{ color: 'red' }}>
          需要是付费会员，试用会员暂不支持使用该功能
        </div>
      )}
    </NormalPage>
  );
};

export default XunTu;
