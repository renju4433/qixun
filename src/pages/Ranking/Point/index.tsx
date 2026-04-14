import sync from '@/components/Admin/Mgr';
import HeaderLogo from '@/components/Header/Logo';
import PointHint from '@/components/Point/PointHint';
import qixunAvatar from '@/components/User/qixunAvatar';
import { provinces } from '@/constants';
import { getPointRank, getProvinceRank } from '@/services/api';
import { history } from '@@/core/history';
import { useParams } from '@umijs/max';
import { Segmented, Select } from 'antd';
import { FC, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styles from './style.less';
const PointRank: FC = () => {
  const { type } = useParams<{ type: string }>();
  const [rank, setRank] = useState<API.PointRank[]>([]);
  const [provinceRank, setProvinceRank] = useState<API.ProvinceRank[]>([]);
  const [province, setProvince] = useState<string>('全部区域');
  const [ratingType, setRatingType] = useState<string>(
    type === 'world' ? 'world' : 'china',
  );
  const [rankType, setRankType] = useState<string>('user');

  useEffect(sync, []);

  function _getPointRank(tProvince: string | null, ratingType: string) {
    let ttProvince = tProvince;
    if (ttProvince === '全部区域') {
      ttProvince = null;
    }
    console.log(ttProvince);
    getPointRank({ province: ttProvince, type: ratingType }).then((res) => {
      setRank(res.data);
    });
  }

  function _getProvinceRank(ratingType: string) {
    getProvinceRank({ type: ratingType }).then((res) => {
      setProvinceRank(res.data);
    });
  }

  useEffect(() => {
    if (rankType === 'user') {
      _getPointRank(province, ratingType);
    } else {
      _getProvinceRank(ratingType);
    }
  }, [rankType, ratingType, province]);

  return (
    <div className={styles.wrapper}>
      <HeaderLogo canBack className={styles.header} />
      <div className={styles.container}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            paddingTop: '4rem',
          }}
        >
          积分排行
        </h2>
        <PointHint />
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div className={styles.segmented}>
            <Segmented
              style={{ margin: 'auto', fontSize: '40px' }}
              defaultValue={ratingType}
              options={[
                { label: '全球积分', value: 'world' },
                { label: '中国积分', value: 'china' },
              ]}
              size="large"
              onChange={(v) => setRatingType(v)}
            />
          </div>
          <div style={{ height: '1rem' }}></div>
        </div>

        <div />
        {rankType === 'user' ? (
          <>
            <Select
              defaultValue="全部区域"
              style={{
                width: 120,
                height: '40px',
                marginBottom: '10px',
                marginTop: '10px',
              }}
              onChange={(value) => setProvince(value)}
              options={['全部区域', ...provinces].map((item) => ({
                label: item,
                value: item,
              }))}
            />

            {rank.map((item, index) => (
              <div
                onClick={() => {
                  if (isMobile) {
                    history.push(`/user/${item.userAO.userId}`);
                  } else {
                    window.open(
                      `https://saiyuan.top/user/${item.userAO.userId}`,
                      '_blank',
                    );
                  }
                }}
                key={item.userAO.userName}
                style={{
                  borderBottom: '1px solid white',
                  display: 'flex',
                  width: '100%',
                  padding: '2px 0',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor:
                    index === 0
                      ? 'goldenrod'
                      : index === 1
                        ? 'silver'
                        : index === 2
                          ? '#CD7F32'
                          : '',
                }}
              >
                <div style={{ display: 'block', height: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        textAlign: 'center',
                        width: '50px',
                      }}
                    >
                      {item.rank}.
                    </div>
                    <qixunAvatar user={item.userAO} size={40} />
                    <div
                      style={{
                        paddingLeft: '10px',
                        height: '100%',
                        textAlign: 'center',
                      }}
                    >
                      {item.userAO.userName}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    marginLeft: 'auto',
                    marginRight: '10px',
                    marginTop: 'auto',
                    marginBottom: 'auto',
                    height: '100%',
                    textAlign: 'center',
                  }}
                >
                  {item.userAO.province}
                </div>
                <div
                  style={{
                    display: 'flex',
                    marginLeft: '2px',
                    marginRight: '10px',
                    marginTop: 'auto',
                    marginBottom: 'auto',
                    height: '100%',
                    textAlign: 'center',
                  }}
                >
                  {ratingType === 'china'
                    ? item.userAO.chinaRating
                    : item.userAO.rating}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div
              style={{
                paddingLeft: '5px',
                marginTop: '10px',
                marginBottom: '10px',
              }}
            >
              统计每个省份 1800 分以上的人数
            </div>
            {provinceRank.map((v, index) => {
              return (
                <div
                  onClick={() => { }}
                  key={v.province}
                  style={{
                    height: '50px',
                    borderBottom: '1px solid white',
                    display: 'flex',
                    width: '100%',
                    padding: '2px 0',
                    marginBottom: '10px',
                    backgroundColor:
                      index === 0
                        ? 'goldenrod'
                        : index === 1
                          ? 'silver'
                          : index === 2
                            ? '#CD7F32'
                            : '',
                  }}
                >
                  <div
                    style={{
                      display: 'block',
                      paddingLeft: '5px',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                      }}
                    >
                      {v.province}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      marginLeft: 'auto',
                      marginRight: '10px',
                      marginTop: 'auto',
                      marginBottom: 'auto',
                      height: '100%',
                      textAlign: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {v.user_count}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default PointRank;
