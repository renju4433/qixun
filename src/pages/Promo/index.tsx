import Gems from '@/components/Mall/Gems';
import VipModal from '@/components/Vip';
import { summerPromoDetails } from '@/pages/Promo/promo';
import { checkGems, checkVipState } from '@/services/api';
// import { useModel } from '@umijs/max';
import { Button, Card, Divider, Flex, Image, List, Typography } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
// import { history as umiHistory } from 'umi';
import NormalPage from '../NormalPage';

const { Title, Text, Paragraph } = Typography;

const gemImageLink =
  'https://b68v.daai.fun/front/gems.png?x-oss-process=image/resize,h_120';

const SummerPromoPage = () => {
  // const history = umiHistory;
  /* const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  })); */

  const [showMemberModal, setShowMemberModal] = useState<boolean>(false);
  const [showGemModal, setShowGemModal] = useState<boolean>(false);
  const [gems, setGems] = useState<number>(0);
  const [vipExpire, setVipExpire] = useState<number>(0);
  const [isPromoActive, setIsPromoActive] = useState<boolean>(false);
  const [promoStatusMessage, setPromoStatusMessage] = useState<string>('');

  useEffect(() => {
    /* if (!user) {
    } else { */
    // setNow(moment().unix());
    checkVipState().then((res) => {
      if (res.success && res.data) {
        setVipExpire(res.data);
      }
    });
    checkGems().then((res) => {
      if (res.success && res.data) {
        setGems(res.data);
      }
    });

    const now = moment().unix();
    const promoStart = moment('2024-06-28 00:00:00').unix();
    const promoEnd = moment('2024-07-09 00:00:00').unix();
    let promoStatusMessage = '';

    if (now < promoStart) {
      const hoursUntilStart = (promoStart - now) / 3600;
      if (hoursUntilStart < 24) {
        setPromoStatusMessage(
          `促销将于${Math.ceil(hoursUntilStart)}小时后开始！`,
        );
      } else {
        const daysUntilStart = (promoStart - now) / 86400;
        setPromoStatusMessage(`${Math.ceil(daysUntilStart)}天后开始促销！`);
      }
    } else if (now >= promoStart && now < promoEnd) {
      const hoursUntilEnd = (promoEnd - now) / 3600;
      if (hoursUntilEnd < 24) {
        setPromoStatusMessage(`仅剩${Math.ceil(hoursUntilEnd)}小时就结束啦！`);
      } else {
        const daysUntilEnd = (promoEnd - now) / 86400;
        setPromoStatusMessage(`仅剩${Math.ceil(daysUntilEnd)}天就结束啦！`);
      }
      setIsPromoActive(true);
    } else {
      setIsPromoActive(false);
    }
    //}
  }, []);

  // Calculate promotion status using Unix timestamps

  return (
    <NormalPage>
      <Title level={2}>棋寻两周年夏促计划(已结束)</Title>
      <Text type="secondary" style={{ margin: 0 }}>
        活动时间：6月28日0点 至 7月9日0点，持续11天。
      </Text>
      <Text type="warning" style={{ margin: 0 }}>
        {promoStatusMessage}
      </Text>
      <Flex
        gap="small"
        justify="space-between"
        wrap="wrap"
        style={{ marginTop: '20px' }}
      >
        <Card
          title={
            <Flex gap="small" align="center">
              <Title level={4} style={{ margin: 0 }}>
                会员
              </Title>
              <Text type="secondary" style={{ fontWeight: 'initial' }}>
                {vipExpire
                  ? `${moment(vipExpire).format('YYYY年MM月DD日')}到期`
                  : `开通会员可享受促销优惠`}
              </Text>
              <Button
                type="primary"
                onClick={() => setShowMemberModal(true)}
                disabled={!isPromoActive}
              >
                {vipExpire ? '续费' : '开通'}
              </Button>
            </Flex>
          }
          bordered={false}
          headStyle={{ padding: 15, width: 310 }}
          bodyStyle={{ padding: 10 }}
        >
          <List
            itemLayout="horizontal"
            dataSource={summerPromoDetails.filter(
              (item) => item.type === '会员',
            )}
            renderItem={(item) => (
              <List.Item style={{ padding: 5, border: 'none' }}>
                <List.Item.Meta
                  title={
                    <Paragraph style={{ margin: 0 }}>
                      {item.price}元 购买
                      <Text type="warning">{item.duration}会员</Text>：
                      <Text type="success">赠送{item.extra}天</Text>
                      <Divider style={{ margin: '10px 0 0' }} />
                    </Paragraph>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
        <Card
          title={
            <Flex gap="small" align="center">
              <Image src={gemImageLink} width={24} preview={false} />
              <Title level={4} style={{ margin: 0 }}>
                宝石
              </Title>
              <Text type="secondary" style={{ fontWeight: 'initial' }}>
                {gems ? `您现有${gems}个宝石` : `登录后查看宝石数量`}
              </Text>
              <Button
                type="primary"
                onClick={() => setShowGemModal(true)}
                disabled={!isPromoActive}
              >
                购买
              </Button>
            </Flex>
          }
          bordered={false}
          headStyle={{ padding: 15, width: 310 }}
          bodyStyle={{ padding: 10 }}
        >
          <List
            itemLayout="horizontal"
            dataSource={summerPromoDetails.filter(
              (item) => item.type === '宝石',
            )}
            renderItem={(item) => (
              <List.Item style={{ padding: 5, border: 'none' }}>
                <List.Item.Meta
                  title={
                    <Paragraph style={{ margin: 0 }}>
                      {item.price}元 购买
                      <Text type="warning">{item.amount}个宝石</Text>：
                      <Text type="success">赠送{item.extra}个</Text>
                      <Divider style={{ margin: '10px 0 0' }} />
                    </Paragraph>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Flex>

      <VipModal open={showMemberModal} hide={() => setShowMemberModal(false)} />
      <Gems open={showGemModal} setOpen={setShowGemModal} />
    </NormalPage>
  );
};

export default SummerPromoPage;
