import { FC } from 'react';

type BaiduLogoProps = {
  zIndex?: string | null;
};
const BaiduLogo: FC<BaiduLogoProps> = ({ zIndex }) => (
  <div
    style={{
      position: 'absolute',
      bottom: '10px',
      width: '100%',
      margin: 'auto',
      zIndex: zIndex ?? '1',
      alignItems: 'center',
      justifyItems: 'center',
      textAlign: 'center',
    }}
  >
    <img
      style={{ width: '100px', margin: 'auto' }}
      src="https://webmap0.bdimg.com/wolfman/static/pano/images/pano-logo_7969e0c.png"
    />
  </div>
);

export default BaiduLogo;
