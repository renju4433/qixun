import HeaderLogo from '@/components/Header/Logo';
import qixunAvatar from '@/components/User/qixunAvatar';
import { CFBizUri, publicPath } from '@/constants';
import { getUATime } from '@/services/api';
import { FlagTwoTone } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Avatar, Badge } from 'antd';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useMemo } from 'react';
import { Layer, Marker, Source, useMap } from 'react-map-gl/maplibre';
import MapContainer from '../MapContainer';
import styles from './style.less';

type MapResultProps = {
  target?: {
    longitude: number;
    latitude: number;
  };
  ranks?: {
    distance: number;
    rank: number;
    longitude: number;
    latitude: number;
    rating: number;
    ratingChange: number;
    user: {
      userId: number;
      icon: string;
      userName: string;
    };
  }[];
};

const MapResult: FC<MapResultProps> = ({ target, ranks }) => {
  const { map } = useMap();

  const { user, isInApp } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
    isInApp: model.initialState?.isInApp,
  }));

  useEffect(() => {
    if (map && target && ranks && ranks.length > 0) {
      // 获取四边界
      const bounds = ranks.reduce(
        (acc, cur) => {
          acc[0] = Math.min(acc[0], cur.longitude);
          acc[1] = Math.min(acc[1], cur.latitude);
          acc[2] = Math.max(acc[2], cur.longitude);
          acc[3] = Math.max(acc[3], cur.latitude);
          return acc;
        },
        [target.longitude, target.latitude, target.longitude, target.latitude],
      );

      setTimeout(() => {
        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: 100, duration: 1000 },
        );
      }, 100);

      const compareCoordinates = (coord1: number, coord2: number) =>
        coord1.toFixed(10) === coord2.toFixed(10);

      ranks.forEach((rank) => {
        if (
          compareCoordinates(target.latitude, rank.latitude) &&
          compareCoordinates(target.longitude, rank.longitude) &&
          user?.userId === rank.user.userId
        )
          getUATime({ extra: 'crd' });
      });
    }
  }, [target?.longitude, target?.latitude, ranks, map]);

  // ======== Markers 渲染 Start ============
  const markers = useMemo(
    () =>
      ranks?.map((rank) => (
        <Marker
          key={rank.user.userId}
          {...rank}
          anchor="bottom"
          pitchAlignment="map"
          offset={[0, 0]}
          style={{
            height: '42px',
            backgroundImage:
              user?.userId === rank.user.userId
                ? `url(${publicPath}/images/marker_background_yellow.png`
                : `url(${publicPath}/images/marker_background.png)`,
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat',
            zIndex: 1000 - rank.rank,
          }}
        >
          <Badge
            count={rank.rank}
            color="#FFF"
            offset={[0, 26]}
            classNames={{ indicator: styles.rankBadge }}
            style={{ color: '#000', fontWeight: '700' }}
          >
            <Badge
              count={rank.user.userName}
              overflowCount={10000000000}
              offset={[-18, -12]}
              color="#FFF"
              style={{
                color: '#000',
                fontWeight: '700',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Avatar
                src={`${CFBizUri}${rank?.user?.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
                style={{
                  border:
                    user?.userId === rank.user.userId
                      ? '2px solid #FF9427'
                      : '2px solid #fff',
                }}
              />
            </Badge>
          </Badge>
        </Marker>
      )),
    [ranks],
  );
  // ======== Markers 渲染 End ============

  // ======== Line 渲染 Start ============
  const rankLinesGeoJSON = useMemo(() => {
    if (target && ranks && ranks.length > 0) {
      return {
        type: 'FeatureCollection',
        features: ranks.map((rank) => ({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [rank.longitude, rank.latitude],
              [target.longitude, target.latitude],
            ],
          },
        })),
      };
    }
    return null;
  }, [ranks, target]);
  // ======== Line 渲染 End ============

  // ======== Rank 渲染 Start ============
  const rankItems = useMemo(
    () =>
      ranks?.map((rank) => (
        <div
          key={rank.user.userId}
          onClick={() => history.push(`/user/${rank.user.userId}`)}
          className={`${styles.scoreItem} ${
            user?.userId === rank.user.userId ? styles.myScore : ''
          }`}
        >
          <div className={styles.rank}>{rank.rank}. </div>
          <div className={styles.avatar}>
            <Badge
              count={
                rank.ratingChange > 0
                  ? `+${rank.ratingChange}`
                  : `${rank.ratingChange}`
              }
              showZero
              color="#FF9427"
              style={{ color: '#FFF', fontWeight: '700' }}
            >
              <Badge
                count={new BigNumber(rank.rating).toFormat()}
                overflowCount={10000000000}
                showZero
                offset={[-25, 50]}
                color="#FFF"
                style={{ color: '#000', fontWeight: '700' }}
              >
                <qixunAvatar user={rank.user} size={50} />
              </Badge>
            </Badge>
          </div>
          <div>
            <div className={styles.username}>{rank.user.userName}</div>
            <div className={styles.distance}>
              {((rank.distance ?? 0) / 1000).toFixed(2)} km
            </div>
          </div>
        </div>
      )),
    [ranks],
  );
  // ======== Rank 渲染 End ============

  return (
    <div className={styles.wrapper}>
      <div className={styles.mapResult}>
        <MapContainer cursor="grab">
          <Source type="geojson" data={rankLinesGeoJSON}>
            <Layer
              type="line"
              paint={{ 'line-width': 3, 'line-dasharray': [0, 1, 1] }}
            />
          </Source>

          {markers}

          {target && (
            <Marker
              {...target}
              anchor="bottom"
              pitchAlignment="map"
              offset={[0, 0]}
              style={{
                color: '#FFF',
                height: '44px',
                backgroundImage: `url(${publicPath}/images/marker_background_black.png`,
                backgroundSize: '100%',
                backgroundRepeat: 'no-repeat',
                zIndex: 1000,
                padding: '4px',
                boxSizing: 'border-box',
              }}
            >
              <Avatar
                size={28}
                style={{ border: 'none', backgroundColor: '#000' }}
                src={
                  <FlagTwoTone
                    style={{ fontSize: '20px' }}
                    twoToneColor="warning"
                    rotate={-45}
                  />
                }
              />
            </Marker>
          )}
        </MapContainer>

        <div className={`${styles.resultText} ${isInApp ? styles.inApp : ''}`}>
          <span>结果</span>
        </div>
        <HeaderLogo className={styles.resultLogo} />
      </div>
      <div className={styles.scoreReulst}>
        <div className={styles.scoreList}>{rankItems}</div>
      </div>
    </div>
  );
};

export default MapResult;
