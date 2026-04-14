import HeaderLogo from '@/components/Header/Logo';
import Gems from '@/components/Mall/Gems';
import LuckyDraw from '@/components/Mall/LuckyDraw';
import {
  checkGems,
  getCommodities,
  matchAwardRequest,
  orderCommodity,
} from '@/services/api';
import { history as umiHistory } from '@@/core/history';
import { useModel, useSearchParams } from '@umijs/max';
import {
  Button,
  Card,
  Flex,
  Image,
  Modal,
  Segmented,
  Space,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import styles from './style.less';

const Mall = () => {
  const [openRechargeModal, setOpenRechargeModal] = useState<boolean>(false);

  const [commodities, setCommodities] = useState<API.Commodity[]>([]);
  const [gems, setGems] = useState<number>(0);
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [selectedCommodity, setSelectedCommodity] =
    useState<API.Commodity | null>(null);
  const [luckyDrawVisible, setLuckyDrawVisible] = useState<boolean>(false);
  const [commodityType, setCommodityType] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const showGems = !!searchParams.get('gems');
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));
  useEffect(() => {
    if (showGems) setOpenRechargeModal(true);
  }, [showGems]);

  const options = [
    { label: '全部', value: 'all' },
    { label: '头像框', value: 'avatar_frame' },
    { label: '表情', value: 'emoji' },
  ];

  useEffect(() => {
    // 每5秒获取一次 gems
    const interval = setInterval(() => {
      checkGems().then((res) => setGems(res.data));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getCommodities().then((res) => setCommodities(res.data));
    checkGems().then((res) => setGems(res.data));
  }, []);

  const gemImageLink =
    'https://b68v.daai.fun/front/gems.png?x-oss-process=image/resize,h_120';

  return (
    <div className={styles.wrapper}>
      <HeaderLogo canBack={true} className={styles.header} />
      <div className={`${styles.gems} ${isInApp ? styles.inApp : ''}`}>
        <div className={styles.gemsWrap}>
          <div>{gems}</div>
          <Image
            style={{ height: '20px', width: '20px' }}
            preview={false}
            src={gemImageLink}
          />
        </div>
        <Button
          onClick={() => setOpenRechargeModal(true)}
          style={{ marginLeft: '10px' }}
          type="primary"
        >
          充值
        </Button>
      </div>

      <div className={styles.container}>
        <h2 className={styles.title}>商店</h2>
        {/*  <Card size="small">*/}
        {/*    新春福利：宝石奖励。祝大家 新春快乐，事事如意！*/}
        {/*    <Button*/}
        {/*      onClick={() => {*/}
        {/*        springAwardRequest().then((res) => {*/}
        {/*          if (res.data) {*/}
        {/*            message.success('领取 ' + res.data + ' 宝石！');*/}
        {/*            checkGems().then((res) => setGems(res.data));*/}
        {/*          } else message.error(res.errorMessage);*/}
        {/*        });*/}
        {/*      }}*/}
        {/*      style={{ marginLeft: '10px' }}*/}
        {/*    >*/}
        {/*      获取*/}
        {/*    </Button>*/}
        {/*  </Card>*/}
        <Card size="small">
          宝石任务：每天10局积分匹配获20宝石。
          <Button
            onClick={() => {
              matchAwardRequest().then((res) => {
                if (res.data) {
                  message.success('领取成功！');
                  checkGems().then((res) => setGems(res.data));
                } else message.error('领取失败, 不满足条件或者已经领取！');
              });
            }}
            style={{ marginLeft: '10px' }}
          >
            点击获取
          </Button>
        </Card>
        <Segmented
          value={commodityType}
          size="large"
          options={options}
          onChange={(v) => setCommodityType(v)}
        />
        <div style={{ height: '10px' }}></div>
        <div className={styles.list}>
          {commodities
            .filter((x) => commodityType === 'all' || x.type === commodityType)
            .map((item) => (
              <div key={item.id} className={styles.cell}>
                <Flex vertical justify="center" align="center">
                  <Image
                    className={styles.image}
                    src={`https://b68v.daai.fun/${item.icon}?x-oss-process=image/resize,h_120`}
                    preview={{
                      src: `https://b68v.daai.fun/${item.icon}`,
                      mask: false,
                    }}
                  />
                  <div>{item.name}</div>

                  <Space size={1}>
                    {item.drawGems ? <>{item.drawGems}</> : <>{item.gems}</>}
                    <Image
                      style={{ height: '20px', width: '20px' }}
                      preview={false}
                      src={gemImageLink}
                    />
                  </Space>

                  {item.inventory !== null &&
                    `限量 ${item.inventory} / ${item.totalInventory}`}

                  {item.inventory === 0 && (
                    <Button disabled={true}>已售罄</Button>
                  )}
                  {(item.inventory === null || item.inventory > 0) &&
                    (item.drawGems ? (
                      <Button
                        onClick={() => {
                          setSelectedCommodity(item);
                          setLuckyDrawVisible(true);
                        }}
                      >
                        抽奖
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setShowBuyModal(true);
                          setSelectedCommodity(item);
                        }}
                      >
                        购买
                      </Button>
                    ))}
                </Flex>
              </div>
            ))}
        </div>
        <Card
          hoverable
          onClick={() => umiHistory.push('/user/bag')}
          size="small"
          style={{
            marginTop: '30px',
            background: 'inherit',
            padding: 0,
            textAlign: 'center',
            fontSize: '1rem',
            alignContent: 'center',
          }}
        >
          查看已拥有的物品
        </Card>
      </div>

      <Gems open={openRechargeModal} setOpen={setOpenRechargeModal} />

      <Modal
        title="确认购买"
        open={showBuyModal}
        onOk={() => {
          orderCommodity({ id: selectedCommodity!.id })
            .then((res) => {
              if (res.success) {
                message.success('购买成功！');
                setShowBuyModal(false);
                setSelectedCommodity(null);
              }
            })
            .catch((ex) => {
              if (ex.toString().includes('登录')) {
                umiHistory.push(
                  '/user/login?redirect=' + encodeURIComponent(location.href),
                );
              }
            });
        }}
        onCancel={() => {
          setShowBuyModal(false);
          setSelectedCommodity(null);
        }}
      >
        {gems && selectedCommodity?.gems && (
          <>
            <div>现有宝石：{gems}</div>
            <div>消耗宝石：{selectedCommodity.gems}</div>
            <div>剩余宝石：{gems - selectedCommodity.gems}</div>
          </>
        )}
      </Modal>

      {selectedCommodity !== null && (
        <LuckyDraw
          commodity={selectedCommodity}
          gems={gems}
          setGems={setGems}
          visible={luckyDrawVisible}
          setVisible={setLuckyDrawVisible}
        />
      )}
    </div>
  );
};

export default Mall;
