import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { REACT_APP_ENV = 'dev', API_ENV, npm_package_version } = process.env;

const timestamp = Date.now();

export default defineConfig({
  hash: true,
  chainWebpack(config) {
    // JS 文件命名
    config.output
      .filename(`[name].${timestamp}.[contenthash:8].js`)
      .chunkFilename(`[name].${timestamp}.[contenthash:8].async.js`);

    // CSS 文件命名 - 使用 mini-css-extract-plugin
    if (config.plugins.has('mini-css-extract-plugin')) {
      config.plugin('mini-css-extract-plugin').tap((args) => {
        args[0].filename = `[name].${timestamp}.[contenthash:8].css`;
        args[0].chunkFilename = `[name].${timestamp}.[contenthash:8].chunk.css`;
        return args;
      });
    }
  },
  publicPath: '/',
  reactRouter5Compat: true,
  devtool: 'source-map',
  define: {
    'process.env.API_ENV': API_ENV,
    'process.env.REACT_APP_ENV': REACT_APP_ENV,
    'process.env.VERSION': npm_package_version,
  },
  antd: {
    dark: true,
    theme: {
      components: {
        Button: {
          defaultBg: 'transparent',
        },
      },
      token: {
        colorPrimary: '#fa8c16', // 品牌色
        colorPrimaryBg: '#090723', // 品牌色 - 深色背景
        colorBgElevated: '#151515', // 浮层背景
        colorTextBase: '#fff', // 基础色 - 文本
        fontFamily:
          "'SF Pro SC', 'SF Pro Display', 'SF Pro Icons', 'Microsoft YaHei UI','Microsoft JhengHei UI', 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      },
    },
  },
  layout: {
    ...defaultSettings,
  },
  title: '棋寻 - 以棋会友',
  metas: [
    { name: 'keywords', content: '棋寻,炒饭社区,网络迷踪,Geoguessr' },
    {
      name: 'description',
      content: '以棋会友',
    },
  ],
  model: {},
  initialState: {},
  valtio: {},
  request: {},
  routes,
  headScripts: [
    {
      content: `document.documentElement.lang = 'zh-CN';`,
    },
    // 解决首次加载时白屏的问题
    { src: '/scripts/loading.js', async: true },
  ],
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },
  autoprefixer: {
    overrideBrowserslist: ['> 1%', 'last 2 versions', 'not ie <= 11'],
  },
  extraPostCSSPlugins: [
    [
      'postcss-preset-env',
      {
        // Options
        features: {
          browsers: 'defaults',
        },
      },
    ],
  ],
  analyze: {},
  analytics: {
    baidu: 'e7166bd8d0c253eb08e345c1bc6e0ed7', // 炒饭百度统计
  },
  fastRefresh: true,
  polyfill: { imports: ['resize-observer-polyfill'] },
  mfsu: {
    strategy: 'normal',
  },
  esbuildMinifyIIFE: true,
  presets: ['umi-presets-pro'],
  requestRecord: {},
  favicons: [],
  /**
   * @name 代理配置
   * @description 可以让你的本地服务器代理到你的服务器上，这样你就可以访问服务器的数据了
   * @see 要注意以下 代理只能在本地开发时使用，build 之后就无法使用了。
   * @doc 代理介绍 https://umijs.org/docs/guides/proxy
   * @doc 代理配置 https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],
  npmClient: 'yarn',
  targets: { chrome: 67 },
});
