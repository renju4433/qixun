import { drawLottery, getUserDrawRequest } from '@/services/api';
import { Button, Flex, Image, Modal, Space, Typography } from 'antd';
import { FC, useEffect, useState } from 'react';

const { Text, Paragraph, Title } = Typography;
type LuckyDrawProps = {
  commodity: API.Commodity;
  gems: number;
  setGems: (gems: number) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

const LuckyDraw: FC<LuckyDrawProps> = ({
  commodity,
  gems,
  setGems,
  visible,
  setVisible,
}) => {
  const [luckyDrawResult, setLuckyDrawResult] =
    useState<API.drawLotteryResult>();
  const [count, setCount] = useState<number>(0);
  const gemImageLink =
    'https://b68v.daai.fun/front/gems.png?x-oss-process=image/resize,h_120';

  const getUserDraw = () => {
    getUserDrawRequest({ commodityId: commodity.id }).then((res) => {
      setCount(res.data);
    });
  };

  const handleDraw = (drawCount: number) => {
    drawLottery({ draws: drawCount, commodityId: commodity.id }).then((res) => {
      if (res.success) {
        setLuckyDrawResult(res.data);
        setGems(gems - commodity.drawGems! * drawCount);
        getUserDraw();
      }
    });
  };

  useEffect(() => {
    if (visible) getUserDraw();
    else setLuckyDrawResult(undefined);
  }, [visible]);

  return (
    <Modal open={visible} footer={null} onCancel={() => setVisible(false)}>
      <Flex vertical justify="center" align="center" gap="small">
        <Image
          src={`https://b68v.daai.fun/${commodity.icon}`}
          width={200}
          height={200}
          preview={{ mask: false }}
        />
        <Title level={5} style={{ margin: 0, padding: 0 }}>
          {commodity.name}
        </Title>
        {!!count && <Text>已抽 {count} 次</Text>}
        <Space size="large">
          <Text>
            抽中概率
            <Text type="warning" style={{ fontSize: '20px' }}>
              {(commodity.probability! * 100).toFixed(2)}%
            </Text>
          </Text>
          <Text>
            保底
            <Text type="warning" style={{ fontSize: '20px' }}>
              {commodity.drawGuaranteed}
            </Text>
            次抽中
          </Text>
        </Space>
        <Text type="secondary">未中奖也有随机时长会员返还~</Text>

        <Space align="center">
          {[1].map((num) => (
            <Button
              key={num}
              type="primary"
              size="large"
              onClick={() => handleDraw(num)}
            >
              {num === 1 ? '抽一次' : `${num}连抽`}(
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {commodity.drawGems! * num}
                <Image
                  style={{ height: '25px', width: '25px' }}
                  src={gemImageLink}
                  preview={false}
                />
                )
              </span>
            </Button>
          ))}
        </Space>

        {luckyDrawResult && (
          <Flex vertical style={{ marginTop: '1rem' }}>
            <Title level={5} style={{ textAlign: 'center' }}>
              抽奖结果
            </Title>

            <Paragraph style={{ textAlign: 'center', margin: 0 }}>
              {luckyDrawResult.vipMinutes ? (
                <Text style={{ fontSize: '16px' }}>
                  获得{luckyDrawResult.vipMinutes}分钟会员返还~
                </Text>
              ) : null}
            </Paragraph>

            <Paragraph>
              {luckyDrawResult.isWin ? (
                luckyDrawResult.winTimes === 1 ? (
                  <Text type="success" style={{ fontSize: '18px' }}>
                    恭喜你抽中{commodity.name}!
                  </Text>
                ) : (
                  <Text type="success" style={{ fontSize: '18px' }}>
                    恭喜你抽中{luckyDrawResult.winTimes}次{commodity.name}!
                    <Paragraph
                      type="secondary"
                      style={{ margin: 0, fontSize: '16px' }}
                    >
                      (多余的商品已兑换成宝石返还~)
                    </Paragraph>
                  </Text>
                )
              ) : (
                <Text type="warning" style={{ fontSize: '18px' }}>
                  很遗憾，没有抽中{commodity.name}……
                </Text>
              )}
            </Paragraph>
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};

export default LuckyDraw;
