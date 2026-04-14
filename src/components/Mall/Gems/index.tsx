import Discount from '@/components/Vip/Discount';
import {
  getGemsPlans,
  getGmesJSPayUrl,
  jsPayConfirmRequest,
} from '@/services/api';
import { postMessage } from '@/services/js-bridge';
import { useModel } from '@umijs/max';
import { Button, Image, Modal, Typography } from 'antd';
import { useEffect, useState } from 'react';

const { Text } = Typography;

type GemsProps = {
  open: boolean;
  setOpen: (show: boolean) => void;
};

const Gems = ({ open, setOpen }: GemsProps) => {
  const [showOKModal, setShowOKModal] = useState<boolean>(false);
  const [qrCodeUrl, setQRCodeURl] = useState<string | null>('');
  const [payUrl, setPayUrl] = useState<string | null>('');
  const [choosePlan, setChoosePlan] = useState<number | null>(null);
  const [plans, setPlans] = useState<API.GetGemsPlanResult>();
  const [orderId, setOrderId] = useState<string | null>(null);

  const { isInApp, isIniOS, isInWeChat, user } = useModel(
    '@@initialState',
    (model) => ({
      isInApp: model.initialState?.isInApp,
      isIniOS: model.initialState?.isIniOS,
      isInWeChat: model.initialState?.isInWeChat,
      user: model.initialState?.user,
    }),
  );

  useEffect(() => {
    getGemsPlans().then((res) => setPlans(res.data));
  }, [open]);

  useEffect(() => {
    if (choosePlan) {
      getGmesJSPayUrl({ planId: choosePlan }).then((res) => {
        setQRCodeURl(res.data.qrCodeUrl);
        setPayUrl(res.data.url);
        setOrderId(res.data.orderId);
      });
    } else {
      setQRCodeURl(null);
      setPayUrl(null);
    }
  }, [choosePlan]);

  return (
    <>
      <Modal
        title="宝石充值"
        onCancel={() => {
          setPayUrl(null);
          setQRCodeURl(null);
          setOrderId(null);
          setChoosePlan(null);
          setOpen(false);
        }}
        onOk={() => {
          jsPayConfirmRequest({ orderId: orderId ?? '' });
          setPayUrl(null);
          setQRCodeURl(null);
          setOrderId(null);
          setChoosePlan(null);
          setOpen(false);
        }}
        okText="付款成功"
        okButtonProps={!choosePlan ? { style: { display: 'none' } } : {}}
        open={open}
      >
        {choosePlan && qrCodeUrl && (
          <>
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
            <Image
              src={`https://b68v.daai.fun/${qrCodeUrl}?x-oss-process=image/resize,h_200`}
              style={{ margin: 'auto' }}
            />
            <div>请用微信扫码付款，支持截图扫码</div>
            <div>任何支付相关的问题请关注「棋寻」公众号反馈</div>

            <Text type="warning">
              未成年人在进行消费时，应该得到家长或监护人的同意和授权。
            </Text>
          </>
        )}

        {!choosePlan && (
          <div>
            {plans?.hint1 && (
              <div style={{ color: '#fa8c16' }}>{plans.hint1}</div>
            )}
            {plans?.hint2 && (
              <div style={{ color: '#fa8c16' }}>{plans.hint2}</div>
            )}
            <div style={{ gap: '10px', display: 'flex', flexWrap: 'wrap' }}>
              <Text type="warning">
                未成年人在进行消费时，应该得到家长或监护人的同意和授权。
              </Text>
              {plans &&
                plans.plans &&
                plans.plans.map((plan) => (
                  <Button
                    key={plan.id}
                    onClick={() => {
                      if (!(isInApp && isIniOS)) setChoosePlan(plan.id);
                      else {
                        // Apple 支付暂时下线，仅 userId === 1 可测试
                        try {
                          postMessage('buy', { code: plan.appleProductId });
                          setShowOKModal(true);
                        } catch (e) {
                          Modal.error({ content: '此App版本不支持内购，请升级App' });
                        }
                      }
                    }}
                  >{`${plan.gems}${plan.awardGems ? `+${plan.awardGems}` : ''
                    }宝石(¥${plan.price})`}</Button>
                ))}
            </div>
            宝石用途：
            <ul>
              <li>购买头像框/表情</li>
              <li>图解功能消耗</li>
              <li>互动功能消耗</li>
              <li>网络迷踪功能消耗</li>
              <li>更多功能...</li>
            </ul>
            <Discount></Discount>
          </div>
        )}
      </Modal>

      <Modal
        open={showOKModal}
        title="充值成功?"
        onCancel={() => {
          setShowOKModal(false);
          setOpen(false);
        }}
        onOk={() => {
          setShowOKModal(false);
          setOpen(false);
        }}
      >
        <div>请等待外部支付完成，谢谢</div>
        <div>(如支付未弹出，请升级App版本)</div>
        <Text type="warning">
          未成年人在进行消费时，应该得到家长或监护人的同意和授权。
        </Text>
      </Modal>
    </>
  );
};

export default Gems;
