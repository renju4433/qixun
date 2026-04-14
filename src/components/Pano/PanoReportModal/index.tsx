import { reportPano } from '@/services/api';
import { Input, Modal, Radio } from 'antd';
import { FC, useState } from 'react';

type ReportModalProps = {
  show: boolean;
  panoId: string;
  mapsId: number;
  onClose: () => void;
};
const PanoReportModal: FC<ReportModalProps> = ({
  show,
  panoId,
  mapsId,
  onClose,
}) => {
  const reasons = [
    '黑屏',
    '画质太差',
    '定位错误',
    '指南针错误',
    '涉黄涉暴',
    '其他',
  ];
  const [reason, setReason] = useState<string>();
  const [more, setMore] = useState<string>();

  return (
    <Modal
      destroyOnClose
      title="反馈街景"
      open={show}
      onCancel={onClose}
      onOk={() => reportPano({ panoId, mapsId, reason, more }).then(onClose)}
    >
      <Radio.Group onChange={(e) => setReason(e.target.value)} value={reason}>
        {reasons.map((reason, index) => (
          <Radio key={index} value={reason}>
            {reason}
          </Radio>
        ))}
      </Radio.Group>
      <Input
        value={more}
        placeholder="其他补充/选填，详细的描述将帮助我们更快的定位问题"
        onChange={(e) => setMore(e.target.value)}
      />
    </Modal>
  );
};

export default PanoReportModal;
