import { adminAddGems, adminAddVip } from '@/services/api';
import { ConfigProvider, Form, InputNumber, Modal, Radio, message } from 'antd';
import { FC, useState } from 'react';
const { Item } = Form;

type AdminAwardProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

const AdminAward: FC<AdminAwardProps> = ({ show, setShow }) => {
  const [type, setType] = useState<string>();
  const [userId, setUserId] = useState<number>();
  const [number, setValues] = useState<number>(0);

  const handleClose = (success?: boolean) => {
    if (success) {
      message.success(`已奖励用户${userId}${type}${number}单位`);
      setUserId(undefined);
      setType(undefined);
      setValues(0);
      setShow(false);
    } else message.error('奖励失败');
  };

  return (
    <Modal
      title="奖励发放"
      open={show}
      onCancel={() => setShow(false)}
      onOk={() => {
        if (userId && number) {
          if (type === 'vip') {
            adminAddVip({ userId: userId, day: number }).then((res) =>
              handleClose(res.success),
            );
          } else if (type === 'gem') {
            adminAddGems({ userId: userId, gems: number }).then((res) =>
              handleClose(res.success),
            );
          } else {
            message.error('错误，请填写完整信息；如已填写，请报告错误');
          }
        }
      }}
    >
      <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 0 } } }}>
        <Item label="用户ID">
          <InputNumber
            value={userId}
            onChange={(value) => setUserId(Number(value))}
          />
        </Item>
        <Item label="奖励类型">
          <Radio.Group
            options={[
              { label: 'VIP', value: 'vip' },
              { label: '宝石', value: 'gem' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </Item>
        {type === 'vip' && (
          <Radio.Group
            options={[
              { label: '日', value: 1 },
              { label: '周', value: 7 },
              { label: '月', value: 30 },
              { label: '季', value: 91 },
              { label: '半年', value: 182 },
              { label: '年', value: 365 },
            ]}
            value={number}
            onChange={(e) => setValues(Number(e.target.value))}
            style={{ marginBottom: 4 }}
          />
        )}
        {type === 'gem' && (
          <Radio.Group
            options={[
              { label: '10', value: 10 },
              { label: '50', value: 50 },
              { label: '100', value: 100 },
              { label: '200', value: 200 },
              { label: '500', value: 500 },
            ]}
            value={number}
            onChange={(e) => setValues(Number(e.target.value))}
            style={{ marginBottom: 4 }}
          />
        )}
        {type && (
          <Item label="自定义">
            <InputNumber
              value={number}
              onChange={(value) => setValues(Number(value))}
              addonAfter={type === 'gem' ? '个' : '天'}
            />
          </Item>
        )}
      </ConfigProvider>
    </Modal>
  );
};

export default AdminAward;
