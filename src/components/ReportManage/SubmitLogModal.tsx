import { REPLAY_PANO_LINK_REGEX } from '@/constants';
import { setLogged } from '@/services/api';
import { Flex, Input, message, Modal } from 'antd';
import { useEffect, useState } from 'react';

const { TextArea } = Input;

interface SubmitLogModalProps {
  open: boolean;
  onClose: () => void;
  report?: API.UserReportItem;
  onSuccess?: () => void;
}

const SubmitLogModal: React.FC<SubmitLogModalProps> = ({
  open,
  onClose,
  report,
  onSuccess,
}) => {
  const [log, setLog] = useState<string>('');

  useEffect(() => {
    if (report) {
      const parsedMeta = report.meta ? JSON.parse(report.meta) : null;
      const rounds = parsedMeta?.rounds;
      setLog(
        rounds
          ? rounds
              .map(
                (v: number) =>
                  `https://saiyuan.top/replay-pano?gameId=${report.gameId}&round=${v}`,
              )
              .join('\n')
          : '',
      );
    }
  }, [report]);

  return (
    <Modal
      title={`提交 ${report?.user.userName} (${report?.user.userId}) 的作弊记录`}
      destroyOnClose
      open={open}
      onClose={onClose}
      onCancel={onClose}
      onOk={() => {
        if (!report || !report.id || !log?.trim()) {
          message.error('数据为空');
          return;
        }
        setLogged({ id: report.id, links: log }).then((res) => {
          if (res.success) {
            message.success('提交成功');
            onClose();
            setLog('');
            onSuccess?.();
          }
        });
      }}
    >
      <Flex vertical gap="small">
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
        提交后会将此条举报标注为“已留档”状态，并通知用户。
      </Flex>
    </Modal>
  );
};

export default SubmitLogModal;
