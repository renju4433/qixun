import { qixunCopy } from '@/utils/CopyUtils';
import { useNavigate } from '@umijs/max';
import { Button, Card, Flex, Modal } from 'antd';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import styles from './style.module.less';

type UserAchievementListProps = {
  user?: API.UserProfile;
  me?: API.UserProfile;
  achievements: API.UserAchievement[];
};

interface SortedUserAchievement {
  name: string;
  task: string | null;
  gmtCreate: number;
  count: number;
  gems: number;
  level?: number;
  predecessors?: SortedUserAchievement[];
}

const colorList = ['', '', 'white', 'lightblue', 'seagreen', 'gold'];

const UserAchievementList: FC<UserAchievementListProps> = ({
  user,
  me,
  achievements,
}) => {
  const [chooseAchieve, setChooseAchieve] = useState<SortedUserAchievement>();
  const [sorted, setSorted] = useState<SortedUserAchievement[]>();
  const navigator = useNavigate();

  const formatTime = (time: number) => {
    if (time === 0) return '未知时间';
    return moment(time).year() === moment().year()
      ? moment(time).month() === moment().month() &&
        moment(time).date() === moment().date()
        ? moment(time).format('今天 HH:mm')
        : moment(time).format('MM-DD')
      : moment(time).format('YYYY-MM-DD');
  };

  useEffect(() => {
    const series: Record<string, API.UserAchievement[]> = {};
    const thisSort: SortedUserAchievement[] = [];
    for (let achievement of achievements) {
      if (!achievement.achievement.seriesId) {
        thisSort?.push({
          name: achievement.achievement.name,
          task: achievement.achievement.task,
          gmtCreate: achievement.gmtCreate,
          count: achievement.achievement.count,
          gems: achievement.achievement.gems,
        });
      } else {
        if (!Object.keys(series).includes(achievement.achievement.seriesId)) {
          series[achievement.achievement.seriesId] = [achievement];
        } else {
          series[achievement.achievement.seriesId].push(achievement);
        }
      }
    }
    Object.entries(series).forEach(([, v]) => {
      let maxSeq = -1;
      const pre: SortedUserAchievement[] = [];
      for (let ua of v) {
        if ((ua.achievement.seriesSeq ?? 0) > maxSeq) {
          maxSeq = ua.achievement.seriesSeq ?? 0;
        }
      }
      for (let ua of v) {
        if (ua.achievement.seriesSeq !== maxSeq) {
          pre.push({
            name: ua.achievement.name,
            task: ua.achievement.task,
            gmtCreate: ua.gmtCreate,
            count: ua.achievement.count,
            gems: ua.achievement.gems,
            level: ua.achievement.seriesSeq,
          });
        }
      }
      for (let ua of v) {
        if (ua.achievement.seriesSeq === maxSeq) {
          thisSort?.push({
            name: ua.achievement.name,
            task: ua.achievement.task,
            gmtCreate: ua.gmtCreate,
            count: ua.achievement.count,
            gems: ua.achievement.gems,
            level: ua.achievement.seriesSeq,
            predecessors: pre,
          });
          break;
        }
      }
    });
    setSorted(thisSort);
  }, [achievements]);

  return (
    <div className={styles.qixunAvatar}>
      <>
        {achievements.length === 0 ? (
          <div>暂未获得任何成就</div>
        ) : (
          <Flex wrap="wrap" gap="middle">
            {sorted?.map((achieve) => (
              <Button
                key={achieve.name.toString()}
                onClick={() => setChooseAchieve(achieve)}
                style={{
                  color: colorList[achieve.level ?? 0],
                  textShadow:
                    achieve.level && achieve.level > 1 ? '1px 0 10px' : '',
                  fontWeight: achieve.level === 5 ? 700 : 400,
                }}
              >
                {achieve.name}
              </Button>
            ))}
          </Flex>
        )}
        <Card
          hoverable
          onClick={() => navigator('/achievement')}
          size="small"
          style={{
            marginTop: 30,
            background: 'inherit',
            padding: 0,
            textAlign: 'center',
            fontSize: '1rem',
            alignContent: 'center',
          }}
        >
          查看所有成就
        </Card>
        <Modal
          open={!!chooseAchieve}
          title={chooseAchieve?.name}
          footer={null}
          onCancel={() => setChooseAchieve(undefined)}
        >
          <div>{chooseAchieve?.task}</div>
          <br></br>
          {chooseAchieve?.gmtCreate && (
            <div>{formatTime(chooseAchieve.gmtCreate)} 解锁</div>
          )}
          <div>已有 {chooseAchieve?.count ?? 0} 人解锁该成就</div>
          <div>宝石奖励：{chooseAchieve?.gems ?? 0}</div>
          <br></br>
          <Button
            onClick={() => {
              qixunCopy(
                (me?.userId === user?.userId
                  ? '我'
                  : `${user?.userName} (uid: ${user?.userId}) `) +
                  `于 ${formatTime(
                    chooseAchieve?.gmtCreate ?? new Date().getTime(),
                  )} 解锁了「${chooseAchieve?.name}」成就，目前此成就有 ${
                    chooseAchieve?.count ?? 0
                  } 人解锁，快来试试吧！`,
              );
            }}
          >
            分享
          </Button>
        </Modal>
      </>
    </div>
  );
};

export default UserAchievementList;
