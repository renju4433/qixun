declare type GameStatus =
  | 'ready'
  | 'wait_join'
  | 'ongoing'
  | 'finish'
  | 'match_fail';

declare type PartyMatchType = 'solo' | 'team' | 'br' | 'rank'; // 派对比赛类型

declare type GameType =
  | 'point'
  | 'solo'
  | 'solo_match'
  | 'team'
  | 'team_match'
  | 'daily_challenge'
  | 'challenge'
  | 'battle_royale'
  | 'infinity'
  | 'main_game'
  | 'country_streak'
  | 'rank'
  | 'province_streak'
  | 'map_country_streak'; // 比赛类型 solo: 1v1对决, solo_match: 1v1对决, team: 组队赛, battle_royale: 淘汰赛

declare type GameResult = {
  winner?: API.UserProfile; // 获胜者
  winTeam?: API.PartyTeam; // 获胜队伍
  isWin?: boolean; // 是否获胜
  yourTeam?: API.PartyTeam; // 你所在的队伍
}; // 比赛结果

declare type ViewOptions = {
  move: boolean;
  pan: boolean;
  heading: number;
  zoom: number;
  pitch: number;
}; // 街景视图选项

declare type DailyChallengeType = 'gomoku' | 'xiangqi' | 'chess'; // 日挑类型（五子棋、中国象棋、国际象棋）
declare type DailyChallengeRankType = 'rankNew' | 'rankFriend'; // 日挑排行类型

declare type StreakType =
  | 'province'
  | 'province_move'
  | 'country'
  | 'country_move'; // 连胜类型

declare type StreakRankType = 'friends' | 'all'; // 连胜排行类型

declare type PanoInfo = {
  panoId: string; // 街景ID
  heading: number; // 街景朝向
  source: 'baidu_pano' | 'qixun_pano' | 'google_pano' | 'qq_pano'; // 街景来源
  links: (google.maps.StreetViewLink & {
    centerHeading?: number | null;
  })[]; // 街景链接图
  worldSize: google.maps.Size | null; // 街景尺寸
  lng: number; // 街景经度
  lat: number; // 街景纬度
}; // 街景信息

declare type PanoTarget = {
  longitude: number;
  latitude: number;
}; // 目标位置

declare type RoundCountDownType = 'start' | 'first' | 'mixed'; // 倒计时类型

declare type CompetitionModel = 'Point.model' | 'Challenge.model'; // 比赛模型

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | false;

declare interface Window {
  qixunAppJSBridge: {
    /**
     * 向APP发送消息
     *
     *
     */
    postMessage: (message: string) => void;
  };
}
