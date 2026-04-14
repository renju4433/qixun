import { message } from 'antd';

/**
 * 向APP发送消息
 *
 * @export
 * @template T 参数类型
 * @param {string} action 操作
 * @param {T} params 参数
 * @param {string} error 错误提示
 */
export function postMessage<T>(action: string, params: T, error?: string) {
  try {
    window.qixunAppJSBridge.postMessage(
      JSON.stringify({
        action,
        params,
      }),
    );
  } catch (e) {
    if (error) {
      message.error(error);
    } else {
      throw e;
    }
  }
}

/**
 * 跳转到棋寻首页
 *
 * @export
 */
export function gotoAppHome() {
  postMessage('goHome', {}, 'App内暂不支持跳转到棋寻首页');
}
