import { proxy, snapshot, subscribe } from '@umijs/max';
import BigNumber from 'bignumber.js';

export function proxyWithPersistant<V>(
  val: V,
  opts: {
    key: string;
  },
) {
  const local = localStorage.getItem(opts.key);
  const state = proxy(local ? JSON.parse(local) : val);
  subscribe(state, () => {
    localStorage.setItem(opts.key, JSON.stringify(snapshot(state)));
  });
  return state;
}

/**
 * 距离显示
 *
 * @export
 * @param {number} distance 距离
 * @return {string} 显示优化后的距离
 */
export function distanceDisplay(distance: number): string {
  return (distance ?? 0) < 1
    ? `${new BigNumber(distance ?? 0).times(1000).toFormat(0)} m`
    : `${distance.toFixed(
        // 1万公里以上只保留整数
        (distance ?? 0) >= 10000
          ? 0
          : // 1千公里以上只保留1位小数
          (distance ?? 0) >= 1000
          ? // 1百公里以上只保留1位小数
            1
          : (distance ?? 0) >= 100
          ? 2
          : 3,
      )} km`;
}

/**
 * 秒转分秒
 *
 * @export
 * @param {number} seconds 秒
 * @return {string} 分秒
 */
export function secondsToMinutesAndSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secondsRemainder = seconds % 60;
  return `${minutes ? `${minutes}分` : ''}${
    secondsRemainder ? `${secondsRemainder}秒` : ''
  }`;
}
