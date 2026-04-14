import {
  StyleProvider,
  legacyLogicalPropertiesTransformer,
} from '@ant-design/cssinjs';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import * as Sentry from '@sentry/react';
import { RunTimeLayoutConfig } from '@umijs/max';
import React from 'react';
import defaultSettings from '../config/defaultSettings';
import { baseURL } from './constants';
import { errorConfig } from './requestErrorConfig';
import { getProfile } from './services/api';

const loginPath = ['/user/login', '/user/register'];

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  user?: API.UserProfile;
  loading?: boolean;
  isInApp?: boolean;
  isIniOS?: boolean;
  isInAndroid?: boolean;
  isInWeChat?: boolean;
  fetchUserInfo?: () => Promise<API.UserProfile | undefined>;
}> {
  // 判断是否在App内
  const isInApp = window.navigator.userAgent.includes('qixun');
  const isIniOS = /(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent);
  const isInAndroid = /(Android)/i.test(navigator.userAgent);
  const isInWeChat = /(micromessenger)/i.test(navigator.userAgent);

  const fetchUserInfo = async () => {
    try {
      const msg = await getProfile({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (error) {}
    return undefined;
  };
  // 如果不是登录页面，执行
  const userData = await fetchUserInfo();

  if (userData) {
    // 设置Sentry用户信息，忽略错误
    try {
      Sentry.setUser({
        id: userData.userId,
        username: userData.userName,
      });
    } catch (error) {}
  }

  return {
    fetchUserInfo,
    user: userData,
    settings: defaultSettings as Partial<LayoutSettings>,
    isInApp,
    isIniOS,
    isInAndroid,
    isInWeChat,
  };

  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
    isInApp,
    isIniOS,
    isInAndroid,
    isInWeChat,
  };
}

/**
 * Layout配置
 */
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    headerRender: false,
    footerRender: false,
    menuRender: false,
    menuHeaderRender: false,
    menuExtraRender: false,
    layout: 'top',
    contentStyle: {
      padding: 0,
      flex: '1 1 auto',
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
  baseURL,
  withCredentials: true,
  ...errorConfig,
};

// 去除google 的内存泄漏
export function onRouteChange({ routes, matchedRoutes, location, action }) {
  // console.log('路由变化');
  // console.log(routes);
  // console.log(matchedRoutes);
  // console.log(location);
  // console.log(action);
  // console.trace('onRouteChange triggered');
  if (window.google) {
    window.location.reload();
    console.log('隔离重启～');
  }
  // console.log('路由变化检测结束');
}

// 兼容旧版，增加StyleProvider
export function rootContainer(container: React.ReactNode) {
  return React.createElement(
    StyleProvider,
    {
      hashPriority: 'high',
      transformers: [legacyLogicalPropertiesTransformer],
    },
    container,
  );
}

Sentry.init({
  dsn: 'https://b1b311e434ee5e3ffe7091b1493ffbb7@o4505047283793920.ingest.sentry.io/4506047901794304',
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ['localhost', /^https:\/\/saiyuan\.top\/api/],
    }),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 0.01, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 0.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  ignoreErrors: [
    'The user aborted a request.',
    'Fetch is aborted',
    'The operation was aborted.',
    'WebSocket disconnected',
    'Request aborted',
    'Network Error',
    'timeout exceeded',
    'BizError',
    'useRequest',
    '登录',
    'chrome-extension',
    'a.ta',
    'a.Qd',
    'Still in CONNECTING state',
    'Could not load "stats".',
  ], // Ignore abort errors
});
