# qixun-api

最小可用后端（登录/注册/用户态/首页基础接口）。

## 本地运行

```bash
cd backend
npm install
cp .env.example .env
npm start
```

## 需要的数据库

MySQL，程序启动会自动建表：

- `users`
- `user_sessions`

## 已实现接口

- `GET /login`
- `GET /register`
- `GET /logout`
- `POST /v0/phone/getCodeV3`
- `GET /v0/qixun/user/getSelfProfile`
- `GET /v0/qixun/user/getSelf`
- `GET /v0/qixun/user/getProfile`
- `GET /v0/qixun/user/checkBind`
- `GET /v0/qixun/activity/list`
- `GET /v0/qixun/message/check`
- `GET /v0/qixun/vip/check`
- `GET /v0/qixun/vip/checkIsVip`
- `GET /v0/time/getTime`
- `GET /v0/qixun/UA/getTime`
