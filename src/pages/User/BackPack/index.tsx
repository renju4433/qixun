import Gems from '@/components/Mall/Gems';
import NormalPage from '@/pages/NormalPage';
import {
  checkGems,
  getOwnedItems,
  hideAvatarFrameRequest,
  wearAvatarFrame,
} from '@/services/api';
import { useModel, useNavigate } from '@umijs/max';
import {
  Button,
  Card,
  Flex,
  Image,
  Segmented,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import styles from './style.less';

const Backpack = () => {
  const navigator = useNavigate();
  // 用户拥有的物品
  const [ownedItems, setOwnedItems] = useState<API.Commodity[]>([]);
  // 当前佩戴的头像框ID
  // const [currentAvatarFrameId, setCurrentAvatarFrameId] = useState<number>();
  // 商品分类
  const [itemType, setItemType] = useState<string>('all');
  const [gems, setGems] = useState<number>(0);
  const [openRechargeModal, setOpenRechargeModal] = useState<boolean>(false);
  const { user, isInApp /* isIniOS, isInWeChat */ } = useModel(
    '@@initialState',
    (model) => ({
      user: model.initialState?.user,
      isInApp: model.initialState?.isInApp,
      // isIniOS: model.initialState?.isIniOS,
      // isInWeChat: model.initialState?.isInWeChat,
    }),
  );

  const options = [
    { label: '全部', value: 'all' },
    { label: '头像框', value: 'avatar_frame' },
    { label: '表情', value: 'emoji' },
  ];

  useEffect(() => {
    if (!user) {
      navigator('/user/login?redirect=%2Fuser%2Fbag');
    } else {
      // 请求API获取用户当前拥有的物品
      getOwnedItems({ userId: user.userId, type: 'all' }).then((res) => {
        setOwnedItems(res.data);
      });
      checkGems().then((res) => setGems(res.data));
    }
  }, []);

  const gemImageLink =
    'https://b68v.daai.fun/front/gems.png?x-oss-process=image/resize,h_120';

  return (
    <NormalPage feedbackButton={false}>
      <Typography.Title
        level={3}
        style={{
          margin: 0,
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 'inherit',
        }}
      >
        {user?.userName} 的背包
      </Typography.Title>
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

      <div style={{ marginBottom: '10px' }}>
        <Button
          onClick={() => {
            hideAvatarFrameRequest().then((res) => {
              if (res.success) message.success('卸下成功！');
              else message.error('卸下失败，请重试');
            });
          }}
        >
          卸下头像框
        </Button>
      </div>
      <Segmented
        value={itemType}
        size="large"
        options={options}
        onChange={(v) => {
          setItemType(v.toString());
          ownedItems.filter((x) => x.type === v.toString());
        }}
        style={{ margin: '0.5rem 0' }}
      />

      <div className={styles.list}>
        {ownedItems
          .filter((x) => itemType === 'all' || x.type === itemType)
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
                {item.type === 'avatar_frame' && (
                  <Button
                    type="default"
                    onClick={() => {
                      wearAvatarFrame({
                        commodityId: item.id,
                        userId: user!.userId,
                      })
                        .then((res) => {
                          if (res.success) message.success('佩戴成功！');
                          else message.error('佩戴失败，请重试');
                        })
                        .catch(() => message.error('网络异常，请咨询管理员'));
                    }}
                  >
                    佩戴
                  </Button>
                )}
              </Flex>
            </div>
          ))}
      </div>

      <Card
        hoverable
        onClick={() => navigator('/mall')}
        bodyStyle={{ padding: '1rem' }}
        style={{
          background: 'inherit',
          margin: '1rem 0',
          padding: 0,
          textAlign: 'center',
          fontSize: '1rem',
          alignContent: 'center',
        }}
      >
        没有更多物品了？去商城
      </Card>

      <Gems open={openRechargeModal} setOpen={setOpenRechargeModal} />
    </NormalPage>
  );
};

export default Backpack;
