export function getGameTypeNameByString(gameType: string): string {
  switch (gameType) {
    case 'main_game':
      return '全球积分赛';
    case 'daily_challenge':
      return '每日挑战';
    case 'infinity':
      return '无限轮次';
    case 'battle_royale':
      return '淘汰赛';
    case 'challenge':
      return '经典五轮';
    case 'team_match':
      return '组队/不记分匹配';
    case 'solo':
      return '1V1对决';
    case 'team':
      return '组队对决';
    case 'map_country_streak':
      return '题库国家连胜';
    case 'country_streak':
      return '国家连胜';
    case 'province_streak':
      return '省份连胜';
    case 'rank':
      return '排位赛';
  }
  return gameType;
}

export function getGameTypeName(game: API.GameInfo): string {
  let name;
  switch (game.type) {
    case 'solo_match':
      if (game.china) name = '中国积分匹配';
      else name = '全球积分匹配';

      if (game.move) name += '（移动）';
      else {
        // 检查是否为眨眼模式
        if (game.blinkTime && game.blinkTime > 0) {
          name += '（眨眼模式）';
        } else if (game.pan) {
          name += '（固定）';
        } else {
          name += '（固定视角）';
        }
      }
      break;
    case 'team_match':
      if (game.china) name = '中国组队/不记分匹配';
      else name = '全球组队/不记分匹配';
      break;
    default:
      // 对于其他游戏类型，也需要检查眨眼模式
      name = getGameTypeNameByString(game.type);
      if (game.blinkTime && game.blinkTime > 0) {
        name += '（眨眼模式）';
      } else if (!game.move && !game.pan) {
        name += '（固定视角）';
      } else if (!game.move && game.pan) {
        name += '（固定）';
      } else if (game.move) {
        name += '（移动）';
      }
      return name;
  }
  return name ?? '';
}

export function getPartyGameTypeName(type: string | undefined): string {
  switch (type) {
    case 'team':
      return '组队赛';
    case 'br':
      return '淘汰赛';
    case 'rank':
      return '排位赛';
    case 'solo':
      return '1v1';
  }

  return '';
}
