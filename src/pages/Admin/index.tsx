import AdminAward from '@/components/Admin/Award';
import DC from '@/components/Admin/DC';
import NormalPage from '@/pages/NormalPage';
import { history, useModel } from '@umijs/max';
import { Button, Divider, Flex, Modal, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import BanUser from '../../components/Admin/Ban';
import Bind from '../../components/Admin/Bind';
import SendAdminMessage from '../../components/Admin/Message';
import ClearUserInfo from '@/components/Admin/ClearUserInfo';
import TipsManage from '@/components/Admin/TipsManage';

const Admin = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));
  const [showSend, setShowSend] = useState<boolean>(false);
  const [showBan, setShowBan] = useState<boolean>(false);
  const [showDCBan, setShowDCBan] = useState<boolean>(false);
  const [showAward, setShowAward] = useState<boolean>(false);
  const [showClearUserInfo, setShowClearUserInfo] = useState<boolean>(false);
  const [showBulletin, setShowBulletin] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);
  const showDCs = [259117, 65640, 1];
  // const [pendingReviews, setPendingReviews] = useState<number>(0);

  useEffect(() => {
    if (!user) history.push('/user/login?redirect=/qixunAdmin');
    // else {
    //   generateQueue().then((data) => {
    //     if (data.data !== null) {
    //       setPendingReviews(data.data.totalCount);
    //     } else {
    //       message.error('获取待审核队列失败');
    //       console.log(data.errorMessage);
    //     }
    //   });
    // }
  }, []);

  return (
    <NormalPage>
      <Bind />
      <Divider />
      <Button type="primary" size="large" onClick={() => setShowBulletin(true)}>
        文档&公告牌
      </Button>
      <Divider />
      <Flex justify="space-between">
        <Flex align='start' gap={5} vertical>
          <h2>志愿者</h2>
          <Button onClick={() => history.push('/panofilter')} size="large">
            街景审核
          </Button>
          {/* <Button
            onClick={() => (location.href = 'https://saiyuan.top/wonders-filter')}
            size="large"
          >
            街景奇观审核
          </Button> */}
          <Button onClick={() => history.push('/review/userInfo')} size="large">
            个人信息审核
          </Button>
          <Button onClick={() => setShowClearUserInfo(true)} size="large">
            个人信息重置
          </Button>
          <Button onClick={() => history.push('/reportReview')} size="large">
            志愿者举报处理
          </Button>
        </Flex>
        <Flex align='start' gap={5} vertical>
          <h2>管理员</h2>
          <Button onClick={() => setShowBan(true)} size="large">
            用户封禁
          </Button>
          <Button onClick={() => setShowDCBan(true)} size="large">
            日挑封禁
          </Button>
          <Button onClick={() => history.push('/reportSolve')} size="large">
            管理员举报审核
          </Button>
          <Button onClick={() => history.push('/logReview')} size="large">
            记录审核
          </Button>
          <Button onClick={() => history.push('/appealManage')} size="large">
            申诉管理
          </Button>
          <Button onClick={() => setShowTips(true)} size="large">
            提示管理
          </Button>
        </Flex>
        <Flex align='start' gap={5} vertical>
          <h2>其他</h2>
          {showDCs.includes(user?.userId ?? 0) && (
            <>
              <Button onClick={() => setShowSend(true)} size="large">
                管理私信
              </Button>
              <Button onClick={() => setShowAward(true)} size="large">
                奖励发放
              </Button>
              <Button onClick={() => history.push('/achieveManage')} size="large">
                成就管理
              </Button>
            </>
          )}
        </Flex>
      </Flex>

      <AdminAward show={showAward} setShow={setShowAward} />
      <BanUser show={showBan} setShow={setShowBan} />
      <ClearUserInfo show={showClearUserInfo} setShow={setShowClearUserInfo} />
      <DC show={showDCBan} setShow={setShowDCBan} />
      <SendAdminMessage show={showSend} setShow={setShowSend} />
      <TipsManage show={showTips} setShow={setShowTips} />
      <Modal
        title="文档&公告牌"
        open={showBulletin}
        onCancel={() => setShowBulletin(false)}
        footer={null}
        width={700}
      >
        <Tabs
          items={[
            {
              key: 'volunteer',
              label: '志愿者',
              children: (
                <p>志愿者可以进行街景/个人信息/和举报审核，志愿者群：347667887</p>
              ),
            },
            {
              key: 'admin',
              label: '管理员',
              children: (
                <p>管理员可以对用户封禁，记录审核，提示管理，官方 QQ 群管理。</p>
              ),
            },
          ]}
        />
      </Modal>
    </NormalPage>
  );
};

export default Admin;