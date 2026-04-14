import { submitBan } from '@/services/api';
import { Input, message, Modal } from 'antd';
import { useState } from 'react';
const { TextArea } = Input;

interface SubmitBanProps {
  open: boolean;
  userId?: number;
  onClose: () => void;
}

const SubmitBan: React.FC<SubmitBanProps> = ({ open, userId, onClose }) => {
  const [text, setText] = useState<string>();

  return (
    <Modal
      centered
      open={open}
      title={`提交 uid: ${userId} 的封禁决定`}
      okText="提交"
      okButtonProps={{ danger: true }}
      onCancel={() => {
        setText(undefined);
        onClose();
      }}
      onOk={() => {
        if (userId && text) {
          if (text.includes('replayplayer?') || text.includes('replay?')) {
            message.error('链接格式错误');
            return;
          }
          submitBan({
            userId: userId,
            reason: '积分赛事网络搜索',
            detail: text,
          }).then((res) => {
            if (res.success) {
              message.success('提交成功');
              setText(undefined);
              onClose();
            } else {
              message.error('提交失败');
            }
          });
        }
      }}
    >
      <TextArea
        style={{ marginTop: 10 }}
        rows={10}
        placeholder="证据"
        value={text}
        onChange={(v) => setText(v.target.value)}
      />
    </Modal>
  );
};

export default SubmitBan;
