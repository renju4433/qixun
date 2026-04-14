import { createMap, listOwnMaps, userAddPanorama } from '@/services/api';
import { Button, Flex, Modal, Select, message } from 'antd';
import { FC, useEffect, useState } from 'react';

type CollectModalProps = {
  show: boolean;
  panoId: string;
  onClose: () => void;
};

type UploadPanoramaParams = {
  links: string;
  mapsId: number;
};

const { Option } = Select;

const PanoCollectModal: FC<CollectModalProps> = ({ show, panoId, onClose }) => {
  const [maps, setMaps] = useState<API.MapItem[]>([]);
  const [selectedMap, setSelectedMap] = useState<number>();

  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const res = await listOwnMaps();
        if (res.success) {
          const sortedMaps = res.data.sort((a, b) =>
            a.name.includes('收藏') && !b.name.includes('收藏')
              ? -1
              : !a.name.includes('收藏') && b.name.includes('收藏')
              ? 1
              : 0,
          );
          setMaps(sortedMaps);
        } else setMaps(res.data);
      } catch (error) {
        message.error('获取题库列表失败');
      }
    };
    if (show) fetchMaps();
  }, [show]);

  const handleCollect = async () => {
    if (!selectedMap) {
      message.error('请选择要保存到的题库');
      return;
    }
    try {
      const params: UploadPanoramaParams = {
        links: panoId,
        mapsId: selectedMap,
      };
      const res = await userAddPanorama(params);
      if (res.success) {
        message.success('街景收藏成功');
        onClose();
      } else throw new Error(res.errorMessage || '街景收藏失败');
    } catch (error) {
      message.error('街景收藏失败，请稍后重试，或反馈问题');
    }
  };

  const handleAutoCreate = () => {
    createMap({
      name: '街景收藏',
      desc: `于${new Date().toLocaleString()}自动创建。`,
    }).then((res) => {
      if (res.success && res.data) {
        message.success('创建题库成功');
        setSelectedMap(res.data.id);
      }
    });
  };

  return (
    <Modal
      open={show}
      title="收藏街景"
      okButtonProps={{ disabled: !selectedMap }}
      okText="收藏"
      onCancel={onClose}
      onClose={onClose}
      onOk={handleCollect}
    >
      <p>请选择要保存到的题库：</p>
      {maps.length > 0 ? (
        <Select
          style={{ width: '100%' }}
          placeholder="请选择题库"
          value={selectedMap}
          onChange={(v) => setSelectedMap(v)}
        >
          {maps.map((map) => (
            <Option key={map.id} value={map.id}>
              {map.name}
            </Option>
          ))}
        </Select>
      ) : (
        <Flex align="center">
          <p>暂无题库可选，请先创建题库。</p>
          <Button type="primary" onClick={handleAutoCreate}>
            一键创建
          </Button>
        </Flex>
      )}
    </Modal>
  );
};

export default PanoCollectModal;
