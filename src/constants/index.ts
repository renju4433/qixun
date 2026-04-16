// 炒饭地图图层样式

const CFMapTileBase =
  'https://maprastertile-drcn.dbankcdn.cn/display-service/v1/online-render/getTile/25.12.27.15/{z}/{x}/{y}/?language=zh&p=46&scale=2&mapType=ROADMAP&presetStyleId=standard&pattern=JPG&key=DAEDANitav6P7Q0lWzCzKkLErbrJG4kS1u%2FCpEe5ZyxW5u0nSkb40bJ%2BYAugRN03fhf0BszLS1rCrzAogRHDZkxaMrloaHPQGO6LNg==';
// 'https://mapapi.cloud.huawei.com/mapApi/v1/mapService/getTile?x={x}&y={y}&z={z}&language=zh&scale=2&key=DAEDAALLJxDN3xIxrZz2g5NX2lXE%2Fqbk4v%2BzupvIWqwiMyZDKFQr3CqRmVb6Jn1cgoBxn20G47eawHQwysQulh3nYfG9pToO0CdGfA%3D%3D';

// 小屏幕优化
const bigScreen = window.screen.width * window.screen.height > 375 * 667;

export const CFMapTile = bigScreen
  ? // 'https://map2.chao-fan.com/tile230411/s2_z{z}_x{x}_y{y}.jpeg';
  CFMapTileBase
  : CFMapTileBase.replace('scale=2', 'scale=1');

// 'https://mapapi.cloud.huawei.com/mapApi/v1/mapService/getTile?x={x}&y={y}&z={z}&language=zh&scale=2&key=DAEDAALLJxDN3xIxrZz2g5NX2lXE%2Fqbk4v%2BzupvIWqwiMyZDKFQr3CqRmVb6Jn1cgoBxn20G47eawHQwysQulh3nYfG9pToO0CdGfA%3D%3D';
export const CFMap2Tile =
  'https://map2.chao-fan.com/tile230411/s2_z{z}_x{x}_y{y}.jpeg';

// 炒饭BIZ资源地址
export const CFBizUri = 'https://b68v.daai.fun/';

// 获取环境
export const apiEnv = process.env.API_ENV;
export const appEnv = process.env.REACT_APP_ENV;
const isLocalHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

// API基础地址
export const baseURL =
  isLocalHost || !apiEnv || apiEnv === 'local' ? '/api' : 'https://saiyuan.top/api';
export const baseWSURL =
  isLocalHost || !apiEnv || apiEnv === 'local'
    ? `ws://${window.location.host}/ws`
    : 'wss://saiyuan.top/ws';

// public资源目录地址
export const publicPath =
  !appEnv || appEnv === 'uat' || appEnv === 'dev'
    ? ''
    : '';

export const provinces: string[] = [
  '广东',
  '北京',
  '上海',
  '浙江',
  '江苏',
  '山东',
  '福建',
  '四川',
  '河南',
  '安徽',
  '江西',
  '河北',
  '重庆',
  '湖南',
  '湖北',
  '海南',
  '黑龙江',
  '天津',
  '贵州',
  '陕西',
  '广西',
  '云南',
  '内蒙古',
  '辽宁',
  '青海',
  '新疆',
  '西藏',
  '吉林',
  '山西',
  '甘肃',
  '宁夏',
  '香港',
  '澳门',
  '台湾',
];

// 复盘链接正则（统一复用）
export const REPLAY_PANO_LINK_REGEX: RegExp =
  /https:\/\/saiyuan\.top\/replay-pano\?gameId=[a-f0-9\-]+&round=\d+/g;
