import VipModal from '@/components/Vip';
import NormalPage from '@/pages/NormalPage';
import { useState } from 'react';

const VIP = () => {
  const [showModal, setShowModal] = useState<boolean>(true);

  return (
    <NormalPage title="开通VIP">
      <VipModal
        open={showModal}
        hide={() => setShowModal(false)}
        closable={false}
      />
    </NormalPage>
  );
};

export default VIP;
