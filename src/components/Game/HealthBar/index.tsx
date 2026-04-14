import qixunAvatar from '@/components/User/qixunAvatar';
import { CFBizUri, publicPath } from '@/constants';
import { useModel } from '@umijs/max';
import { FC, useMemo } from 'react';
import styles from './style.less';

type HealthBarProps = {
  team: number;
  showMembers?: boolean;
};

const HealthBar: FC<HealthBarProps> = ({ team, showMembers = true }) => {
  const { totalHealth, type, teams, roundResult } = useModel(
    'Challenge.model',
    (model) => ({
      type: model.type,
      teams: model.gameData?.teams,
      totalHealth: model.gameData?.health,
      roundResult: model.roundResult,
    }),
  );

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const healthPercent = useMemo(
    () => ((teams?.[team]?.health ?? 0) / (totalHealth ?? 6000)) * 100,
    [teams, totalHealth],
  );

  return (
    <div
      className={`${styles.hudContainer} ${
        team === 0 ? styles.leftTeam : team === 1 ? styles.rightTeam : ''
      } ${roundResult ? styles.roundResult : ''} ${
        isInApp ? styles.inApp : ''
      }`}
    >
      {type &&
        (['team', 'team_match'].includes(type) ? (
          <div className={styles.hudAvatarContainer}>
            <div className={styles.avatarContainer}>
              <div
                className={styles.avatarCover}
                style={{
                  backgroundImage:
                    team === 0
                      ? `url(${publicPath}/images/user/red_team.png)`
                      : `url(${publicPath}/images/user/blue_team.png)`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.hudAvatarContainer}>
            <div
              className={`${styles.avatarContainer} ${
                team === 0 ? styles.redTeam : team === 1 ? styles.blueTeam : ''
              }`}
            >
              <div
                className={styles.avatarCover}
                style={{
                  backgroundImage: `url(${CFBizUri}${teams?.[team]?.users?.[0]?.icon}?x-oss-process=image/resize,h_160,w_160,m_fill/quality,q_75)`,
                }}
              />
            </div>
          </div>
        ))}

      <div className={styles.hudHealthBarContainer}>
        <div className={styles.hudHealthBar}>
          <div className={styles.hudHealthBarInner}>
            <span>{teams?.[team]?.health}</span>
            {/* TODO: 宽度计算 */}
            <div
              className={styles.hudHealthBarBox}
              style={{
                width: `calc(${healthPercent}%)`,
                background:
                  healthPercent > 50
                    ? team === 0
                      ? 'linear-gradient(270deg, rgb(151, 232, 81) 0%, rgb(108, 185, 40) 100%)'
                      : 'linear-gradient(270deg, rgb(108, 185, 40) 0%, rgb(151, 232, 81) 100%)'
                    : healthPercent > 15
                    ? team === 0
                      ? 'linear-gradient(270deg, rgb(254, 205, 25) 0%, rgb(255, 164, 61) 100%)'
                      : 'linear-gradient(270deg, rgb(255, 164, 61) 0%, rgb(254, 205, 25) 100%)'
                    : '#E94560',
              }}
            />
          </div>
        </div>
        <div className={styles.playerName}>
          {type ? (
            ['team', 'team_match'].includes(type) ? (
              <>
                {showMembers && (
                  <div className={styles.userList}>
                    {teams?.[team]?.users
                      .slice(
                        0,
                        window.matchMedia('(max-width: 679px)').matches
                          ? 10
                          : 20,
                      )
                      .map((user) => (
                        <div key={user.userId} className={styles.userBox}>
                          <div className={styles.userAvatar}>
                            <qixunAvatar user={user} size={30} />
                          </div>
                          <p className={styles.userName}>{user.userName}</p>
                        </div>
                      ))}
                    {teams?.[team]?.users &&
                      teams?.[team]?.users.length >
                        (window.matchMedia('(max-width: 679px)').matches
                          ? 10
                          : 20) && <div>更多...</div>}
                  </div>
                )}
              </>
            ) : (
              teams?.[team]?.users?.[0]?.userName
            )
          ) : (
            '我'
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthBar;
