import { CFBizUri } from '@/constants';
import {
  addMapCollection,
  checkMapCollection,
  getMapFriendRank,
  getMapRank,
  getqixunUserProfile,
  removeMapCollection,
} from '@/services/api';
import { qixunCopy } from '@/utils/CopyUtils';
import { useModel } from '@@/exports';
import {
  OrderedListOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { message } from 'antd';
import { StarFill, StarOutline } from 'antd-mobile-icons';
import { FC, useEffect, useState } from 'react';
import MapRanking from '../MapRanking';
import styles from './style.less';

type MapTopInfoProps = {
  map: API.MapItem;
};

const MapTopInfo: FC<MapTopInfoProps> = ({ map }) => {
  const [authorName, setAuthorName] = useState<string>('-');
  const [collecion, setCollection] = useState<boolean>(false);
  const [showRank, setShowRank] = useState<boolean>(false);
  const [ranks, setRanks] = useState<API.DailyChallengeRank[]>([]);
  const options = map.canMove
    ? [
        { label: '移动', value: 'move' },
        { label: '固定', value: 'noMove' },
        { label: '固定视角', value: 'npmz' },
      ]
    : [
        { label: '固定', value: 'noMove' },
        { label: '固定视角', value: 'npmz' },
      ];

  const [rank, setRank] = useState<'move' | 'noMove' | 'npmz'>(
    map.canMove ? 'move' : 'noMove',
  );

  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [sort, setSort] = useState<string>('friend');
  useEffect(() => {
    if (!showRank) return;

    if (sort === 'friend') {
      getMapFriendRank({ mapsId: map.id, type: rank }).then((res) => {
        if (res.success) setRanks(res.data);
      });
    } else {
      getMapRank({ mapsId: map.id, type: rank }).then((res) => {
        if (res.success) setRanks(res.data);
      });
    }
  }, [showRank, rank, sort]);

  useEffect(() => {
    getqixunUserProfile({ userId: map.userId }).then((res) => {
      if (res.success) setAuthorName(res.data.userName);
    });

    checkMapCollection({ mapId: map.id }).then((res) => {
      if (res.data) setCollection(true);
    });
  }, []);

  function addCollection() {
    addMapCollection({ mapId: map.id }).then((res) => {
      if (res.success) {
        setCollection(true);
        message.info('收藏成功');
      }
    });
  }

  function removeCollection() {
    removeMapCollection({ mapId: map.id }).then((res) => {
      if (res.success) {
        setCollection(false);
        message.info('取消收藏成功');
      }
    });
  }

  function getHard(): string {
    if (!map.avgScore || map.avgScore === null) {
      return '适中';
    }

    switch (true) {
      case map.avgScore <= 5000:
        return '极难';
      case map.avgScore <= 10000:
        return '困难';
      case map.avgScore <= 15000:
        return '适中';
      case map.avgScore <= 20000:
        return '容易';
      default:
        return '极易';
    }
  }

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.img}>
          <img
            src={`${CFBizUri}${map.cover}?x-oss-process=image/resize,h_120`}
          ></img>
        </div>
        <div className={styles.text}>
          <div className={styles.title}>{map.name}</div>
          <div
            className={styles.author}
            onClick={() => history.push('/user/' + map.userId)}
          >
            作者：{authorName}
          </div>
          <div className={styles.desc}>介绍：{map.desc}</div>
        </div>
      </div>
      <div className={styles.info}>
        题数：{map.pcount}｜人次：{map.players}｜难度：{getHard()}
      </div>
      <div className={styles.icons}>
        <div className={styles.icon}>
          {!collecion && (
            <>
              <div style={{ cursor: 'pointer' }}>
                <StarOutline fontSize={24} onClick={addCollection} />
              </div>
              <div className={styles.iconHint}>收藏</div>
            </>
          )}
          {collecion && (
            <>
              <div style={{ cursor: 'pointer' }}>
                <StarFill
                  fontSize={24}
                  color="yellow"
                  onClick={removeCollection}
                />
              </div>
              <div className={styles.iconHint}>取消收藏</div>
            </>
          )}
        </div>

        <div className={styles.icon}>
          <ShareAltOutlined
            alt="分享"
            style={{ fontSize: 24 }}
            onClick={() =>
              qixunCopy(
                `邀请你来棋寻做「${map.name}」题库 https://saiyuan.top/map/${map.id}`,
              )
            }
          />
          <div className={styles.iconHint}>分享</div>
        </div>
        <div className={styles.icon}>
          <OrderedListOutlined
            alt="排行榜"
            style={{ fontSize: 24 }}
            onClick={() => setShowRank(true)}
          />
          <div className={styles.iconHint}>排行</div>
        </div>
        {user && user.userId === map.userId && (
          <div className={styles.icon}>
            <SettingOutlined
              alt="管理"
              style={{ fontSize: 24 }}
              onClick={() => history.push('/mapmodify/' + map.id)}
            />
            <div className={styles.iconHint}>管理</div>
          </div>
        )}
      </div>
      <hr />

      <MapRanking
        showRank={showRank}
        setShowRank={setShowRank}
        options={options}
        rank={rank}
        setRank={setRank}
        ranks={ranks}
        sort={sort}
        setSort={setSort}
      />
    </>
  );
};

export default MapTopInfo;
