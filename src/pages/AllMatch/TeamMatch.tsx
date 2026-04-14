import InviteFriend from '@/components/Game/Party/InviteFriend/InviteFriendModal';
import TeamUser from '@/components/Match/TeamUser';
import Tips from '@/components/Match/Tips';
import { baseWSURL } from '@/constants';
import {
  changeTeamCaptain,
  disbandTeam,
  getTeamData,
  inviteFriendTeam,
  leaveTeam,
  matchCancelMatch,
  matchStartMatch,
  setTeamType,
} from '@/services/api';
import { qixunCopy } from '@/utils/CopyUtils';
import { qixunGoHome } from '@/utils/HisotryUtils';
import { UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { history, useModel, useNavigate } from '@umijs/max';
import { useWebSocket } from 'ahooks';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import {
  Alert,
  Button,
  Divider,
  Dropdown,
  Flex,
  Input,
  message,
  Modal,
  Popconfirm,
  QRCode,
  Spin,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import styles from './style.less';

const { Link, Text, Title } = Typography;

const subscribeMessage = (teamId: string) =>
  JSON.stringify({
    data: { type: 'subscribe_team', text: teamId },
    scope: 'qixun',
  });

// 心跳指令
const heartBeatMessage = JSON.stringify({ scope: 'heart_beat' });

const TeamMatch = () => {
  const [teamInfo, setTeamInfo] = useState<API.TeamInfo | null>(null);
  const [inviteFriendVisible, setInviteFriendVisible] = useState<boolean>(false);
  const [type, setType] = useState<string>();
  const [showCode, setShowCode] = useState<boolean>(false);

  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const navigate = useNavigate();

  const init = () => {
    getTeamData().then((res) => {
      if (res.success) {
        setTeamInfo(res.data);
        setType(res.data.type || 'world');
      } else message.error('获取队伍信息失败，请稍后再试');
    });
  };

  const { sendMessage, readyState, latestMessage, connect, disconnect } =
    useWebSocket(`${baseWSURL}/v0/qixun`, {
      manual: true,
      reconnectLimit: 10,
      reconnectInterval: 3000,
      onError: (event) => {
        console.error('WebSocket连接错误，将自动重连:', event);
      },
      onClose: (event) => {
        console.log('WebSocket连接关闭，将自动重连');
      },
    });

  useEffect(() => {
    init();
    connect();

    return () => {
      if (teamInfo?.id && teamInfo.status === 'match') {
        matchCancelMatch({ teamId: teamInfo?.id });
      }
    };
  }, []);

  const [heartBeatInterval, setHeartBeatInterval] = useState<NodeJS.Timeout>();

  // 发送订阅指令
  const sendSubscribeMessage = (gid: string) => {
    try {
      sendMessage(subscribeMessage(gid));
    } catch (ex) { }
  };

  // 发送心跳指令
  const sendHeartBeatMessage = () => {
    try {
      sendMessage(heartBeatMessage);
    } catch (ex) { }
  };

  useEffect(() => {
    if (readyState === ReadyState.Open && teamInfo?.id) {
      sendSubscribeMessage(teamInfo.id);
      setHeartBeatInterval(setInterval(sendHeartBeatMessage, 2000));
    } else if (readyState === ReadyState.Closed) {
      if (heartBeatInterval) {
        clearInterval(heartBeatInterval);
        connect();
      }
    }
  }, [readyState, teamInfo?.id]);

  useEffect(() => {
    if (latestMessage) {
      const { data } = latestMessage;
      try {
        const messageWS = JSON.parse(data);
        if (messageWS.scope === 'qixun_team') {
          setTeamInfo(messageWS.data.team);

          if (messageWS.data.code === 'start_game') {
            history.push('/solo/' + messageWS.data.team.gameId);
          }
          if (messageWS.data.code === 'type_change') {
            setType(messageWS.data.team.type);
          }
          if (
            messageWS.data.code === 'captain_change' &&
            messageWS.data.team.captain.userId === user?.userId
          ) {
            message.info('你已成为新的队长');
          }
        }
      } catch (error) {
        // JSON解析失败，不处理
      }
    }
  }, [latestMessage]);

  const LeaveTeam = teamInfo && (
    <Popconfirm
      title="离开队伍"
      description="是否确认离开队伍？"
      onConfirm={() => {
        leaveTeam({ teamId: teamInfo.id }).then((res) => {
          if (res.success) {
            message.success('离队成功，回到首页');
            qixunGoHome();
          }
        });
      }}
      okText="确认"
      cancelText="取消"
    >
      <Button danger>离开队伍</Button>
    </Popconfirm>
  );

  const DisbandTeam = teamInfo && (
    <Popconfirm
      title="解散队伍"
      description="是否确认解散队伍？"
      onConfirm={() => {
        disbandTeam({ teamId: teamInfo.id }).then((res) => {
          if (res.success) {
            message.success('解散成功，回到首页');
            qixunGoHome();
          }
        });
      }}
      okText="确认"
      cancelText="取消"
    >
      <Button danger>解散队伍</Button>
    </Popconfirm>
  );

  return (
    <Flex vertical style={{ textAlign: 'center' }} gap="middle">
      <Alert
        type="warning"
        message={
          <>
            在娱乐/组队匹配中搜索题中信息/查询手机号归属地均属
            <a
              href="https://www.yuque.com/chaofun/qixun/rules"
              target="_blank"
              rel="noopener noreferrer"
            >
              作弊行为
            </a>
          </>
        }
      />
      <Text type="secondary">
        提示：可选中国/全球，可单人/多人匹配，根据隐藏分匹配对手；随机题库，不计算积分
      </Text>

      {teamInfo && (
        <>
          <Flex align="center" gap="middle" vertical>
            {teamInfo.status !== 'disband' && (
              <Flex align='center' justify='center' gap="small" wrap="wrap">
                <Button onClick={() => qixunCopy('https://saiyuan.top/teamJoin/' + teamInfo.id)}>
                  邀请链接
                </Button>
                <Button onClick={() => setShowCode(true)}>队伍码</Button>
                <Button onClick={() => setInviteFriendVisible(true)}>邀请好友</Button>
              </Flex>
            )}

            {teamInfo.status === "wait_join" && (
              <Text
                strong
                style={{
                  color: type === 'china' ? '#ff6b6b' : '#4dabf7',
                  fontSize: '1.25rem',
                }}
              >
                当前模式：{type === 'china' ? '中国' : '全球'}
              </Text>
            )}

            {teamInfo.status === 'wait_join' && (
              user?.userId === teamInfo.captain.userId ? (
                <Flex align='center' gap="large" vertical>
                  <Flex justify='center' gap="small" wrap="wrap">
                    <Button
                      onClick={() => {
                        const newType = type === 'china' ? 'world' : 'china';
                        setTeamType({
                          teamId: teamInfo.id,
                          type: newType,
                        }).then((res) => {
                          if (res.success) {
                            setType(res.data.type);
                            message.success('已切换为' + (newType === 'china' ? '中国' : '全球') + '模式');
                          }
                        });
                      }}
                      type="dashed"
                    >
                      切换{type === 'china' ? '全球' : '中国'}
                    </Button>
                    {DisbandTeam}
                  </Flex>
                  <Button
                    size="large"
                    type="primary"
                    onClick={() => matchStartMatch({ teamId: teamInfo.id })}
                    style={{ margin: '1rem 0' }}
                  >
                    开始{type === 'china' ? '中国' : '全球'}匹配
                  </Button>
                </Flex>
              ) : (
                LeaveTeam
              )
            )}

            {teamInfo.status === 'match' && (
              <>
                <Spin
                  size="large"
                  tip={`正在${type === 'china' ? '中国' : '全球'}匹配`}
                >
                  <div style={{ height: '100px', minWidth: '400px' }}></div>
                </Spin>
                <Tips />
                {user?.userId === teamInfo.captain.userId ? (
                  <Button onClick={() => matchCancelMatch({ teamId: teamInfo?.id })}>
                    取消匹配
                  </Button>
                ) : LeaveTeam}
              </>
            )}

            {teamInfo.status === 'ongoing' && (
              <Flex align='center' justify='center' vertical gap="large">
                <Button
                  size="large"
                  type="primary"
                  onClick={() => history.push('/solo/' + teamInfo.gameId)}
                >
                  立即回到对局
                </Button>
                {user?.userId === teamInfo.captain.userId ? DisbandTeam : LeaveTeam}
              </Flex>
            )}

            {teamInfo.status === 'disband' ? (
              <Flex vertical gap="middle">
                队伍已解散～
                <Button
                  size="large"
                  type="primary"
                  onClick={() => leaveTeam({ teamId: teamInfo.id }).then(init)}
                >
                  离开自己创建
                </Button>
                <Button
                  size="large"
                  type="primary"
                  onClick={() => setShowCode(true)}
                >
                  加入其他队伍
                </Button>
              </Flex>
            ) : (
              <Flex justify="center" gap="middle" wrap="wrap">
                {teamInfo.players.map((usr) => (
                  <Dropdown
                    key={usr.userId}
                    menu={{
                      items: [
                        {
                          key: 'profile',
                          label: '查看首页',
                          icon: <UserOutlined />,
                          onClick: () => navigate(`/user/${usr.userId}`),
                        },
                        {
                          key: 'transfer',
                          label: '转让队长',
                          icon: <UserSwitchOutlined />,
                          danger: true,
                          onClick: () => {
                            changeTeamCaptain({
                              teamId: teamInfo.id,
                              userId: usr.userId,
                            }).then((res) => {
                              if (res.success) {
                                message.success(`已将队长转让给 ${usr.userName}`);
                              }
                            });
                          }
                        },
                      ].slice(
                        0,
                        user?.userId === usr.userId ||
                          user?.userId !== teamInfo.captain.userId
                          ? 1
                          : 2,
                      ),
                    }}
                    trigger={['click']}
                  >
                    <div className={styles.user}>
                      <TeamUser
                        user={usr}
                        size={60}
                        suffix={usr.userId === teamInfo.captain.userId ? '队长' : ''}
                      />
                    </div>
                  </Dropdown>
                ))}
              </Flex>
            )}
          </Flex>

          <InviteFriend
            open={inviteFriendVisible}
            onClose={() => setInviteFriendVisible(false)}
            onClick={(userId) => {
              inviteFriendTeam({ friend: userId, teamId: teamInfo.id }).then((res) => {
                if (res.success) message.success('邀请成功');
              });
            }}
          />

          <Modal
            title="队伍码"
            open={showCode}
            onCancel={() => setShowCode(false)}
            onClose={() => setShowCode(false)}
            footer={null}
          >
            <Flex align="center" vertical>
              <Flex align="center" justify="center" gap="middle" wrap="wrap">
                <QRCode
                  value={`https://saiyuan.top/teamJoin/${teamInfo.joinCode}`}
                  size={120}
                />
                <Flex align="center" vertical>
                  <Text strong style={{ fontSize: 28, letterSpacing: 4 }}>
                    {teamInfo.joinCode}
                  </Text>
                  <Text>
                    打开 <Link href="https://saiyuan.top/match" target="_blank">saiyuan.top/match</Link> 输入队伍码
                  </Text>
                </Flex>
              </Flex>
              <Divider style={{ margin: '1rem 0' }} />
              <Title level={4}>输入队伍码加入其他队伍</Title>
              <Input.OTP
                size="large"
                onChange={(value) => {
                  if (value.length === 6) navigate(`/teamJoin/${value}`);
                }}
              />
            </Flex>
          </Modal>
        </>
      )}
    </Flex>
  );
};

export default TeamMatch;