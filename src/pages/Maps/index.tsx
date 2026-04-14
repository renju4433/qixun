import MapsExplore from '@/components/Game/MapsExplore';
import MapCard from '@/components/Maps/MapCard';
import { useDevTools } from '@/hooks/use-dev-tools';
import NormalPage from '@/pages/NormalPage';
import {
  getHotMaps,
  getNewMaps,
  getRecentMaps,
  getRecommendMaps,
  getStreakMaps,
  listMapCollection,
} from '@/services/api';
import { useModel } from '@@/exports';
import { history } from '@umijs/max';
import { Button, Flex, Segmented } from 'antd';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

const Maps = () => {
  // const [tags, setTags] = useState(['最近', '收藏', '推荐', '最新', '最热']);

  useDevTools();
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [maps, setMaps] = useState<API.MapItem[]>();
  const [rank, setRank] = useState<string>(user ? 'recent' : 'hot');
  const [period, setPeriod] = useState<string>('1day');
  const [showSearch, setShowSearch] = useState<boolean>(false);

  const fetchData = async () => {
    let responseData;
    switch (rank) {
      case 'hot':
        responseData = await getHotMaps({ duration: period, count: 100 });
        break;
      case 'new':
        responseData = await getNewMaps({ count: 100 });
        break;
      case 'recommend':
        responseData = await getRecommendMaps({ count: 100 });
        break;
      case 'collection':
        responseData = await listMapCollection();
        break;
      case 'recent':
        responseData = await getRecentMaps({ count: 20 });
        if (responseData.data.length === 0) setRank('recommend');
        break;
      case 'streak':
        responseData = await getStreakMaps({ count: 20 });
        break;
      default:
        return;
    }
    setMaps(responseData.data);
  };

  useEffect(() => {
    fetchData();
  }, [rank, period]);

  return (
    <NormalPage title="题库(VIP)">
      <Flex gap="small" vertical>
        <Flex gap="small" justify="center">
          <Button onClick={() => setShowSearch(true)}>搜索题库</Button>
          <Button onClick={() => history.push('/mymaps')}>我的题库</Button>
        </Flex>

        <Flex align="center" gap="small" wrap="wrap" justify="space-between">
          <Segmented
            value={rank}
            size="large"
            options={[
              user ? { label: '历史', value: 'recent' } : '',
              { label: '最热', value: 'hot' },
              { label: '精选', value: 'recommend' },
              { label: '最新', value: 'new' },
              { label: '连胜', value: 'streak' },
              { label: '收藏', value: 'collection' },
            ]}
            onChange={(v) => setRank(v)}
          />
          {rank === 'hot' && (
            <Segmented
              value={period}
              options={[
                { label: '一天', value: '1day' },
                { label: '一周', value: '1week' },
                { label: '一月', value: '1month' },
                { label: '一年', value: '1year' },
                { label: '所有', value: 'all' },
              ]}
              onChange={(v) => setPeriod(v)}
            />
          )}
        </Flex>

        <Flex
          gap="middle"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${window.innerWidth < 400 ? 1 : window.innerWidth < 600 ? 2 : window.innerWidth < 800 ? 3 : 4}, 1fr)`,
          }}
        >
          {maps?.map((map) => (
            <MapCard key={map.id} map={map} />
          ))}
        </Flex>
        {(!maps || maps.length === 0) && <div>暂无题库</div>}
      </Flex>

      <MapsExplore
        title="搜索题库"
        open={showSearch}
        move={false}
        onlySearch
        onChange={(mapId) => history.push('/map/' + mapId)}
        onClose={() => setShowSearch(false)}
      />
    </NormalPage>
  );
};

export default Maps;
