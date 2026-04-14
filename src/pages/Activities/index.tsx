import NormalPage from '@/pages/NormalPage';
import {
  getSelfActivities,
  getSelfMapsActivities,
  getSelfOtherActivities,
  getSelfPartyActivities,
  getSelfRatingActivities,
  getUserActivities,
} from '@/services/api';
import { getGameTypeNameByString } from '@/utils/GameUtils';
import { history } from '@@/core/history';
import { useModel } from '@@/exports';
import { Segmented } from 'antd';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useSearchParams } from 'react-router-dom';
import styles from './style.less';

const Activities: FC<null> = () => {
  const [params] = useSearchParams();
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));
  const [sort, setSort] = useState<string>('全部');
  const [activities, setActivities] = useState<API.HistoryItem[]>([]);
  const userId = params.get('userId') ? Number(params.get('userId')) : null;
  const self = user?.userId === userId;

  const selfActivitiesApiMap: Record<
    string,
    (options?: Record<string, any>) => Promise<API.Result<API.HistoryItem[]>>
  > = {
    全部: getSelfActivities,
    积分: getSelfRatingActivities,
    派对: getSelfPartyActivities,
    题库: getSelfMapsActivities,
    其他: getSelfOtherActivities,
  };

  const fetchActivities = async () => {
    let res;
    if (self) {
      const fetchSelfActivities =
        selfActivitiesApiMap[sort] || getSelfActivities;
      res = await fetchSelfActivities({ userId: userId ?? -1 });
    } else {
      res = await getUserActivities({ userId: userId ?? -1 });
    }
    if (res?.success) setActivities(res.data);
  };

  useEffect(() => {
    fetchActivities();
  }, [userId, sort]);

  const getName = (activity: API.HistoryItem) => {
    if (activity.type !== 'solo_match') {
      return getGameTypeNameByString(activity.type);
    }
    let name = activity.ratingType === 'china' ? '中国匹配' : '全球匹配';
    const moveTypeSuffixMap: Record<string, string> = {
      move: '｜移动',
      noMove: '｜固定',
      npmz: '｜固定视角',
    };
    if (activity.moveType && moveTypeSuffixMap[activity.moveType]) {
      name += moveTypeSuffixMap[activity.moveType];
    }
    return name;
  };

  return (
    <NormalPage
      title="比赛历史"
      desc={
        self
          ? '查看自己的积分 派对 题库等模式记录'
          : '查看他人记录时 仅开放本赛季最新20次积分模式记录 点击模式名称可查看复盘信息'
      }
    >
      {self && (
        <Segmented
          style={{ margin: '8px 4px 2px' }}
          value={sort}
          options={['全部', '积分', '派对', '题库', '其他']}
          onChange={(v) => setSort(v)}
        />
      )}
      <table>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id} className={styles.activity}>
              <td>
                {self
                  ? moment(activity.gmtCreate).format('YY-MM-DD HH:mm')
                  : moment(activity.gmtCreate).format('YY-MM-DD')}
              </td>
              <td>
                <span
                  style={{ fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() =>
                    activity.gameId
                      ? isMobile
                        ? history.push(`/solo/${activity.gameId}`)
                        : window.open(`/solo/${activity.gameId}`)
                      : undefined
                  }
                >
                  {getName(activity)}
                </span>
              </td>
              {activity.ratingChange !== undefined &&
                activity.ratingChange !== null && (
                  <td
                    style={{
                      color:
                        activity.ratingChange >= 0 ? 'forestgreen' : 'crimson',
                    }}
                  >
                    {activity.ratingChange >= 0 && '+'}
                    {activity.ratingChange}
                  </td>
                )}
              {activity.rating && <td>{activity.rating}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </NormalPage>
  );
};

export default Activities;
