import { Button, Modal } from 'antd';
import { useState } from 'react';

const Discount = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  return (
    <div>
      <Button
        onClick={() => {
          setShowModal(true);
        }}
      >
        优惠日历/计划
      </Button>
      <Modal
        open={showModal}
        title={`优惠计划`}
        onCancel={() => {
          setShowModal(false);
        }}
        okButtonProps={{ style: { display: 'none' } }}
      >
        {/* <div>春节：会员充值促销/部分头像框折扣</div>
        <div>五一：宝石充值促销</div>
        <div>暑期：7月末8月初：会员充值促销</div>
        <div>十一：宝石充值促销</div> */}
        <div>2026年暂无优惠计划</div>
      </Modal>
    </div>
  );
};

export default Discount;
