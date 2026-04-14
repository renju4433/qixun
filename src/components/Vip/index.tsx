import Discount from '@/components/Vip/Discount';
import { CFBizUri } from '@/constants';
import {
  checkVipState,
  getJSPayUrlRequest,
  getVipPlans,
  jsPayConfirmRequest,
  logServer,
} from '@/services/api';
import { postMessage } from '@/services/js-bridge';
import { qixunGoback } from '@/utils/HisotryUtils';
import { useNavigate, useRequest } from '@@/exports';
import { useModel } from '@umijs/max';
import { Button, Modal, Spin, Typography } from 'antd';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useState } from 'react';
import styles from './style.less';
const { Text } = Typography;

type VipModalProps = {
  open: boolean;
  hide: () => void;
  closable?: boolean;
};
const VipModal: FC<VipModalProps> = ({ open, hide, closable = true }) => {
  const [showOKModal, setShowOKModal] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payQRCodeUrl, setPayQRCodeUrl] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [vipPlans, setVipPlans] = useState<API.GetVipPlanResult | null>(null);
  const navigate = useNavigate();
  const { data: vipExpireDate } = useRequest(checkVipState);

  useEffect(() => {
    getVipPlans().then((res) => {
      if (res.data) setVipPlans(res.data);
    });
  }, []);

  const { isInWeChat, isInApp, isIniOS, user } = useModel(
    '@@initialState',
    (model) => ({
      isInApp: model.initialState?.isInApp,
      isIniOS: model.initialState?.isIniOS,
      isInWeChat: model.initialState?.isInWeChat,
      user: model.initialState?.user,
    }),
  );

  function getQRCode(period: string) {
    getJSPayUrlRequest({ period: period })
      .then((res) => {
        setOrderId(res.data.orderId);
        setPayQRCodeUrl(res.data.qrCodeUrl);
        setPayUrl(res.data.url);
      })
      .catch((e) => {
        if (e.toString().includes('登录')) {
          navigate('/user/login?redirect=/vip');
        }
      });
  }

  function confirmPay() {
    jsPayConfirmRequest({ orderId: orderId ?? '' });
  }

  const showPay: boolean | undefined = true;

  const byVip = (code: string, period: string) => {
    if (isInApp && isIniOS) {
      // Apple 支付暂时下线，仅 userId === 1 可测试
      try {
        logServer({ text: 'open apple buy' });
        postMessage('buy', { code: code });
        setShowOKModal(true);
      } catch (e) {
        Modal.error({ content: '此App版本不支持内购，请升级App' });
      }
    } else {
      getQRCode(period);
      setShowPayModal(true);
    }
  };

  return (
    <>
      <Modal
        centered
        open={open}
        closable={closable}
        title={
          vipExpireDate
            ? `续费我的会员（还有${new BigNumber(vipExpireDate)
              .minus(Date.now())
              .div(24 * 3600 * 1000)
              .toFormat(0)}天到期）`
            : '开通我的会员'
        }
        footer={null}
        onCancel={hide}
        maskClosable={false}
      >
        {showPay && vipPlans && (
          <>
            {vipPlans.hint1 && (
              <div style={{ color: '#fa8c16' }}>{vipPlans.hint1}</div>
            )}
            {vipPlans.hint2 && (
              <div style={{ color: '#fa8c16' }}>{vipPlans.hint2}</div>
            )}
            <div className={styles.buttons}>
              {vipPlans.plans.map((item) => (
                <Button
                  key={item.vipPeriod}
                  onClick={() => byVip(item.appleProductId, item.vipPeriod)}
                >
                  {item.showName}(
                  {item.expectPrice ? (
                    <span
                      style={{
                        padding: '0px 5px',
                        textDecorationLine: 'line-through',
                      }}
                    >
                      ¥{item.expectPrice}
                    </span>
                  ) : (
                    ''
                  )}
                  ¥{item.price}
                  {item.pricePerMonth ? `，合¥${item.pricePerMonth}/月` : ''}
                  {item.extraDays ? (
                    <span>
                      ，
                      <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                        优惠期加送{item.extraDays}天
                      </span>
                    </span>
                  ) : (
                    ''
                  )}
                  )
                </Button>
              ))}
            </div>
          </>
        )}
        会员功能:
        <ul style={{ margin: 0 }}>
          <li>App&网页免广告</li>
          <li>题库&自建题库 </li>
          <li>所有可移动街景</li>
          <li>连胜挑战</li>
          <li>图解</li>
          <li>互动 & 网络迷踪优惠</li>
          {/* <li>街景奇观 (网页)</li> */}
          {/* <li>随机街景 (网页)</li> */}
          <li>个人首页会员标识</li>
          <li>支持棋寻坚持下去</li>
          <li>更多专属权益...</li>
        </ul>
        <Discount></Discount>
        <div>
          <Text type="warning">
            未成年人在进行消费时，应该得到家长或监护人的同意和授权。
          </Text>
        </div>
        如遇充值问题，请关注「棋寻」公众号反馈
        {!closable && (
          <div style={{ paddingTop: '10px', textAlign: 'center' }}>
            <Button
              size="large"
              style={{ margin: '0 auto' }}
              onClick={() => qixunGoback('/')}
            >
              返回棋寻首页
            </Button>
          </div>
        )}
      </Modal>
      <Modal
        open={showOKModal}
        title="充值成功?"
        onCancel={() => {
          setShowOKModal(false);
          hide();
        }}
        onOk={() => {
          setShowOKModal(false);
          hide();
        }}
      >
        <div>请等待外部支付完成，谢谢</div>
        <div>(如支付未弹出，请升级App版本)</div>
        <Text type="warning">
          未成年人在进行消费时，应该得到家长或监护人的同意和授权。
        </Text>
      </Modal>
      <Modal
        title="棋寻会员支付"
        open={showPayModal}
        okText="支付成功"
        onCancel={() => {
          setShowPayModal(false);
          setOrderId(null);
          setPayQRCodeUrl(null);
          setPayUrl(null);
          hide();
        }}
        onOk={() => {
          confirmPay();
          setOrderId(null);
          setPayQRCodeUrl(null);
          setShowPayModal(false);
          setPayUrl(null);
          hide();
        }}
      >
        {isInWeChat && (
          <div style={{ margin: '20px auto', textAlign: 'center' }}>
            <p>检测到在微信中</p>
            <Button
              type="primary"
              onClick={() => {
                if (payUrl) location.href = payUrl;
              }}
            >
              直接支付
            </Button>
          </div>
        )}
        {payQRCodeUrl && (
          <div className={styles.qrCodeContainer}>
            <img
              className={styles.qrCode}
              src={`${CFBizUri}${payQRCodeUrl}?x-oss-process=image/resize,h_400`}
            />
          </div>
        )}
        {!payQRCodeUrl && <Spin />}
        <div className={styles.qrDescribe}>请用微信扫描二维码支付</div>
      </Modal>
    </>
  );
};

export default VipModal;
