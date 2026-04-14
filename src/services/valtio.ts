import { proxyWithPersistant } from './extend';

export const settings = proxyWithPersistant(
  {
    useClassicCompass: false,
    classicCompass: true,
    newCompass: true,
    danmu: true,
    mapSize: 2,
    mapPin: false,
    mapType: 'petal',
  },
  { key: 'qixun_SETTINGS' },
);
