export default [
  {
    path: '/',
    key: 'home',
    component: './',
  },

  {
    path: '/point',
    name: '积分赛',
    component: './Point',
  },

  {
    path: '/point-rank',
    name: '积分排名',
    component: './PointRank',
  },

  {
    path: '/vip',
    name: 'vip',
    component: './VIP',
  },
  {
    path: '/explain',
    name: '图解',
    component: './XunTu',
  },

  {
    path: '/doc',
    name: '棋寻文档',
    component: './Doc',
  },

  {
    path: '/match',
    key: 'match',
    name: '匹配',
    component: './AllMatch',
  },

  {
    path: '/world-match',
    redirect: '/match?tab=world',
  },

  {
    path: '/streak',
    name: '连胜',
    component: './Streak',
  },

  // ====== 连胜 Start ======
  {
    path: '/streak',
    name: '连胜',
    routes: [
      {
        path: '/streak',
        name: '连胜',
        component: './Streak',
      },
      {
        path: '/streak/:type',
        name: '连胜',
        component: './Streak',
      },
    ],
  },
  {
    path: '/challenge/:challengeId',
    name: '每日挑战',
    component: './Challenge',
  },
  {
    path: '/challenge-hub/:hubId',
    name: '题库挑战',
    component: './Maps/ChallengeHub',
  },
  // ====== 每日挑战 End ======

  {
    path: '/china-match',
    redirect: '/match?tab=china',
  },

  {
    path: '/team',
    redirect: '/match?tab=team',
  },

  {
    path: '/teamjoin/:teamId',
    name: '加入队伍',
    component: './AllMatch/Join',
  },

  {
    path: '/friend',
    name: '我的好友',
    component: './Friend',
  },

  {
    path: '/message',
    name: '消息/通知',
    component: './Messages',
  },

  // ====== 每日挑战 Start ======
  {
    path: '/daily-challenge',
    key: 'daily-challenge',
    name: '每日挑战',
    routes: [
      {
        path: '/daily-challenge',
        redirect: '/daily-challenge/gomoku',
      },
      {
        path: '/daily-challenge/:type',
        name: '每日挑战',
        component: './DailyChallenge',
      },
    ],
  },
  {
    path: '/challenge/:challengeId',
    name: '每日挑战',
    component: './Challenge',
  },
  {
    path: '/iframe',
    name: 'iframe',
    component: './Iframe',
  },
  // ====== 每日挑战 End ======

  // ====== 派对 Start ======
  {
    path: '/party',
    name: '派对',
    component: './Party',
  },
  {
    path: '/paidui',
    name: '派对',
    component: './Party',
  },
  {
    path: '/social',
    name: '派对',
    component: './Party',
  },
  {
    path: '/party-new',
    name: '派对',
    component: './Party',
  },
  {
    path: '/party/:gameId',
    name: '派对',
    component: './Challenge',
  },
  {
    path: '/solo/:gameId',
    name: '匹配',
    component: './Challenge',
  },
  // {
  //   path: '/solo-app/:gameId',
  //   name: '匹配',
  //   component: './ChallengeApp',
  // },
  {
    path: '/join',
    name: '加入派对',
    component: './Party/Join',
  },
  {
    path: '/join-new',
    name: '加入派对',
    component: './Party/Join',
  },
  {
    path: '/join-new/:code',
    name: '加入派对',
    component: './Party/Join/redirect',
  },
  {
    path: '/join/:code',
    name: '加入派对',
    component: './Party/Join/redirect',
  },
  {
    path: '/party/error/:type',
    name: '派对',
    component: './Party/Join/error',
  },
  // ====== 派对 End ======

  // ====== 揭图 End ======

  // ====== 题库 Start ======

  {
    path: '/mymaps',
    name: '题库',
    component: './Maps/MyMaps',
  },
  {
    path: '/maps',
    name: '题库',
    component: './Maps',
  },
  {
    path: '/maps-new',
    name: '题库',
    component: './Maps',
  },
  {
    path: '/map/:mapId',
    name: '题库详情',
    component: './Maps/Detail',
  },
  {
    path: '/mapmodify/:mapId',
    name: '题库管理',
    component: './Maps/Modify',
  },
  {
    path: '/mapfilter/:mapId',
    name: '题库筛选',
    component: './Maps/Filter',
  },
  {
    path: '/mapreport/:mapId',
    name: '坏题处理',
    component: './Maps/Report',
  },
  {
    path: '/mapcreate',
    name: '创建题库',
    component: './Maps/Create',
  },
  {
    path: '/mapmaker/:mapId',
    name: '题库制作',
    component: './Maps/Maker',
  },
  {
    path: '/baidumaker/:mapId',
    name: '百度街景添加',
    component: './Maps/Maker/BaiduMaker',
  },
  {
    path: '/maptagger/:mapId',
    name: '标签管理',
    component: './Maps/Tagger',
  },
  {
    path: '/mapdistribute/:mapId',
    name: '街景分布',
    component: './Maps/Distribute',
  },
  // ====== 题库 End ======
  {
    path: '/user/login',
    name: '登录',
    component: './User/Login',
  },
  {
    path: '/user/register',
    name: '注册',
    component: './User/Register',
  },
  {
    path: '/user/settings',
    name: '设置',
    component: './User/Settings',
  },
  {
    path: '/user/change-password',
    name: '修改密码',
    component: './User/ChangePassword',
  },
  {
    path: '/mall',
    name: '商店',
    component: './Mall',
  },
  {
    path: '/user/bag',
    name: '背包',
    component: './User/BackPack',
  },
  {
    path: '/peripheral',
    name: '周边',
    component: './Peripheral',
  },
  {
    path: '/event',
    name: '寻景',
    component: './Event',
  },
  {
    path: '/event/user/:userId',
    name: '寻景个人页',
    component: './Event',
  },
  {
    path: '/event-upload',
    name: '寻景上传',
    component: './Event/Upload',
  },
  {
    path: '/event-manager',
    name: '投稿管理',
    component: './Event',
  },
  {
    path: '/event-modify/:id',
    name: '寻景修改',
    component: './Event/Upload',
  },
  {
    path: '/replay',
    name: '街景复盘',
    component: './Replay',
  },
  {
    path: '/replay-pano',
    name: '街景复盘',
    component: './Replay/ReplayPano',
  },
  {
    path: '/replayplayer',
    name: '对局回放',
    component: './Replay/ReplayPlayer',
  },
  {
    path: '/user/analysis',
    name: '技术分析',
    component: './User/Analysis',
  },

  {
    path: '/user/:id',
    name: '个人主页',
    component: './User/Profile',
  },

  {
    path: '/activities',
    name: '比赛记录',
    component: './Activities',
  },

  // ====== App ======
  {
    path: '/app',
    name: '棋寻App',
    component: './App',
  },

  {
    path: '/app/update',
    name: 'App更新',
    component: './App',
  },

  // ====== 其他 ======
  {
    path: '/keda',
    name: '文档机器人',
    component: './Keda',
  },
  {
    path: '/uid-pay',
    name: '会员充值',
    component: './UidPay',
  },
  // ====== 管理员界面 ======
  {
    path: '/admin',
    name: '管理员&志愿者页面',
    component: './Admin',
  },
  {
    path: '/qixunAdmin',
    name: '管理员&志愿者页面',
    component: './Admin',
  },
  {
    path: '/panofilter',
    name: '街景审核',
    component: './PanoFilter',
  },
  {
    path: '/reportSolve',
    name: '管理员举报审核',
    component: './ReportSolve',
  },
  {
    path: '/reportReview',
    name: '志愿者举报处理',
    component: './ReportReview',
  },
  // {
  //   path: '/banReview',
  //   name: '封禁确认',
  //   component: './BanReview',
  // },
  {
    path: '/logReview',
    name: '记录审核',
    component: './LogReview',
  },
  {
    path: '/achieveManage',
    name: '成就管理',
    component: './AchieveManage',
  },
  {
    path: '/review/userInfo',
    name: '用户信息审核',
    component: './Review/UserInfo',
  },
  {
    path: '/appealManage',
    name: '申诉管理',
    component: './AppealManage',
  },
  // ====== 互动 ======
  {
    path: '/interact',
    name: '互动',
    component: './Interact',
  },

  {
    path: '/interact/q/:id',
    name: '互动',
    component: './Interact',
  },

  {
    path: '/interact/challenge',
    name: '网络迷踪',
    component: './Interact/Challenge',
  },

  {
    path: '/mizong',
    name: '网络迷踪',
    component: './Interact/Challenge',
  },
  {
    path: '/mizong/q/:id',
    component: './Interact/Challenge',
  },

  {
    path: '/zhihu',
    component: './Zhihu',
  },

  {
    path: '/interact/create',
    name: '互动',
    component: './Interact/Create',
  },

  {
    path: '/ranking/point/:type',
    name: '积分排行',
    component: './Ranking/Point',
  },

  {
    path: '/ranking/daily/:type',
    name: '每日排行',
    component: './Ranking/Daily',
  },

  {
    path: '/promo',
    name: '夏季大促',
    component: './Promo',
  },

  // ====== 旧版路由兼容 ======
  // 积分赛
  {
    path: '/main_game',
    redirect: '/point',
  },
  // 每日挑战
  {
    path: '/daily_challenge',
    redirect: '/daily-challenge',
  },

  // ====== 测试 ======
  // 积分赛
  {
    path: '/tests/map',
    name: 'test',
    component: './tests/MapTest',
  },

  {
    path: '/tests/notify',
    name: 'test',
    component: './tests/Notify',
  },
  {
    path: '/tests/maplibregl',
    name: 'test',
    component: './tests/MaplibreglTest',
  },
  {
    path: '/tests/google-embed',
    name: 'test',
    component: './tests/GoogleEmbed',
  },
  {
    path: '/tests/googlepano',
    name: 'test',
    component: './tests/GooglePanoTest',
  },

  // ====== 赛事管理 ======
  {
    path: '/competition',
    name: '赛事',
    component: './Competition',
  },
  {
    path: '/competition/create',
    name: '赛事创建',
    component: './Competition/Create',
  },

  // ====== 成就 ======
  {
    path: '/achievement',
    name: '成就',
    component: './Achievements',
  },

  // ====== 年度报告 ======
  {
    path: '/2024',
    name: '2024年度报告',
    component: './Year2024',
  },
];
