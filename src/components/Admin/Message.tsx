import { adminSendMessage } from '@/services/api';
import { Input, InputNumber, message, Modal } from 'antd';
import { useState } from 'react';
const { TextArea } = Input;

type SendAdminMessageProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

const SendAdminMessage = ({ show, setShow }: SendAdminMessageProps) => {
  const [userId, setSendUid] = useState<number>();
  const [text, setSendContent] = useState<string>();

  const reset = () => {
    setSendUid(undefined);
    setSendContent(undefined);
    setShow(false);
  };

  return (
    <Modal
      centered
      open={show}
      title="发送管理员消息"
      okText="发送"
      onCancel={reset}
      onOk={() => {
        if (userId && text)
          adminSendMessage({ userId, text }).then((res) => {
            if (res.success) {
              message.success('发送成功');
              reset();
            }
          });
      }}
    >
      <InputNumber
        placeholder="userId"
        value={userId}
        controls={false}
        onChange={(v) => setSendUid(Number(v))}
      />
      <TextArea
        style={{ marginTop: 10 }}
        rows={10}
        placeholder="消息"
        value={text}
        onChange={(v) => setSendContent(v.target.value)}
      />
    </Modal>
  );
};

export default SendAdminMessage;
