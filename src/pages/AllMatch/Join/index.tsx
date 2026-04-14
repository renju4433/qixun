import NormalPage from '@/pages/NormalPage';
import { joinTeam, joinTeamByCode } from '@/services/api';
import { Button, Flex, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const TeamJoin = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    const handleNeedLogin = () => {
      message.error('请先登录');
      navigate('/user/login?redirect=' + window.location.pathname);
    };

    const handleNotFound = () => setNotFound(true);

    const handleSuccess = (res: any) => {
      if (res.success) {
        if (res.data.status === 'disband') {
          message.info('队伍已解散，去自己创建');
        }
        navigate('/match?tab=team');
        return;
      }
      if (res.info?.errorCode === 'not_found') handleNotFound();
    };

    const handleError = (error: any) => {
      if (error.info?.errorCode === 'need_login') handleNeedLogin();
      if (error.info?.errorCode === 'not_found') handleNotFound();
    };

    if (teamId!.length > 6) joinTeam({ teamId: teamId! }).then(handleSuccess).catch(handleError);
    else joinTeamByCode({ joinCode: teamId! }).then(handleSuccess).catch(handleError);

  }, [teamId]);

  return (
    <NormalPage title="加入队伍">
      <br />
      {notFound ? (
        <Flex vertical gap="middle" style={{ textAlign: 'center', alignItems: 'center' }}>
          队伍不存在～
          <Button size="large" type="primary" onClick={() => navigate('/match?tab=team')}>
            去娱乐/组队匹配
          </Button>
        </Flex>
      ) : (
        <Spin size="large" tip="加入队伍中">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              marginTop: '1rem',
            }}
          />
        </Spin>
      )}
    </NormalPage>
  );
};

export default TeamJoin;