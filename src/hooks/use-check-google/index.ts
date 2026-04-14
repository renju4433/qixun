import { logServer } from '@/services/api';
import { useEffect } from 'react';

type useCheckGoogleProps = {
  callback: (canAccess: boolean) => void;
};
export const useCheckGoogle = ({ callback }: useCheckGoogleProps) => {
  async function fetchWithTimeout(
    url: string,
    options: RequestInit & { timeout?: number } = {},
  ): Promise<Response> {
    const { timeout = 1000 } = options; // 默认超时时间设置为3000毫秒
    delete options.timeout; // 从选项中移除timeout属性，以便这些选项可以直接被fetch使用

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeout);
    });

    return Promise.race([fetch(url, options), timeoutPromise]);
  }

  useEffect(() => {
    fetchWithTimeout(
      'https://streetviewpixels-pa.googleapis.com/cbk?t=' + Date.now(),
      { method: 'GET', mode: 'cors', timeout: 300 },
    )
      .then((response) => {
        console.log(response);
        if (
          response.status !== 200 &&
          response.status !== 400 &&
          response.status !== 404
        ) {
          logServer({ text: '访问谷歌服务失败: ' + response.status });
          callback(false);
          return response.blob();
        }
        callback(true);
        return response.blob();
      })
      .then(() => {})
      .catch((error) => {
        callback(false);
        logServer({ text: '访问谷歌服务失败: ' + error });
      });
  }, []);

  // 可选：返回一些值供组件使用
};
