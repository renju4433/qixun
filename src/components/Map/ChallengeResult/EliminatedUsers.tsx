import qixunAvatar from '@/components/User/qixunAvatar';
import { useModel } from '@umijs/max';
import { useMemo } from 'react';
import styles from './style.less';

const EliminatedUsers = () => {
  const { lastRound, teams } = useModel('Challenge.model', (model) => ({
    lastRound: model.lastRound,
    teams: model.gameData?.teams,
  }));

  const eliminatedUsers = useMemo(() => {
    const users: API.UserProfile[] = [];
    teams?.forEach((team) => {
      if (lastRound?.obsoleteTeamIds?.includes(team.id)) {
        users.push(team.users[0]);
      }
    });
    return users;
  }, [lastRound, teams]);

  return eliminatedUsers.map((user) => (
    <div key={user.userId} className={styles.userBox}>
      <qixunAvatar user={user} size={32} />
      <p>{user.userName}</p>
    </div>
  ));
};

export default EliminatedUsers;
