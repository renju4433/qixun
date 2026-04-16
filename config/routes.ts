export default [
  {
    path: '/',
    key: 'home',
    component: './',
  },
  {
    path: '/match',
    key: 'match',
    name: '匹配',
    component: './AllMatch',
  },
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
    path: '/user/:id',
    name: '个人主页',
    component: './User/Profile',
  },
  {
    path: '/*',
    redirect: '/',
  },
];
