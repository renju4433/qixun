import WaterfallList from '@/components/Interact/WaterfallList';
import MyMapCard from '@/components/Maps/MyMapCard';
import NormalPage from '@/pages/NormalPage';
import {
  deleteMapRequest,
  getOwnMapsRequest,
  publishMapRequest,
  unpublishMapRequest,
} from '@/services/api';
import { useNavigate } from '@umijs/max';
import { Button, Empty, Flex } from 'antd';
import { useEffect, useState } from 'react';

const MyMaps = () => {
  const [mapList, setMapList] = useState<API.MapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigator = useNavigate();

  const getMap = () => {
    setLoading(true);
    getOwnMapsRequest()
      .then((res) => setMapList(res.data))
      .finally(() => setLoading(false));
  };
  useEffect(getMap, []);

  const handlePublish = (mapId: number) => {
    publishMapRequest({ mapsId: mapId }).then(getMap);
  };

  const handleUnpublish = (mapId: number) => {
    unpublishMapRequest({ mapsId: mapId }).then(getMap);
  };

  const handleDelete = (mapId: number) => {
    deleteMapRequest({ mapsId: mapId }).then(getMap);
  };

  return (
    <NormalPage title="我的题库">
      <Flex justify="center" style={{ marginBottom: 16 }}>
        <Button onClick={() => navigator('/mapCreate')} size="large">
          创建
        </Button>
      </Flex>

      {mapList.length === 0 && !loading ? (
        <Empty description="暂未创建题库" />
      ) : (
        <WaterfallList
          dataSource={mapList}
          loading={loading}
          renderItem={(item) => (
            <MyMapCard
              map={item}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
            />
          )}
        />
      )}
    </NormalPage>
  );
};

export default MyMaps;
