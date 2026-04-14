import VipModal from '@/components/Vip';
import NormalPage from '@/pages/NormalPage';
import { createMap } from '@/services/api';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from '@umijs/max';
import { Button, Form, Input, Upload, UploadProps, message } from 'antd';
import { useState } from 'react';

const { TextArea } = Input;

type FieldType = {
  cover?: string;
  name?: string;
  desc?: string;
};

const MapDetail = () => {
  const [showVip, setShowVip] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>();

  const [form] = Form.useForm();
  const navigator = useNavigate();

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      if (info.file.response.errorCode) {
        console.log(info.file.response);
        message.error(info.file.response.errorMessage);
      } else {
        setImageUrl(info.file.response.data);
      }
    }
  };

  const create = async () => {
    try {
      await form.validateFields();
    } catch (errorInfo) {
      return;
    }

    const mapProps = form.getFieldsValue();
    createMap({ ...mapProps }).then((res) => {
      if (res.success) {
        navigator(`/mapmodify/${res.data.id}`);
      } else {
        if (res.errorCode === 'need_vip') {
          message.error('此功能需要开通会员');
          setShowVip(true);
        } else {
          message.error('创建失败');
        }
      }
    });
  };

  return (
    <NormalPage title="题库创建">
      <Form form={form} size="large">
        <Form.Item<FieldType>
          label="封面"
          name="cover"
          normalize={(value) => (value?.response ? value.response.data : null)}
        >
          <Upload
            name="file"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            action="https://saiyuan.top/api/upload_image"
            onChange={handleChange}
            data={{ fileName: new Date().getTime().toString() }}
          >
            {imageUrl ? (
              <img
                src={'https://b68v.daai.fun/' + imageUrl}
                alt="avatar"
                style={{ width: '100%' }}
              />
            ) : (
              uploadButton
            )}
          </Upload>
        </Form.Item>
        <Form.Item<FieldType>
          label="题库名称"
          name="name"
          rules={[{ required: true, message: '请填写题库名称' }]}
        >
          <Input></Input>
        </Form.Item>
        <Form.Item<FieldType> label="题库描述" name="desc">
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" onClick={create}>
            创建
          </Button>
        </Form.Item>
      </Form>
      {showVip && <VipModal open={showVip} hide={() => setShowVip(false)} />}
    </NormalPage>
  );
};

export default MapDetail;
