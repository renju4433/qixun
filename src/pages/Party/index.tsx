import MapPicker from '@/components/Game/MapPicker';
import MapSetting from '@/components/Game/MapSetting';
import MatchType from '@/components/Game/MatchTypePicker';
import InviteFriend from '@/components/Game/Party/InviteFriend/InviteFriendModal';
import InviteModal from '@/components/Game/Party/InviteModal/InviteModal';
import UserAvatar from '@/components/Game/UserAvatar';
import EmptyAvatar from '@/components/Game/UserAvatar/Empty';
import HeaderLogo from '@/components/Header/Logo';
import { PartyEmoji } from '@/components/Map/Emoji';
import WarningChecker from '@/components/TimeChekcer';
import {
  endParty,
  inviteFriendParty,
  leaveParty,
  startParty,
} from '@/services/api';
import { qixunGoHome } from '@/utils/HisotryUtils';
import { HourglassTwoTone, SwapOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Divider, Modal, Space, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styles from './style.less';

const Party = () => {
  const { me } = useModel('@@initialState', (model) => ({
    me: model.initialState?.user,
  }));

  const [inviteModalVisible, setInviteModalVisible] = useState<boolean>(false);
  const [inviteFriendVisible, setInviteFriendVisible] =
    useState<boolean>(false);

  const {
    clearState,
    code,
    host,
    joinParty,
    joinAsObserver,
    type,
    teams,
    onlookers,
    joinAsPlayer,
    changeType,
    mapsId,
    mapsName,
    move,
    pan,
    health,
    noCar,
    blinkTime,
    countDown,
    roundTimerPeriod,
    roundTimerGuessPeriod,
    changeMap,
    setFree,
    setNoCar,
    setRecord,
    setHealth,
    setBlinkTime,
    setCountDownTime,
    changeTeam,
    status,
    gameId,
    roundNumber,
    changeRoundNumber,
    gameType,
    changeMultiplier,
    open,
    startRound,
    increment,
  } = useModel('Party.model', (model) => ({
    clearState: model.clearState,
    status: model.partyData?.status,
    code: model.partyData?.joinCode,
    host: model?.partyData?.host,
    mapsId: model?.partyData?.gameMapsId,
    mapsName: model?.partyData?.gameMapsName,
    teams: model?.partyData?.teams,
    onlookers: model?.partyData?.onlookers,
    joinAsPlayer: model.joinAsPlayer,
    joinAsObserver: model.joinAsObserver,
    changeTeam: model.changeTeam,
    move: model?.partyData?.gameMove,
    pan: model.partyData?.gamePan,
    noCar: model.partyData?.noCar,
    record: model.partyData?.record,
    health: model.partyData?.gameHealth,
    countDown: model.partyData?.roundCountDown,
    blinkTime: model.partyData?.blinkTime,
    roundTimerPeriod: model.partyData?.roundTimerPeriod,
    roundTimerGuessPeriod: model.partyData?.roundTimerGuessPeriod,
    joinParty: model.joinParty,
    type: model.partyData?.gameType,
    changeType: model.changeType,
    changeMap: model.changeMap,
    setFree: model.setFree,
    setNoCar: model.setNoCar,
    setRecord: model.setRecord,
    setHealth: model.setHealth,
    setBlinkTime: model.setBlinkTime,
    setCountDownTime: model.setCountDownTime,
    gameId: model.partyData?.gameId,
    roundNumber: model.partyData?.roundNumber,
    changeRoundNumber: model.setRoundNumber,
    gameType: model.partyData?.gameType,
    open: model.partyData?.multiplierOpen,
    startRound: model.partyData?.multiplierStartRound,
    increment: model.partyData?.roundMultiplierIncrement,
    changeMultiplier: model.setMultipler,
  }));

  const [canMove, setCanMove] = useState<boolean>(true);
  const isHost = useMemo(() => host?.userId === me?.userId, [host, me]);

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const [showModal, setShowModal] = useState<string | null>(null);

  // === 派对相关本地操作 Start ===
  /**
   * 解散派对
   */
  const handleDisbandParty = () => setShowModal('disband');
  /**
   * 离开派对
   */
  const handleLeaveParty = async () => setShowModal('leave');
  /**
   * 开始派对
   */
  const handleStartParty = async () => await startParty();

  // === 派对相关本地操作 End ===

  useEffect(() => {
    joinParty();

    return () => {
      clearState();
    };
  }, []);

  return (
    <>
      <div className={styles.partyWrapper}>
        <div className={styles.partyHeader}>
          <header>
            <div className={styles.partyHeaderLeft}>
              <HeaderLogo canBack />
            </div>
            <div className={styles.partyInfo}>
              <div className={styles.partyRoomName}>
                {host?.userName} 的派对
              </div>
            </div>
            <div
              className={`${styles.partyTopButton} ${
                isInApp ? styles.appNavigate : ''
              }`}
            >
              <Button shape="round" onClick={() => setInviteModalVisible(true)}>
                邀请码
              </Button>

              <Button
                shape="round"
                onClick={() => setInviteFriendVisible(true)}
              >
                邀请朋友
              </Button>

              <Button shape="round" onClick={() => history.push('/join')}>
                邀请码加入
              </Button>

              {isHost ? (
                <Button
                  shape="round"
                  className={styles.danger}
                  onClick={handleDisbandParty}
                >
                  解散派对
                </Button>
              ) : (
                <Button
                  shape="round"
                  className={styles.danger}
                  onClick={handleLeaveParty}
                >
                  离开派对
                </Button>
              )}
            </div>
            <div className={styles.partyRoomNMode}>
              <span>{mapsName}</span>
              {move ? <span> | 移动街景</span> : <span> | 固定街景</span>}
              {pan ? <span> | 自由视角</span> : <span> | 固定视角</span>}
            </div>
          </header>
        </div>
        <WarningChecker />

        <div className={styles.partyRoom}>
          <div className={styles.partyMember}>
            <div className={styles.partyMemberWrapper}>
              {status === 'ongoing' ? (
                <div className={styles.partyOnGoing}>
                  <h3>正在对局中...</h3>
                  <p>
                    <Button
                      shape="round"
                      type="primary"
                      size="large"
                      onClick={() => history.push(`/party/${gameId}`)}
                    >
                      回到对局
                    </Button>
                  </p>
                </div>
              ) : type === 'br' || type === 'rank' ? (
                <div className={styles.partyMembers}>
                  <div className={styles.partyMembersList}>
                    {teams?.map((team) => (
                      <UserAvatar
                        key={team.users[0].userId}
                        user={team.users[0]}
                        host={host?.userId}
                        me={me?.userId}
                        size={teams.length}
                      />
                    ))}
                  </div>
                  <Space className={styles.partyOpeartions}>
                    {!teams?.find(
                      (team) => team.users[0].userId === me?.userId,
                    ) && (
                      <Button
                        shape="round"
                        type="primary"
                        onClick={() => joinAsPlayer(0)}
                      >
                        加入
                      </Button>
                    )}
                  </Space>
                </div>
              ) : (
                <div className={styles.partyPk}>
                  <div className={styles.partyTeamWrapper}>
                    {(!teams || teams.length === 0 || type === 'team') &&
                      onlookers?.find((u) => u.userId === me?.userId) && (
                        <div className={styles.partyTeamJoinBtn}>
                          <Button shape="round" onClick={() => joinAsPlayer(0)}>
                            加入
                          </Button>
                        </div>
                      )}
                    <div className={styles.partyTeamPlayers}>
                      {teams?.[0]?.users.length ? (
                        teams?.[0]?.users?.map((user) => (
                          <UserAvatar
                            key={user.userId}
                            user={user}
                            team={0}
                            host={host?.userId}
                            me={me?.userId}
                            size={teams?.[0]?.users.length}
                          />
                        ))
                      ) : (
                        <EmptyAvatar
                          handleInvite={() => setInviteModalVisible(true)}
                        />
                      )}
                    </div>
                  </div>
                  <div className={styles.partyTeamVs}>
                    <div className={styles.partyTeamVsIcon}>VS</div>
                    <div className={styles.partyTeamOperation}>
                      {type === 'team' &&
                        !onlookers?.find((u) => u.userId === me?.userId) && (
                          <div className={styles.partyTeamVsSwitch}>
                            <Button
                              icon={<SwapOutlined />}
                              shape="round"
                              onClick={changeTeam}
                            >
                              切换队伍
                            </Button>
                          </div>
                        )}
                    </div>
                  </div>
                  <div className={styles.partyTeamWrapper}>
                    {(!teams || teams.length <= 1 || type === 'team') &&
                      onlookers?.find((u) => u.userId === me?.userId) && (
                        <div className={styles.partyTeamJoinBtn}>
                          <Button
                            shape="round"
                            className={styles.blueTeam}
                            onClick={() => joinAsPlayer(1)}
                          >
                            加入
                          </Button>
                        </div>
                      )}
                    <div className={styles.partyTeamPlayers}>
                      {teams?.[1]?.users.length ? (
                        teams?.[1]?.users?.map((user) => (
                          <UserAvatar
                            key={user.userId}
                            user={user}
                            team={1}
                            host={host?.userId}
                            me={me?.userId}
                            size={teams?.[1]?.users.length}
                          />
                        ))
                      ) : (
                        <EmptyAvatar
                          handleInvite={() => setInviteModalVisible(true)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* 手机版切换队伍位置 */}
          <div className={styles.partyTeamOperationMobile}>
            {type === 'team' &&
              !onlookers?.find((u) => u.userId === me?.userId) && (
                <div className={styles.partyTeamVsSwitch}>
                  <Button
                    icon={<SwapOutlined />}
                    shape="round"
                    onClick={changeTeam}
                  />
                </div>
              )}
          </div>

          <div className={styles.partyStartGame}>
            {status === 'ready' ? (
              isHost ? (
                <Button
                  shape="round"
                  size="large"
                  type="primary"
                  onClick={handleStartParty}
                >
                  开始棋寻对决
                </Button>
              ) : (
                <p>
                  <HourglassTwoTone spin /> 等待房主开始比赛...
                </p>
              )
            ) : type && status === 'wait_join' ? (
              ['solor', 'solor_match'].includes(type) ? (
                <p>等待其他玩家加入....</p>
              ) : type === 'team' ? (
                <p>等待其他玩家加入或队伍至少有一人....</p>
              ) : type === 'br' ? (
                <p>淘汰赛至少有两人...</p>
              ) : type === 'rank' ? (
                <p>排位赛至少有两人...</p>
              ) : (
                ''
              )
            ) : (
              ''
            )}
          </div>

          <Divider />

          <div className={styles.observerWrapper}>
            <div className={styles.observerTitle}>
              <span>围观</span>
              {!onlookers?.find((u) => u.userId === me?.userId) && (
                <Button shape="round" size="small" onClick={joinAsObserver}>
                  加入
                </Button>
              )}
            </div>
            <div className={styles.observerList}>
              {onlookers?.map((looker) => (
                <UserAvatar
                  key={looker.userId}
                  user={looker}
                  observer
                  host={host?.userId}
                  me={me?.userId}
                  size={onlookers.length}
                />
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <div className={styles.partySettings}>
          <div className={styles.partySettingsItem}>
            <MatchType value={type} onChange={changeType} readonly={!isHost} />
          </div>
          <div className={styles.partySettingsItem}>
            <MapPicker
              value={mapsId}
              move={move}
              onChange={changeMap}
              setCanMove={setCanMove}
              readonly={!isHost}
            />
          </div>
          <div className={styles.partySettingsItem}>
            <MapSetting
              countDown={countDown}
              blinkTime={blinkTime || null}
              roundTimerPeriod={roundTimerPeriod}
              roundTimerGuessPeriod={roundTimerGuessPeriod}
              move={move}
              canMove={canMove}
              pan={pan}
              health={health}
              noCar={noCar || false}
              changePan={setFree}
              changeNoCar={setNoCar}
              changeRecord={setRecord}
              mapsId={mapsId}
              changeMove={changeMap}
              changeHealth={setHealth}
              changeBlinkTime={setBlinkTime}
              changeCountDown={setCountDownTime}
              readonly={!isHost}
              roundNumber={roundNumber ?? 10}
              changeRoundNumber={changeRoundNumber}
              gameType={gameType}
              open={open}
              startRound={startRound}
              increment={increment}
              changeMultiplier={changeMultiplier}
            />
          </div>
        </div>

        <InviteModal
          open={inviteModalVisible}
          onOpen={setInviteModalVisible}
          code={code || ''}
        />
        <InviteFriend
          open={inviteFriendVisible}
          onClose={() => setInviteFriendVisible(false)}
          onClick={(userId) => {
            if (code) {
              inviteFriendParty({ friend: userId, code: code }).then((res) => {
                if (res.success) message.success('邀请成功');
              });
            } else message.error('邀请码不存在');
          }}
        />
      </div>
      <Modal
        open={!!showModal}
        title={showModal === 'leave' ? '是否离开派对?' : '是否解散派对?'}
        onOk={() => {
          if (showModal === 'leave') {
            leaveParty().then((res) => {
              if (res.success) {
                qixunGoHome();
              }
            });
          } else {
            endParty().then((res) => {
              if (res.success) {
                qixunGoHome();
              }
            });
          }
        }}
        onCancel={() => setShowModal(null)}
      />
      <PartyEmoji />
    </>
  );
};
export default Party;
