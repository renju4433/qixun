import { sendFriendMessage } from '@/services/api';
import { Input, Modal, message } from 'antd';
import { useState } from 'react';

interface SendMessageModalProps {
  open: boolean;
  friend: API.UserProfile | undefined;
  onClose: () => void;
  defaultMessage?: string;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  open,
  friend,
  onClose,
  defaultMessage,
}) => {
  const [friendMessage, setFriendMessage] = useState<string>(
    defaultMessage ?? '',
  );

  const handleSend = () => {
    if (!friend) return;
    sendFriendMessage({
      friend: friend.userId,
      message: friendMessage,
    }).then(() => {
      setFriendMessage('');
      message.success('发送成功！');
      onClose();
    });
  };

  return (
    <Modal
      destroyOnClose
      title={`发送消息给 ${friend?.userName}`}
      open={open}
      onOk={handleSend}
      onCancel={onClose}
    >
      <div>每天最多发送10条消息, 发送骚扰和敏感信息会被封禁账号。</div>
      <Input
        value={friendMessage}
        onChange={(e) => setFriendMessage(e.target.value)}
        placeholder="输入消息"
      />
    </Modal>
  );
};

export default SendMessageModal;
