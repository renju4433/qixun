import { useModel } from '@@/exports';
import { FC, useEffect, useState } from 'react';
import styles from './style.less';

type TeamRankProps = {
  model: CompetitionModel;
  currentUserId: number | undefined;
};

const TeamRank: FC<TeamRankProps> = ({ model, currentUserId }) => {
  const { teams, gameData, status } = useModel(model, (model) => ({
    teams: model.gameData?.teams,
    gameData: model.gameData,
    status: model.gameData?.status,
  }));

  // const [showRoundResult];
  const [rankTeam, setRankTeam] = useState<API.PartyTeam[]>();

  useEffect(() => {
    if (teams) {
      setRankTeam(
        teams
          .slice(0, teams.length)
          .sort((a, b) => (b.health ?? 0) - (a.health ?? 0)),
      );
    }
  }, [teams]);
  return (
    <div
      className={`${styles.teamRank} ${
        status === 'finish' ? styles.finish : ''
      }`}
    >
      <div className={styles.header}>
        <div className={styles.rank}>排名</div>
        <div className={styles.userName}>用户</div>
        {status !== 'finish' && (
          <div className={styles.scoreChange}>本轮得分</div>
        )}
        <div className={styles.score}>总分</div>
      </div>

      {rankTeam?.map((team, index) => (
        <div
          key={team.id}
          className={`${styles.user} ${
            team.teamUsers.some((user) => user.user.userId === currentUserId)
              ? styles.highlight
              : ''
          }`}
        >
          <div className={styles.rank}>{index + 1}</div>
          <div className={styles.userName}>
            {team.teamUsers[0].user.userName}
          </div>
          {status !== 'finish' && (
            <div className={styles.scoreChange}>
              {team.lastRoundResult?.score ?? 0}
            </div>
          )}
          <div className={styles.score}>{team.health ?? 0}</div>
        </div>
      ))}
    </div>
  );
};

export default TeamRank;
