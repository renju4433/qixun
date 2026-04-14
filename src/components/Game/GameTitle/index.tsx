import { FC } from 'react';

type GameTitleProps = {
  type?: GameType;
  mapsName?: API.GameInfo['mapsName'];
  mapsId?: API.GameInfo['mapsId'];
};
const GameTitle: FC<GameTitleProps> = ({ type, mapsId, mapsName }) => {
  const name =
    type &&
    (type === 'daily_challenge'
      ? `每日挑战-${mapsId === 9 ? '中国' : '全球'}`
      : mapsName);

  return (
    <div style={{ fontSize: 18 }}>
      {name && name.length >= 18 ? name.substring(0, 15) + '...' : name}
    </div>
  );
};

export default GameTitle;
