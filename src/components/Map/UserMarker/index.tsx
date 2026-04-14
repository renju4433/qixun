import { CFBizUri, publicPath } from '@/constants';
import { Avatar, Badge } from 'antd';
import moment from 'moment';
import { FC, useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';

type UserMarkerProps = {
  user: API.UserProfile;
  guess: API.UserGuessPinHint;
  onClick?: () => void | undefined;
  teamIndex?: number | undefined;
  is2Teams?: boolean | undefined;
};
const UserMarker: FC<UserMarkerProps> = ({
  user,
  guess,
  onClick,
  teamIndex = undefined,
  is2Teams = false,
}) => {
  const time: string | null = useMemo(() => {
    if (guess.timeConsume) return moment(guess.timeConsume).format('mm:ss');
    else return null;
  }, [guess]);

  return (
    <Marker
      key={guess.round}
      longitude={guess.lng}
      latitude={guess.lat}
      anchor="bottom"
      pitchAlignment="map"
      offset={[0, 0]}
      onClick={onClick}
      style={{
        height: '42px',
        backgroundImage: is2Teams
          ? teamIndex === 0
            ? `url(${publicPath}/images/marker_background_red.png)`
            : `url(${publicPath}/images/marker_background_blue.png)`
          : `url(${publicPath}/images/marker_background.png)`,
        backgroundSize: '100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Badge
        count={`${user.userName}${time ? ` ${time}` : ''}`}
        overflowCount={10000000000}
        offset={[-18, -12]}
        color="#FFF"
        style={{
          color: '#000',
          fontWeight: '700',
          maxWidth: '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <Avatar
          src={`${CFBizUri}${user.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
        />
      </Badge>
    </Marker>
  );
};

export default UserMarker;
