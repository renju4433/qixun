import sync from '@/components/Admin/Mgr';
import PointHint from '@/components/Point/PointHint';
import qixunAvatar from '@/components/User/qixunAvatar';
import { provinces } from '@/constants';
import { getPointRank, getProvinceRank } from '@/services/api';
import { Link } from '@@/exports';
import { OrderedListOutlined } from '@ant-design/icons';
import { Flex, Segmented, Select, Space, Typography } from 'antd';
import { FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NormalPage from '../NormalPage';
const { Text } = Typography;

const PointRank: FC = () => {
  const [rank, setRank] = useState<API.PointRank[]>([]);
  const [provinceRank, setProvinceRank] = useState<API.ProvinceRank[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialProvince = searchParams.get('province') || '全部区域';
  const initialRatingType = searchParams.get('type') || 'china';
  const initialRankType = searchParams.get('rank') || 'user';

  const [province, setProvince] = useState<string>(initialProvince);
  const [ratingType, setRatingType] = useState<string>(initialRatingType);
  const [rankType, setRankType] = useState<string>(initialRankType);

  useEffect(sync, []);

  useEffect(() => {
    const params: Record<string, string> = { type: ratingType };
    if (province && province !== '全部区域') {
      params.province = province;
    }
    if (rankType !== 'user') {
      params.rank = rankType;
    }
    setSearchParams(params, { replace: true });
  }, [ratingType, province, rankType, setSearchParams]);

  useEffect(() => {
    if (rankType === 'user')
      getPointRank({
        province: province !== '全部区域' ? province : null,
        type: ratingType,
      }).then((res) => setRank(res.data));
    if (rankType === 'province')
      getProvinceRank({ type: ratingType }).then((res) =>
        setProvinceRank(res.data),
      );
  }, [rankType, ratingType, province]);

  return (
    <NormalPage title="积分排行">
      <Flex vertical justify="center" align="center" gap="small">
        <PointHint />
        <Segmented
          value={ratingType}
          options={[
            { label: '中国积分', value: 'china' },
            { label: '全球积分', value: 'world' },
          ]}
          size="large"
          onChange={(v) => setRatingType(v)}
        />
        <Segmented
          value={rankType}
          options={[
            { label: '用户', value: 'user' },
            { label: '省份', value: 'province' },
          ]}
          size="large"
          onChange={(v) => setRankType(v)}
        />
        {rankType === 'user' && (
          <Flex justify="center" gap="small" style={{ fontSize: 18 }}>
            <OrderedListOutlined style={{ color: 'yellow' }} />
            TOP 200
          </Flex>
        )}
      </Flex>

      {rankType === 'user' ? (
        <Select
          value={province}
          style={{ width: 120, height: 40, margin: '10px 0' }}
          onChange={(value) => setProvince(value)}
          options={['全部区域', ...provinces].map((item) => ({
            label: item,
            value: item,
          }))}
        />
      ) : rankType === 'province' ? (
        <div style={{ margin: '10px 0' }}>统计每个省份 1800 分以上的人数</div>
      ) : null}

      {rankType === 'user' && (
        <Flex vertical gap={10}>
          {rank.map((item, index) => (
            <Flex
              align="center"
              gap="small"
              key={item.userAO.userId}
              style={{
                padding: '2px 10px',
                borderBottom: '1px solid white',
                backgroundColor:
                  index === 0
                    ? 'goldenrod'
                    : index === 1
                      ? 'silver'
                      : index === 2
                        ? '#CD7F32'
                        : 'inherit',
              }}
            >
              <Text
                style={{
                  width: 30,
                  minWidth: 'max-content',
                  textAlign: 'center',
                }}
              >
                {item.rank}.
              </Text>
              <qixunAvatar user={item.userAO} size={40} />
              <Link
                to={`/user/${item.userAO.userId}`}
                style={{ flex: 1, color: 'inherit' }}
              >
                {item.userAO.userName}
              </Link>
              <Space size={12}>
                {item.userAO.province}
                {ratingType === 'china'
                  ? item.userAO.chinaRating
                  : item.userAO.rating}
              </Space>
            </Flex>
          ))}
        </Flex>
      )}
      {rankType === 'province' && (
        <Flex vertical gap={10}>
          {provinceRank.map((prov, index) => (
            <Flex
              align="center"
              gap="small"
              justify="space-between"
              key={prov.province}
              style={{
                height: 40,
                padding: '2px 15px',
                borderBottom: '1px solid white',
                backgroundColor:
                  index === 0
                    ? 'goldenrod'
                    : index === 1
                      ? 'silver'
                      : index === 2
                        ? '#CD7F32'
                        : 'inherit',
              }}
            >
              <div>{prov.province}</div>
              <div>{prov.user_count}</div>
            </Flex>
          ))}
        </Flex>
      )}
    </NormalPage>
  );
};

export default PointRank;
