import { publicPath } from '@/constants';
import { FlagTwoTone } from '@ant-design/icons';
import { Avatar, Badge } from 'antd';
import { FC } from 'react';
import { Marker } from 'react-map-gl/maplibre';

type TargetMarkerProps = {
  lat: number;
  lng: number;
  round?: number | undefined;
  onClick?: () => void;
};
const TargetMarker: FC<TargetMarkerProps> = ({ lat, lng, round, onClick }) => {
  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      pitchAlignment="map"
      offset={[0, 0]}
      style={{
        color: '#FFF',
        height: '44px',
        backgroundImage: `url(${publicPath}/images/marker_background_black.png`,
        backgroundSize: '100%',
        backgroundRepeat: 'no-repeat',
        zIndex: 100,
        padding: '4px',
        boxSizing: 'border-box',
      }}
      onClick={onClick}
    >
      {round && (
        <Badge
          count={`第${round}轮`}
          overflowCount={1000000}
          offset={[-15, 50]}
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
        </Badge>
      )}
    </Marker>
  );
};

export default TargetMarker;
