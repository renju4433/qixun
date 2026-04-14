import MapsExplore from '@/components/Game/MapsExplore';
import { getMapInfo } from '@/services/api';
import { message } from 'antd';
import { FC, useEffect, useState } from 'react';
import styles from './style.less';

type MapPickerProps = {
  value?: number;
  move?: boolean;
  onChange: (value: number, move: boolean) => void;
  setCanMove?: (value: boolean) => void;

  // 是否只读
  readonly?: boolean;
};

const MapPicker: FC<MapPickerProps> = ({
  value,
  move,
  onChange,
  setCanMove,
  readonly,
}) => {
  const [currentMap, setCurrentMap] = useState<API.MapItem | null>();
  const [mapPickerModal, setMapPickerModal] = useState<boolean>(false);

  useEffect(() => {
    if (value) {
      getMapInfo({ mapsId: value }).then((res) => setCurrentMap(res.data));
    }
  }, [value]);

  // 切换题库时更新可移动状态
  useEffect(() => {
    setCanMove?.(currentMap?.canMove ?? false);
  }, [currentMap]);

  return (
    <div className={styles.mapPickerContainer}>
      <div className={styles.mapPickerSelected}>
        <span>题库</span>
        <p>{currentMap?.name}</p>
        <div
          className={styles.mapPickerDescription}
          onClick={() => {
            if (readonly) message.warning('只有房主才能修改');
            else setMapPickerModal(true);
          }}
        >
          <picture>
            <img
              src={`https://b68v.daai.fun/${
                currentMap?.cover ??
                'biz/1659323781589_7d19c33667a54a4dabb0405ee5aec20f.jpeg'
              }?x-oss-process=image/resize,h_200`}
            />
          </picture>
        </div>
      </div>
      <MapsExplore
        title="选择派对题库"
        open={mapPickerModal}
        onChange={(mapId, move) => {
          onChange(mapId, move);
          setMapPickerModal(false);
        }}
        move={move}
        onClose={() => setMapPickerModal(false)}
      />
    </div>
  );
};

export default MapPicker;
