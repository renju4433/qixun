import { REPLAY_PANO_LINK_REGEX } from '@/constants';
import { addCheatLog } from '@/services/api';
import { Flex, Input, InputNumber, message, Modal } from 'antd';
import { useState } from 'react';
const { TextArea } = Input;

interface ManualAddProps {
  open: boolean;
  onClose: () => any;
  uid?: number;
}

const ManualAdd: React.FC<ManualAddProps> = ({ open, onClose, uid }) => {
  const [log, setLog] = useState<string>();
  const [userId, setUserId] = useState<number | undefined>(uid ?? undefined);

  const clearAll = () => {
    onClose();
    setLog(undefined);
    setUserId(undefined);
  };

  const submit = (userId: number, links: string) => {
    addCheatLog({ userId, links }).then((res) => {
      if (res.success) {
        message.success('提交成功');
        clearAll();
      }
    });
  };

  return (
    <Modal
      title="手动上传作弊记录"
      destroyOnClose
      open={open}
      onClose={clearAll}
      onCancel={clearAll}
      okButtonProps={{ disabled: !log || !userId }}
      onOk={() => {
        if (!log || !userId) {
          message.error('数据为空');
          return;
        } else submit(userId, log);
      }}
    >
      <Flex vertical gap="large">
        <TextArea
          value={log}
          placeholder="仅支持 https://saiyuan.top/replay-pano?gameId=&round= 格式的链接"
          count={{
            show: true,
            strategy: (txt) => txt.match(REPLAY_PANO_LINK_REGEX)?.length || 0,
          }}
          onChange={(e) => setLog(e.target.value)}
          autoSize={{ minRows: 5, maxRows: 20 }}
        />
        <Flex align="center" justify="space-between">
          <InputNumber
            placeholder="UserId"
            value={userId}
            onChange={(v) => setUserId(v as number)}
            disabled={!!uid}
            controls={false}
          />
          上传前请确认用户信息无误。
        </Flex>
      </Flex>
    </Modal>
  );
};

export default ManualAdd;
