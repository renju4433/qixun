import NormalPage from '@/pages/NormalPage';
import {
  listAchievements,
  listAchievementsProgress,
  listSelfAchievement,
} from '@/services/api';
import { Badge, Flex, Image, List, Progress, Tag } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import './style.less';

const Achievements = () => {
  const [achievementList, setAchievementList] =
    useState<API.AchievementItem[]>();
  const [sortedAchievementList, setSortedAchievementList] =
    useState<API.AchievementItem[]>();
  const [userAchievementList, setUserAchievementList] =
    useState<Map<number, API.UserAchievement>>();
  const [userAchievementProgressList, setUserAchievementProgressList] =
    useState<Map<number, API.AchievementProgressItem>>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [showModal, setShowModal] = useState<boolean>(false);

  const loadAchievements = () => {
    setIsLoading(true);

    listSelfAchievement().then((res) => {
      if (res.data) {
        const mappedData = new Map(
          res.data.map((record: API.UserAchievement) => [
            record.achievement.id,
            record,
          ]),
        );
        setUserAchievementList(mappedData);
        setIsLoading(false);
      }
    });

    listAchievementsProgress().then((res) => {
      if (!res.data) return;
      const mappedData = new Map(
        res.data.map((record: API.AchievementProgressItem) => [
          record.achievementId,
          record,
        ]),
      );
      setUserAchievementProgressList(mappedData);
    });

    listAchievements().then((res) => {
      if (!res.data) return;
      setAchievementList(res.data);
    });

    setIsLoading(false);
  };

  const formatTime = (time: number) => {
    if (time === 0) return '未知时间';
    return moment(time).year() === moment().year()
      ? moment(time).month() === moment().month() &&
        moment(time).date() === moment().date()
        ? moment(time).format('今天 HH:mm')
        : moment(time).format('MM-DD')
      : moment(time).format('YY-MM-DD');
  };

  useEffect(loadAchievements, []);

  const getProgress = (v: API.AchievementItem) => {
    if (userAchievementList?.get(v.id)) return 1;
    const progressData = userAchievementProgressList?.get(v.id);
    if (!progressData) return 0;
    const vProgress = progressData.progress ?? 0;
    const vTarget = progressData.target ?? 0;
    if (vProgress === 0 || vTarget === 0) {
      return 0;
    }
    if (vProgress >= vTarget) {
      return 1;
    }
    return vProgress / vTarget;
  };

  const isNew = (v: API.AchievementItem) => {
    return (
      moment().valueOf() - moment(v.gmtCreate).valueOf() <= 48 * 60 * 60 * 1000
    );
  };
  const isNewUnlock = (v: API.AchievementItem) => {
    return (
      moment().valueOf() -
        moment(userAchievementList?.get(v.id)?.gmtCreate ?? 0).valueOf() <=
      48 * 60 * 60 * 1000
    );
  };

  useEffect(() => {
    if (userAchievementList && userAchievementProgressList && achievementList) {
      const sortedAchievements = [...achievementList].sort((a, b) => {
        if (isNew(a)) return -1;
        if (isNew(b)) return 1;

        if (isNewUnlock(a)) return -1;
        if (isNewUnlock(b)) return 1;

        if (getProgress(a) === 1 && getProgress(b) === 1)
          return (userAchievementList.get(a.id)?.gmtCreate ?? 0) >
            (userAchievementList.get(b.id)?.gmtCreate ?? 0)
            ? -1
            : 1;

        if (getProgress(a) === 1) return 1;
        if (getProgress(b) === 1) return -1;

        if (getProgress(a) !== getProgress(b)) {
          return getProgress(a) < getProgress(b) ? 1 : -1;
        }

        if (a.task === '?') return 1;
        if (b.task === '?') return -1;

        return b.count - a.count;
      });
      setSortedAchievementList(sortedAchievements);
    }
  }, [userAchievementList, userAchievementProgressList, achievementList]);

  const gemImageLink =
    'https://b68v.daai.fun/front/gems.png?x-oss-process=image/resize,h_120';

  return (
    <NormalPage title="成就列表">
      {achievementList && (
        <List
          className="table"
          dataSource={sortedAchievementList}
          // columns={columns}
          rowKey={(record) => record.id.toString()}
          loading={isLoading}
          pagination={false}
          bordered
          renderItem={(item) => (
            <Badge.Ribbon
              text={isNew(item) ? '新' : '新解锁'}
              style={{
                display: isNew(item) || isNewUnlock(item) ? 'block' : 'none',
              }}
            >
              <List.Item>
                <List.Item.Meta
                  title={
                    <>
                      <div style={{ fontSize: 18 }}>
                        {item.name === '?' &&
                        userAchievementList?.get(item.id) ? (
                          <>
                            {userAchievementList.get(item.id)?.achievement.name}{' '}
                            <Tag bordered={false}>隐藏</Tag>
                          </>
                        ) : (
                          item.name
                        )}
                      </div>
                      {item.count > 10000
                        ? `共 ${(item.count / 10000).toFixed(1)} 万人解锁`
                        : `共 ${item.count} 人解锁`}
                    </>
                  }
                  description={
                    item.task === '?' && userAchievementList?.get(item.id)
                      ? userAchievementList?.get(item.id)?.achievement.task
                      : item.task
                  }
                />
                <div style={{ width: '30%', marginLeft: '5px' }}>
                  {userAchievementProgressList?.get(item.id) ||
                  userAchievementList?.get(item.id) ? (
                    <>
                      <Flex vertical>
                        <div // 宝石
                          style={{
                            fontSize: 16,
                            display: 'flex',
                            justifyContent: 'right',
                            minWidth: '60px',
                          }}
                        >
                          <span style={{ marginRight: '4px' }}>
                            {item.gems}
                          </span>
                          <Image
                            style={{ height: '16px', width: '16px' }}
                            preview={false}
                            src={gemImageLink}
                          />
                        </div>
                        <Progress
                          percent={
                            userAchievementList?.get(item.id)
                              ? 100
                              : userAchievementProgressList?.get(item.id)
                              ? (Math.min(
                                  userAchievementProgressList?.get(item.id)
                                    ?.progress ?? 0,
                                  userAchievementProgressList?.get(item.id)
                                    ?.target ?? 0,
                                ) /
                                  (userAchievementProgressList?.get(item.id)
                                    ?.target ?? 0)) *
                                100
                              : 100
                          }
                          showInfo={false}
                          size="small"
                          style={{ height: '8px' }}
                        />
                        <span style={{ textAlign: 'right', marginTop: '8px' }}>
                          {userAchievementList?.get(item.id) ? (
                            formatTime(
                              userAchievementList?.get(item.id)?.gmtCreate ?? 0,
                            ) + ' 解锁'
                          ) : (userAchievementProgressList?.get(item.id)
                              ?.progress ?? 0) <
                            (userAchievementProgressList?.get(item.id)
                              ?.target ?? 0) ? (
                            <>
                              {Math.min(
                                userAchievementProgressList?.get(item.id)
                                  ?.progress ?? 0,
                                userAchievementProgressList?.get(item.id)
                                  ?.target ?? 0,
                              )}
                              {' / '}
                              {userAchievementProgressList?.get(item.id)
                                ?.target ?? 0}
                            </>
                          ) : (
                            <>
                              {userAchievementList?.get(item.id)
                                ? formatTime(
                                    userAchievementList?.get(item.id)
                                      ?.gmtCreate ?? 0,
                                  ) + ' 解锁'
                                : '暂未解锁'}
                            </>
                          )}
                        </span>
                      </Flex>
                    </>
                  ) : item.gems ? (
                    <div // 宝石
                      style={{
                        fontSize: 16,
                        display: 'flex',
                        justifyContent: 'right',
                        minWidth: '60px',
                      }}
                    >
                      <span style={{ marginRight: '4px' }}>{item.gems}</span>
                      <Image
                        style={{ height: '16px', width: '16px' }}
                        preview={false}
                        src={gemImageLink}
                      />
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </List.Item>
            </Badge.Ribbon>
          )}
        />
      )}
    </NormalPage>
  );
};

export default Achievements;
