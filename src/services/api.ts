import { request } from '@umijs/max';
import { TypeParams } from 'ajv';

// ============ 统计接口 Start ============
export async function counterDay(
  params: API.CounterDayParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/counterDay', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function logServer(
  params: API.LogParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/log', {
    method: 'POST',
    requestType: 'form',
    headers: { 'Content-Type': 'multipart/form-data' },

    data: params,
    ...(options || {}),
  });
}

// ============ 统计接口 End ============

// ============ 用户相关接口 Start ============
/**
 * 用户登录
 *
 * @export
 * @param {API.LoginParams} params 登录参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.LoginResult>>} 登录结果
 */
export async function login(
  params: API.LoginParams,
  options?: Record<string, any>,
): Promise<API.Result<API.LoginResult>> {
  return request<API.Result<API.LoginResult>>('/login', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取用户信息
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UserProfile>>} 用户信息
 */
export async function getProfile(
  options?: Record<string, any>,
): Promise<API.Result<API.UserProfile>> {
  return request<API.Result<API.UserProfile>>('/v0/qixun/user/getSelfProfile', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getPointProfile(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PointProfile>> {
  return request<API.Result<API.PointProfile>>('/v0/qixun/getProfile', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getUserMaps(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/listByUserId', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getUserActivities(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.HistoryItem[]>> {
  return request<API.Result<API.HistoryItem[]>>(
    '/v0/qixun/history/listUserRating',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getTotalGuessesTime(
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/qixun/getTotalGuess', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function listActivities(
  options?: Record<string, any>,
): Promise<API.Result<API.Activities>> {
  return request<API.Result<API.Activities>>('/v0/qixun/activity/list', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function checkMessage(
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/qixun/message/check', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getTime(
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/time/getTime', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getSelfActivities(
  options?: Record<string, any>,
): Promise<API.Result<API.HistoryItem[]>> {
  return request<API.Result<API.HistoryItem[]>>('/v0/qixun/history/listSelf', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getSelfRatingActivities(
  options?: Record<string, any>,
): Promise<API.Result<API.HistoryItem[]>> {
  return request<API.Result<API.HistoryItem[]>>(
    '/v0/qixun/history/listSelfRating',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function getSelfPartyActivities(
  options?: Record<string, any>,
): Promise<API.Result<API.HistoryItem[]>> {
  return request<API.Result<API.HistoryItem[]>>(
    '/v0/qixun/history/listSelfParty',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function getSelfMapsActivities(
  options?: Record<string, any>,
): Promise<API.Result<API.HistoryItem[]>> {
  return request<API.Result<API.HistoryItem[]>>(
    '/v0/qixun/history/listSelfMaps',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function getSelfOtherActivities(
  options?: Record<string, any>,
): Promise<API.Result<API.HistoryItem[]>> {
  return request<API.Result<API.HistoryItem[]>>(
    '/v0/qixun/history/listSelfOther',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function getUserDailyActivity(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserActivity[]>> {
  return request<API.Result<API.UserActivity[]>>(
    '/v0/qixun/getUserDailyActivity',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function listUserAchievement(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserAchievement[]>> {
  return request<API.Result<API.UserAchievement[]>>(
    '/v0/qixun/user/listAchievements',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function listSelfAchievement(
  options?: Record<string, any>,
): Promise<API.Result<API.UserAchievement[]>> {
  return request<API.Result<API.UserAchievement[]>>(
    '/v0/qixun/user/listSelfAchievements',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function listAchievementsProgress(
  options?: Record<string, any>,
): Promise<API.Result<API.AchievementProgressItem[]>> {
  return request<API.Result<API.AchievementProgressItem[]>>(
    '/v0/qixun/user/listAchievementsProgress',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/**
 * 获取棋寻用户信息
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UserProfile>>} 用户信息
 */
export async function getqixunSelfProfile(
  options?: Record<string, any>,
): Promise<API.Result<API.UserProfile>> {
  return request<API.Result<API.UserProfile>>('/v0/qixun/user/getSelf', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function checkUserBind(
  options?: Record<string, any>,
): Promise<API.Result<API.UserBind>> {
  return request<API.Result<API.UserBind>>('/v0/qixun/user/checkBind', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 获取棋寻用户分析
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UAResult>>} 用户信息
 */
export async function getUserAnalysis(
  params: TypeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UAResult>> {
  return request<API.Result<API.UAResult>>('/v0/qixun/UA/getUserAnalysis', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取棋寻用户信息
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UserProfile>>} 用户信息
 */
export async function getqixunUserProfile(
  params?: API.KickOffParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserProfile>> {
  return request<API.Result<API.UserProfile>>('/v0/qixun/user/getProfile', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getUserId(
  options?: Record<string, any>,
): Promise<API.Result<number | null>> {
  return request<API.Result<number | null>>('/v0/xiaoce/user/getUserId', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getUATime(
  params?: API.GetUATimeParams,
  options?: Record<string, any>,
): Promise<API.Result<number | null>> {
  return request<API.Result<number | null>>('/v0/qixun/UA/getTime', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function checkFrind(
  params?: API.FriendParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/friend/check', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function xuntuImage(
  params?: API.ImgParams,
  options?: Record<string, any>,
): Promise<API.Result<string | null>> {
  return request<API.Result<string | null>>('/v0/xuntu/image', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function checkBan(
  params?: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/user/checkBan', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function banUser(
  params?: API.BanUserParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/user/ban', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 更新用户头像
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UserProfile>>} 用户信息
 */
export async function setUserIcon(
  params: API.SetUserIconParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/user/set_Icon', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 更新用户名
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UserProfile>>} 用户信息
 */
export async function setUserName(
  params: API.SetUserNameParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/user/changeUserName', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function hideAvatarFrameRequest(
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/commodity/hideAvatarFrame', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function getUserDrawRequest(
  params: API.CommodityIdParams,
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/qixun/commodity/getUserDraw', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 更新用户个性签名
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UserProfile>>} 用户信息
 */
export async function SetDesc(
  params: API.SetDescParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/user/set_desc', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 更新省份
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.UserProfile>>} 用户信息
 */
export async function SetProvince(
  params: API.SetProvinceParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/user/setProvince', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 手机登录
 *
 * @export
 * @param {API.LoginParams} params 手机登录参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.LoginResult>>}
 */
export async function phoneLogin(
  params: API.LoginParams,
  options?: Record<string, any>,
): Promise<API.Result<API.LoginResult>> {
  return request<API.Result<API.LoginResult>>('/v0/phone/login', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取验证码
 *
 * @export
 * @param {API.CaptchaParams} params 手机号
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<null>>} 验证码结果
 */
export async function getCaptchaCodeNew(
  params: API.CaptchaParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/phone/getCodeV3', {
    method: 'POST',
    requestType: 'form',
    // headers: { 'Content-Type': 'multipart/form-data' },
    data: params,
    ...(options || {}),
  });
}

export async function getLoginCaptchaCode(
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/phone/loginGetCode', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function resetPasswordByPhone(
  params: API.ResetPasswordByPhoneParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/user/resetPasswordByPhone', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function setPhone(
  params: API.SetPhoneParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/user/setPhone', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 注册
 *
 * @export
 * @param {API.RegisterParams} params 注册参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<null>>} 注册结果
 */
export async function register(
  params: API.RegisterParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/register', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取登录ticket（微信）
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<string>>} ticket
 */
export async function getTicket(
  params: API.PlatformParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/user/getLoginTicket', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 检查ticket登录
 *
 * @export
 * @param {API.CheckTicketLoginParams} params ticket
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<string>>} 登录结果
 */
export async function checkTicketLogin(
  params: API.CheckTicketLoginParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/login/loginByPublicAccount', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 授权码登录
 * @param params
 * @param options
 */
export async function checkWXCodeLogin(
  params: API.CheckWXCodeLoginParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/login/loginByWXPublicCode', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 退出登录
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return   {Promise<API.Result<null>>} 退出结果
 */
export async function logout(
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/logout', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 检查Vip状态
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<number | null>>} Vip到期时间
 */
export async function checkVipState(
  options?: Record<string, any>,
): Promise<API.Result<number | null>> {
  return request<API.Result<number | null>>('/v0/qixun/vip/check', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function checkUserVip(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean | null>> {
  return request<API.Result<boolean | null>>('/v0/qixun/vip/checkIsVip', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function addFriend(
  params: API.FriendParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean | null>> {
  return request<API.Result<boolean | null>>('/v0/qixun/friend/apply', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function inviteFriendParty(
  params: API.InviteFriendPartyParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean | null>> {
  return request<API.Result<boolean | null>>('/v0/qixun/message/invite', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function reportUser(
  params: API.ReportUserParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean | null>> {
  return request<API.Result<boolean | null>>('/v0/qixun/user/report', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function reportPano(
  params: API.ReportPanoParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean | null>> {
  return request<API.Result<boolean | null>>('/v0/qixun/game/report', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 检查Vip状态
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<number | null>>} Vip到期时间
 */
export async function tryVipRequest(
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/vip/try', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 获取VIP链接
 * @param params
 * @param options
 */
export async function getJSPayUrlRequest(
  params: API.GetJSPayUrlParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GetJSPayUrlResult>> {
  return request<API.Result<API.GetJSPayUrlResult>>(
    '/v0/qixun/vip/getJSPayUrl',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getGmesJSPayUrl(
  params: API.GetGemsJSPayUrlParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GetJSPayUrlResult>> {
  return request<API.Result<API.GetJSPayUrlResult>>(
    '/v0/qixun/gems/getJSPayUrl',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getVipPlans(
  options?: Record<string, any>,
): Promise<API.Result<API.GetVipPlanResult>> {
  return request<API.Result<API.GetVipPlanResult>>('/v0/qixun/vip/getPlans', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getGemsPlans(
  options?: Record<string, any>,
): Promise<API.Result<API.GetGemsPlanResult>> {
  return request<API.Result<API.GetGemsPlanResult>>('/v0/qixun/gems/list', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function checkGems(
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/qixun/gems/check', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 获取VIPOrderId
 * @param params
 * @param options
 */
export async function getJSPayUrlByUserIdRequest(
  params: API.GetJSPayUrlByUidParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GetJSPayUrlResult>> {
  return request<API.Result<API.GetJSPayUrlResult>>(
    '/v0/qixun/vip/getJSPayUrlByUid',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 获取VIP链接
 * @param params
 * @param options
 */
export async function jsPayConfirmRequest(
  params: API.JSPayConfirm,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/vip/confirm', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// ============ 用户相关接口 End ============

// ============ 寻景相关接口 Start============

/**
 * 请求寻景
 * @param params
 */
export async function getFinderlist(
  params: API.FinderListParams,
  options?: Record<string, any>,
): Promise<API.Result<API.Finder[]>> {
  return request<API.Result<API.Finder[]>>('/v0/finder/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 上传
 */
export async function finderUpload(
  options?: Record<string, any>,
): Promise<API.Result<any>> {
  return request<API.Result<any>>('/v0/finder/add', {
    method: 'POST',
    ...(options || {}),
  });
}

/**
 * 获取寻景相关信息
 */
export async function getEventInfo(
  params: API.NumberIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.Finder>> {
  return request<API.Result<API.Finder>>('/v0/finder/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取寻景相关信息
 */
export async function checkCanUploadWithoutLatLng(
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/event/checkCanUploadWithoutLatLng', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * ShowEvent
 */
export async function eventShow(
  params: API.NumberIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/finder/show', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取草稿信息
 */
export async function addEventRequest(
  options?: Record<string, any>,
): Promise<API.Result<API.Finder>> {
  return request<API.Result<API.Finder>>('/v0/finder/add', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 删除投稿信息
 */
export async function deleteEvent(
  params: API.NumberIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/finder/delete', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取草稿信息
 */
export async function eventPublish(
  params: API.EventPublishParams,
  options?: Record<string, any>,
): Promise<API.Result<API.Finder>> {
  return request<API.Result<API.Finder>>('/v0/finder/publish', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
// ============ 寻景相关接口 End============

// ============ Emoji相关接口 Start ============
export async function getEmojis(
  options?: Record<string, any>,
): Promise<API.Result<API.Emoji[]>> {
  return request<API.Result<API.Emoji[]>>('/v0/qixun/solo/listEmojis', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function sendEmoji(
  params: API.SendEmojiParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/solo/sendEmoji', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function sendPartyEmoji(
  params: API.SendPartyEmojiParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/party/sendEmoji', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
// ============ Emoji相关接口 Start ============

// ============ Pano相关接口 Start ============
/**
 * 获取全景图信息
 *
 * @export
 * @param {API.GetPanoInfoParams} params 全景图ID
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PanoInfo>>} 全景图信息
 */
export async function getPanoInfo(
  params: API.GetPanoInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PanoInfo>> {
  return request<API.Result<API.PanoInfo>>('/v0/qixun/mapProxy/getPanoInfo', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getQQPanoInfo(
  params: API.GetPanoInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PanoInfo>> {
  return request<API.Result<API.PanoInfo>>('/v0/qixun/mapProxy/getQQPanoInfo', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取棋寻全景图信息
 *
 * @export
 * @param {API.GetPanoInfoParams} params 全景图ID
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PanoInfo>>} 全景图信息
 */
export async function getqixunPanoInfo(
  params: API.GetPanoInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PanoInfo>> {
  return request<API.Result<API.PanoInfo>>(
    '/v0/qixun/mapProxy/getqixunPanoInfo',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 获取封禁的街景（后端返回加密字符串）
 */
export async function getBannedLocations(
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/qixun/mapProxy/getLocation', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 汇报全景图错误
 *
 * @export
 * @param {API.ReportErrorPanoParams} params 错误信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<null>>}
 */
export async function reportErrorPano(
  params: API.ReportErrorPanoParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/client/report', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// ============ Pano相关接口 End ============

// ============ 比赛相关接口 Start ============
/**
 * 获取每日挑战ID
 *
 * @export
 * @param {API.GetDailyChallengeIdParams} params 挑战类型
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<string>>} 挑战ID
 */
export async function getDailyChallengeId(
  params: API.GetDailyChallengeIdParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>(
    '/v0/qixun/challenge/getDailyChallengeId',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getDailyChallengeInfo(
  params: API.GetDailyChallengeIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.DailyChallengeInfo>> {
  return request<API.Result<API.DailyChallengeInfo>>(
    '/v0/qixun/challenge/getDailyChallengeInfo',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 创建连胜挑战
 *
 * @export
 * @param {API.GetStreakIdParams} params 连胜类型
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<string>>} 连胜gameID
 */
export async function CreateStreak(
  params: API.GetStreakIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameInfo>> {
  return request<API.Result<API.GameInfo>>(
    'v0/qixun/streak/createCountryStreak',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 获取连胜排名
 *
 * @export
 * @param {API.GetStreakRankParam} params
 * @param {Record<string, any>} [options]
 * @return {Promise<API.Result<API.StreakRankInfo[]>>}
 */
export async function getStreakRank(
  params: API.GetStreakRankParam,
  options?: Record<string, any>,
): Promise<API.Result<API.StreakRankInfo[]>> {
  return request<API.Result<API.StreakRankInfo[]>>(
    `v0/qixun/streak/listRankV1`,
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 检查是否绑定了
 * @param options
 */
export async function checkBind(
  options?: Record<string, any>,
): Promise<API.Result<API.DailyChallengeBind>> {
  return request<API.Result<API.DailyChallengeBind>>(
    '/v0/qixun/dailyChallenge/checkBind',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/**
 * 保存绑定
 * @param options
 */
export async function saveBind(
  params: API.SaveBindParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/dailyChallenge/save', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/**
 * 保存绑定
 * @param options
 */
export async function bindDailyChallengeNew(
  params: API.BindParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/dailyChallenge/bindNew', {
    method: 'POST',
    data: params,
    requestType: 'form',
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(options || {}),
  });
}

/**
 * 检查是否绑定了
 * @param options
 */
export async function getBind(
  params: API.GetBindParams,
  options?: Record<string, any>,
): Promise<API.Result<string[]>> {
  return request<API.Result<string[]>>('/v0/qixun/dailyChallenge/getBind', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取每日挑战总数
 *
 * @export
 * @param {API.GetDailyChallengeTotalParams} params 挑战ID
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<number>>} 挑战总数
 */
export async function getDailyChallengeTotal(
  params: API.GetDailyChallengeTotalParams,
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/qixun/challenge/rankTotal', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取每日挑战排名
 *
 * @export
 * @param {API.GetDailyChallengeRankParams} params 排名类型
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<number>>} 排名
 */
export async function getDailyChallengeRank(
  params: API.GetDailyChallengeRankParams,
  options?: Record<string, any>,
): Promise<API.Result<API.DailyChallengeRanks>> {
  return request<API.Result<API.DailyChallengeRanks>>(
    `/v0/qixun/challenge/${params.rankType}`,
    {
      method: 'GET',
      params: {
        challengeId: params.challengeId,
      },
      ...(options || {}),
    },
  );
}

/**
 * 获取每日挑战复盘链接
 */
export async function listDailyChallengeLink(
  params: API.ListDailyChallengeLinkParams,
  options?: Record<string, any>,
): Promise<API.Result<API.DailyChallengeLinkData>> {
  return request<API.Result<API.DailyChallengeLinkData>>(
    '/v0/qixun/user/listDailyChallengeLink',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 获取抽奖信息
 */
export async function checkDrawDailyChalelnge(
  options?: Record<string, any>,
): Promise<API.Result<API.DrawDailyChallenge>> {
  return request<API.Result<API.DrawDailyChallenge>>(
    '/v0/qixun/draw/checkDailyChallenge',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function getDailyChallengeSolution(
  params: API.GetDailyChallengeIdParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>(
    '/v0/qixun/challenge/getDailyChallengeSolution',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 每日挑战抽奖
 */
export async function drawDailyChalelnge(
  options?: Record<string, any>,
): Promise<API.Result<API.DrawDailyChallenge>> {
  return request<API.Result<API.DrawDailyChallenge>>(
    '/v0/qixun/draw/dailyChallenge',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/**
 * 每日挑战抽奖
 */
export async function matchAwardRequest(
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/task/matchAward', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function springAwardRequest(
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/task/springAward', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 中国匹配
 */
export async function startChinaMatching(
  params: API.StartMatchingParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/qixun/solo/joinChinaNMMatch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 固定匹配
 */
export async function startWorldNoMoveMatching(
  params: API.StartMatchingParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/qixun/solo/joinRandom', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function checkMatchOpenRequest(
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/checkSomeMatchOpen', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 移动匹配
 */
export async function startWorldMoveMatching(
  params: API.StartMatchingParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/qixun/solo/joinMoveRandom', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 固定视角匹配
 */
export async function startWorldNpmzMatching(
  params: API.StartMatchingParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/qixun/solo/joinNpmzRandom', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取比赛信息
 *
 * @export
 * @param {API.GetGameInfoParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.GameInfo>>} 比赛信息
 */
export async function getGameInfo(
  params: API.GetGameInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameInfo>> {
  return request<API.Result<API.GameInfo>>('/v0/qixun/challenge/getGameInfo', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getChallengeHubMeta(
  params: { challengeId: string },
  options?: Record<string, any>,
): Promise<API.Result<API.qixunChallengeAO>> {
  return request<API.Result<API.qixunChallengeAO>>('/v0/qixun/challenge/hubMeta', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取比赛信息
 *
 * @export
 * @param {API.GetGameInfoParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.GameInfo>>} 比赛信息
 */
export async function createChallenge(
  params: API.CreateChallengeParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/qixun/challenge/create', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function gameAgain(
  params: API.GameIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.AgainResult>> {
  return request<API.Result<API.AgainResult>>('/v0/qixun/again', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 创建无限轮次
 */
export async function createInfinity(
  params: API.CreateChallengeParams,
  options?: Record<string, any>,
): Promise<API.Result<string>> {
  return request<API.Result<string>>('/v0/qixun/infinity/createGame', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 创建题库连胜
 */
export async function createMapCountryStreak(
  params: API.CreateChallengeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem>> {
  return request<API.Result<API.MapItem>>(
    '/v0/qixun/streak/createMapCountryStreak',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 开始比赛
 *
 * @export
 * @param {API.StartGameParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.GameInfo>>} 比赛信息
 */
export async function startGame(
  params: API.StartGameParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameInfo>> {
  return request<API.Result<API.GameInfo>>('/v0/qixun/challenge/start', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取我的每日挑战排名
 *
 * @export
 * @param {API.GetMyDailyChallengeRankParams} params 挑战ID
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.DailyChallengeRanks>>} 排名
 */
export async function getMyDailyChallengeRank(
  params: API.GetMyDailyChallengeRankParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MyDailyChallengeRank>> {
  return request<API.Result<API.MyDailyChallengeRank>>(
    '/v0/qixun/challenge/getDailyChallengeRank',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 请求积分排名
 * @param params
 */
export async function getPointRank(
  params: API.PointRankParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PointRank[]>> {
  return request<API.Result<API.PointRank[]>>('/v0/qixun/getRank', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function createMap(
  params: API.MapCreateParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem>> {
  return request<API.Result<API.MapItem>>('/v0/qixun/maps/add', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getMapFriendRank(
  params: API.MapRankParams,
  options?: Record<string, any>,
): Promise<API.Result<API.DailyChallengeRank[]>> {
  return request<API.Result<API.DailyChallengeRank[]>>(
    '/v0/qixun/maps/rankFriend',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getMapRank(
  params: API.MapRankParams,
  options?: Record<string, any>,
): Promise<API.Result<API.DailyChallengeRank[]>> {
  return request<API.Result<API.DailyChallengeRank[]>>('/v0/qixun/maps/rank', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 请求省份排名
 * @param params
 */
export async function getProvinceRank(
  params: API.TypeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.ProvinceRank[]>> {
  return request<API.Result<API.ProvinceRank[]>>('/v0/qixun/getProvinceRank', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 请求好友
 */
export async function listFriend(
  options?: Record<string, any>,
): Promise<API.Result<API.FriendProfile[]>> {
  return request<API.Result<API.FriendProfile[]>>('/v0/qixun/friend/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 搜索好友
 */
export async function searchUser(
  params: API.SearchUserParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserProfile[]>> {
  return request<API.Result<API.UserProfile[]>>('/v0/searchUserV1', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 删除好友
 */
export async function deleteFriend(
  params: API.DeleteFriendParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/friend/delete', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 设置好友昵称
 */
export async function setFriendNickname(
  params: API.SetFriendNicknameParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/friend/setNickname', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 屏蔽用户
 * @param params
 * @param options
 */
export async function blockUser(
  params: API.BlockUserParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/user/block', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取消息
 */
export async function listMessage(
  params?: { type?: string },
  options?: Record<string, any>,
): Promise<API.Result<API.Message[]>> {
  return request<API.Result<API.Message[]>>('/v0/qixun/message/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 同意添加好友
 */
export async function approveFriendAdd(
  params: API.MessageSolveParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/message/approveFriend', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 拒绝添加好友
 */
export async function rejectFriendAdd(
  params: API.MessageSolveParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/message/rejectFriend', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取消息
 */
export async function messageReadAll(
  options?: Record<string, any>,
): Promise<API.Result<API.Message[]>> {
  return request<API.Result<API.Message[]>>('/v0/qixun/message/readAll', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 获取商品
 */
export async function getCommodities(
  options?: Record<string, any>,
): Promise<API.Result<API.Commodity[]>> {
  return request<API.Result<API.Commodity[]>>(
    '/v0/qixun/commodity/getCommodities',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/**
 * 用户背包
 */
export async function getOwnedItems(
  params: API.GetUserBagParams,
  options?: Record<string, any>,
): Promise<API.Result<API.Commodity[]>> {
  return request<API.Result<API.Commodity[]>>(
    '/v0/qixun/commodity/listUserOwns',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 佩戴头像框
 */
export async function wearAvatarFrame(
  params: API.WearAvatarFrameParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/commodity/avatar-frame', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/**
 * 下单
 */
export async function orderCommodity(
  params: API.OrderCommodityParams,
  options?: Record<string, any>,
): Promise<API.Result<API.CommodityOrder>> {
  return request<API.Result<API.CommodityOrder>>('/v0/qixun/commodity/buy', {
    method: 'GET',
    params: params,
    ...(options || {}),
  });
}

/**
 * 发送好友消息
 */
export async function sendFriendMessage(
  params: API.SendFriendMessageParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/friend/sendMessage', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

export async function adminSendMessage(
  params: API.AdminSendMessageParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/message/adminSendText', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/**
 * 申诉
 */
export async function appealBan(
  params: API.AppealParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/user/appeal', {
    method: 'POST',
    requestType: 'form',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: params,
    ...(options || {}),
  });
}

/**
 * 获取每日挑战排名
 *
 * @export
 * @param {API.JoinGameParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.GameInfo>>} 比赛信息
 */
export async function joinGame(
  params: API.JoinGameParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameInfo>> {
  return request<API.Result<API.GameInfo>>('/v0/qixun/game/join', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取比赛信息
 *
 * @export
 * @param {API.JoinGameParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.GameInfo>>} 比赛信息
 */
export async function getSoloGameInfo(
  params: API.JoinGameParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameInfo>> {
  return request<API.Result<API.GameInfo>>('/v0/qixun/solo/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 提交游戏位置
 *
 * @export
 * @param {API.SubmitPinParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<null>>} 提交结果
 */
export async function submitPin(
  params: API.SubmitPinParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  const { type, ...restParmas } = params;
  return request<API.Result<null>>(`/v0/qixun/${type}/pin`, {
    method: 'GET',
    params: restParmas,
    ...(options || {}),
  });
}

/**
 * 确认位置
 *
 * @export
 * @param {API.SubmitPinParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.GameInfo>>} 提交结果
 */
export async function confirmGuess(
  params: API.SubmitPinParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameInfo>> {
  const { type, ...restParmas } = params;
  return request<API.Result<API.GameInfo>>(`/v0/qixun/${type}/guess`, {
    method: 'GET',
    params: restParmas,
    ...(options || {}),
  });
}

/**
 * 下一轮
 *
 * @export
 * @param {API.NextRoundParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.GameInfo>>} 提交结果
 */
export async function nextRound(
  params: API.NextRoundParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameInfo>> {
  const { type, ...restParmas } = params;
  return request<API.Result<API.GameInfo>>(`/v0/qixun/${type}/next`, {
    method: 'GET',
    params: restParmas,
    ...(options || {}),
  });
}

/**
 * 获取派对信息
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function getPartyData(
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/get', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 创建派对
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function joinByParty(
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/joinByParty', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 通过邀请码加入派对
 *
 * @export
 * @param {API.JoinByCodeParams} params 邀请码
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function joinByCode(
  params: API.JoinByCodeParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/party/join', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 离开派对
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<null>>} 离开结果
 */
export async function leaveParty(
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/party/leave', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 开始对决
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 开始结果
 */
export async function startParty(
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/start', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 解散派对
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<null>>} 解散结果
 */
export async function endParty(
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/party/disband', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 切换自由视角
 *
 * @export
 * @param {API.ChangePanParams} params 比赛信息
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changePan(
  params: API.ChangePanParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeFree', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 切换队伍
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function switchTeam(
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/swapTeam', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 房主强制用户交换队伍
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function hostSwitchTeam(
  params: API.HostSwapTeamParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/hostSwapTeam', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 切换到玩家
 *
 * @export
 * @param {API.SwitchToPlayerParams} params 切换为玩家参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function switchToPlayer(
  params: API.SwitchToPlayerParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/change2Player', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 切换到旁观者
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function switchToOnlooker(
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/change2Onlooker', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 切换派对类型
 *
 * @export
 * @param {API.ChangePartyTypeParams} params 切换排队类型参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changePartyType(
  params: API.ChangePartyTypeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeType', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 切换回合时间
 *
 * @export
 * @param {API.ChangeCountDownParams} params 切换回合时间参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changeCountDown(
  params: API.ChangeCountDownParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeCountDown', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 设置眨眼时间
 *
 * @export
 * @param {API.ChangeBlinkTimeParams} params 设置是否开启回放参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changeBlinkTime(
  params: API.ChangeBlinkTimeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeBlinkTime', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 设置生命值
 *
 * @export
 * @param {API.ChangeHealthParams} params 设置生命值参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changeHealth(
  params: API.ChangeHealthParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeHealth', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 设置倍率
 */
export async function changeMultiplier(
  params: API.ChangeMultiplierParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>(
    '/v0/qixun/party/changeMultiplier',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function changeRoundNumber(
  params: API.ChangeRoundNumberParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>(
    '/v0/qixun/party/changeRoundNumber',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 设置是否自由视角
 *
 * @export
 * @param {API.ChangeFreeParams} params 设置是否自由视角参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changeFree(
  params: API.ChangeFreeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeFree', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 设置是否开启无车模式
 *
 * @export
 * @param {API.ChangeRecordParams} params 设置是否开启无车参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changeNoCar(
  params: API.ChangeNoCarParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeNoCar', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 设置是否开启回放
 *
 * @export
 * @param {API.ChangeRecordParams} params 设置是否开启回放参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changeRecord(
  params: API.changeRecordParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeRecord', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 切换派对地图
 *
 * @export
 * @param {API.ChangePartyMapsParams} params 切换地图参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changePartyMaps(
  params: API.ChangePartyMapsParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeMaps', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 踢出玩家
 *
 * @export
 * @param {API.KickOffParams} params 踢出玩家参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function kickOffPlayer(
  params: API.KickOffParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/hostChangeLeave', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 转移房主
 *
 * @export
 * @param {API.ChangeHostParams} params 转移房主参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function changeHost(
  params: API.ChangeHostParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>('/v0/qixun/party/changeHost', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 转移旁观者
 *
 * @export
 * @param {API.ChangeHostParams} params 转移旁观者参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PartyInfo>>} 派对信息
 */
export async function hostChangeOnlooker(
  params: API.ChangeHostParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PartyInfo>> {
  return request<API.Result<API.PartyInfo>>(
    '/v0/qixun/party/hostChangeOnlooker',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 搜索地图
 *
 * @export
 * @param {API.SearchMapsParams} params 地图搜索参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.MapItem[]>>} 派对信息
 */
export async function searchMaps(
  params: API.SearchMapsParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/search', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取用户自己的地图列表
 *
 * @export
 * @return {Promise<API.Result<API.MapItem[]>>} 地图列表
 */
export async function listOwnMaps(): Promise<API.Result<API.MapItem[]>> {
  return request('/v0/qixun/maps/listOwn', {
    method: 'GET',
  });
}

/**
 * 用户添加全景图
 * @param {API.uploadPanoramaParams} params
 * @param {Record<string, any>} options
 * @returns {Promise<API.Result<any>>}
 */
export async function userAddPanorama(
  params: API.uploadPanoramaParams,
  options?: Record<string, any>,
): Promise<API.Result<any>> {
  return request('/v0/qixun/maps/userAddPanorama', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

export async function addMapCollection(
  params: API.MapIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/map/collection/add', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function removeMapCollection(
  params: API.MapIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/map/collection/remove', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function checkMapCollection(
  params: API.MapIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/map/collection/check', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listMapCollection(
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>(
    '/v0/qixun/map/collection/listSelf',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/**
 * 获取地图信息
 *
 * @export
 * @param {API.GetMapInfoParams} params 地图ID
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.MapItem>>} 地图信息
 */
export async function getMapInfo(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem>> {
  return request<API.Result<API.MapItem>>('/v0/qixun/maps/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function modifyMapInfo(
  params: API.ModifyMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem>> {
  return request<API.Result<API.MapItem>>('/v0/qixun/maps/modify', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getRecentMaps(
  params: API.CountParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/listRecent', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getOwnMapsRequest(
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/listOwn', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function publishMapRequest(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/publish', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function unpublishMapRequest(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/unpublish', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getMapStausRequest(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapStatus>> {
  return request<API.Result<API.MapStatus>>('/v0/qixun/maps/status', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getMapReportCountRequest(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/qixun/maps-event/count', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getMapReportRequest(
  params: API.MapContainParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapReport[]>> {
  return request<API.Result<API.MapReport[]>>('/v0/qixun/maps-event/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function deleteMapReportRequest(
  params: API.MapContainParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps-event/deleteReport', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function refreshMapStatusRequest(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/refreshStatus', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function clearMapRequest(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/cleanPano', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function addMapPanosRequest(
  params: API.AddMapPanosParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/userAddPanorama', {
    method: 'POST',
    requestType: 'form',
    data: params,
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(options || {}),
  });
}

export async function deleteMapPanoRequest(
  params: API.MapContainParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/deletePano', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listMapPanosRequest(
  params: API.ListMapPanosParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapContainPage>> {
  return request<API.Result<API.MapContainPage>>('/v0/qixun/maps/listPanoV1', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listSimplePanoRequest(
  params: { mapsId: number },
  options?: Record<string, any>,
): Promise<API.Result<API.MapContain[]>> {
  return request<API.Result<API.MapContain[]>>('/v0/qixun/maps/listSimplePano', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listReportMapPanosRequest(
  params: API.ListMapPanosParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapContainPage>> {
  return request<API.Result<API.MapContainPage>>(
    '/v0/qixun/maps/listReportPanoV1',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function listMapPanosByTag(
  params: API.ListMapPanosByTagParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapContain[]>> {
  return request<API.Result<API.MapContain[]>>('/v0/qixun/maps/filterByTags', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function deleteMapPanosByTag(
  params: API.ListMapPanosByTagParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/deleteByFilter', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function addTagByFilter(
  params: API.ListMapPanosByTagParams & { tag: string },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/addTagByFilter', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function cleanTagByFilter(
  params: API.ListMapPanosByTagParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/cleanTagByFilter', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function addTag(
  params: API.MapContainParams & { tag: string },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/addTag', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function removeTag(
  params: API.MapContainParams & { tag: string },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/removeTag', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listMapTags(
  params: API.MapsIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapTag[]>> {
  return request<API.Result<API.MapTag[]>>('/v0/qixun/maps/listTags', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listTagsByPano(
  params: API.MapContainParams,
  options?: Record<string, any>,
): Promise<API.Result<string[]>> {
  return request<API.Result<string[]>>('/v0/qixun/maps/getTag', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function deleteMapRequest(
  params: API.GetMapInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/maps/delete', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listReport(
  params: API.ListReportsParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserReportItems>> {
  return request<API.Result<API.UserReportItems>>('/v0/qixun/report/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listReportHelper(
  params: API.ListReportsParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserReportItems>> {
  return request<API.Result<API.UserReportItems>>(
    '/v0/qixun/report/listForHelper',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function listReportUserAll(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserReportItems>> {
  return request<API.Result<API.UserReportItems>>(
    '/v0/qixun/report/listUserAll',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function listCheatLogs(
  options?: Record<string, any>,
): Promise<API.Result<API.CheatLogItem[]>> {
  return request<API.Result<API.CheatLogItem[]>>(
    '/v0/qixun/report/listCheatLogs',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function rejectLog(
  params: API.NumberIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/report/rejectLog', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function rejectLogBatch(
  body: { ids?: number[]; userId?: number; ignoreUser?: boolean },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/report/rejectLogBatch', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

export async function banByLog(
  params: API.BanByLogParams & { reason: string },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/report/banByLog', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

export async function addCheatLog(
  params: API.AddCheatLogParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/report/addLog', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

export async function listBanReview(
  options?: Record<string, any>,
): Promise<API.Result<API.BanReviewItem[]>> {
  return request<API.Result<API.BanReviewItem[]>>(
    '/v0/qixun/report/listBanReview',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function approveBanReview(
  params: API.ApproveBanReviewParams,
  options?: Record<string, any>,
): Promise<API.Result> {
  return request<API.Result>('/v0/qixun/report/approveBanReview', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function rejectBanReview(
  params: API.NumberIdParams,
  options?: Record<string, any>,
): Promise<API.Result> {
  return request<API.Result>('/v0/qixun/report/rejectBanReview', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function ignoreReport(
  params: API.IgnoreReportParam,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/report/setIgnored', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function batchIgnoreReport(
  params: API.BatchIgnoreReportParam,
  options?: Record<string, any>,
): Promise<API.Result<{ ignored: number; skipped: number }>> {
  return request<API.Result<{ ignored: number; skipped: number }>>('/v0/qixun/report/batchIgnore', {
    method: 'POST',
    data: params,
    headers: { 'Content-Type': 'application/json' },
    ...(options || {}),
  });
}

export async function setLogged(
  params: API.SetLoggedParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/report/setLogged', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

export async function submitBan(
  params: API.SubmitBanParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/report/submitBan', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listBanHistory(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.BanHistoryItem[]>> {
  return request<API.Result<API.BanHistoryItem[]>>(
    '/v0/qixun/user/listBanHistory',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function listAppeals(
  options?: Record<string, any>,
): Promise<API.Result<API.AppealManageItem[]>> {
  return request<API.Result<API.AppealManageItem[]>>(
    '/v0/qixun/user/listAppeal',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function unbanUser(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/user/unban', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function replyAppeal(
  params: API.AdminSendMessageParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/user/appealReply', {
    method: 'POST',
    requestType: 'form',
    data: params,
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(options || {}),
  });
}

export async function listAlt(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.UserAltItem[]>> {
  return request<API.Result<API.UserAltItem[]>>(
    '/v0/qixun/user/getAllUserCombineNew',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function checkDetect(
  params: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/user/checkDetect', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getStreakMaps(
  params: API.CountParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/listStreak', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取热门地图
 *
 * @export
 * @param {API.MapFilterParams} params 地图筛选参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.MapItem[]>>} 热门地图
 */
export async function getHotMaps(
  params: API.MapFilterParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取新地图
 *
 * @export
 * @param {API.MapFilterParams} params 地图筛选参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.MapItem[]>>} 新地图
 */
export async function getNewMaps(
  params: API.CountParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/listNew', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取推荐地图
 *
 * @export
 * @param {API.MapFilterParams} params 地图筛选参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.MapItem[]>>} 推荐地图
 */
export async function getRecommendMaps(
  params: API.CountParams,
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/listEditorChoose', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 获取最近玩过地图
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.MapItem[]>>} 最近玩过地图
 */
export async function getRecentData(
  options?: Record<string, any>,
): Promise<API.Result<API.MapItem[]>> {
  return request<API.Result<API.MapItem[]>>('/v0/qixun/maps/listRecent', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 获取App最新版本
 *
 * @export
 */
export async function getAppLastVersion(
  options?: Record<string, any>,
): Promise<API.Result<API.AppVersionAO>> {
  return request<API.Result<API.AppVersionAO>>(
    '/v0/qixun/app/getLatestAppVersion',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

// ============ 比赛相关接口 Start ============

export async function joinTeam(
  params: API.TeamIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/join', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function joinTeamByCode(
  params: API.JoinByCodeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/joinByCode', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getTeamData(
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/get', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function matchStartMatch(
  params: API.TeamIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/startMatch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function matchCancelMatch(
  params: API.TeamIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/cancelMatch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function disbandTeam(
  params: API.TeamIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/disband', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function leaveTeam(
  params: API.TeamIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/leave', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function inviteFriendTeam(
  params: API.InviteFriendTeamParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean | null>> {
  return request<API.Result<boolean | null>>('/v0/qixun/message/inviteTeam', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function setTeamType(
  params: API.SetTeamTypeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>('/v0/qixun/matchTeam/setType', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function changeTeamCaptain(
  params: API.ChangeTeamCaptainParams,
  options?: Record<string, any>,
): Promise<API.Result<API.TeamInfo>> {
  return request<API.Result<API.TeamInfo>>(
    '/v0/qixun/matchTeam/changeCaptain',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

// ============ 比赛相关接口 End ============

// ============ 互动相关接口 Start ============

// 列出帖子
export async function listPosts(
  params: API.ListPostParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostListResult>> {
  return request<API.Result<API.PostListResult>>('/v0/qixun/post/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listPostChallenges(
  params: API.ListPostParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostListResult>> {
  return request<API.Result<API.PostListResult>>(
    '/v0/qixun/post/challenge/list',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

// 获取单个互动帖子
export async function getPost(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostParams>> {
  return request<API.Result<API.PostParams>>('/v0/qixun/post/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// 获取单个网络迷踪帖子
export async function getChallengePost(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostParams>> {
  return request<API.Result<API.PostParams>>('/v0/qixun/post/challenge/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listMyPostChallenges(
  params: API.ListPostParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostListResult>> {
  return request<API.Result<API.PostListResult>>(
    '/v0/qixun/post/challenge/listMyPost',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function listMyPost(
  params: API.ListPostParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostListResult>> {
  return request<API.Result<API.PostListResult>>('/v0/qixun/post/listMyPost', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

//帖子开始次数+1
export async function questionStartCheck(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/post/startCheck', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

//发布帖子
export async function postQuestion(
  params: API.QuestionPostParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/post/postQuestion', {
    method: 'POST',
    requestType: 'form',
    data: params,
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(options || {}),
  });
}

export async function postChallenge(
  params: API.QuestionPostParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/post/postChallenge', {
    method: 'POST',
    requestType: 'form',
    data: params,
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(options || {}),
  });
}

export async function challengeRank(
  params: API.ChallengeRankParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostChallengeRank[]>> {
  return request<API.Result<API.PostChallengeRank[]>>(
    '/v0/qixun/post/challenge/rank',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

//删除帖子
export async function deleteQuestion(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/post/delete', {
    method: 'DELETE',
    params,
    ...(options || {}),
  });
}

//帖子提交答案
export async function submitDistance(
  params: API.SubmitDistanceParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/post/submit', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

export async function postChallengeSubmit(
  params: API.SubmitLatLngParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostChallengeSubmitResponse>> {
  return request<API.Result<API.PostChallengeSubmitResponse>>(
    '/v0/qixun/post/challenge/submit',
    {
      method: 'POST',
      data: params,
      ...(options || {}),
    },
  );
}

// 收藏帖子
export async function addPostCollection(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/post/collection/add', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// 取消收藏
export async function removePostCollection(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/post/collection/remove', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// 检查是否已收藏
export async function checkPostCollection(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/post/collection/check', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// 我的收藏列表
export async function listPostCollections(
  options?: Record<string, any>,
): Promise<API.Result<API.PostParams[]>> {
  return request<API.Result<API.PostParams[]>>(
    '/v0/qixun/post/collection/listSelf',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

//帖子是否提交过答案
export async function checkSubmit(
  params: API.checkSubmitParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/post/checkSubmit', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

//帖子评论列表
export async function listComment(
  params: API.PostIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.listCommentParams>> {
  return request<API.Result<API.listCommentParams>>(
    '/v0/qixun/post/comment/list',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

//发布评论
export async function postComment(
  params: API.postCommentParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/post/comment/post', {
    method: 'POST',
    data: params,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

//删除评论
export async function deleteComment(
  params: API.CommentIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/post/comment/delete', {
    method: 'DELETE',
    params,
    ...(options || {}),
  });
}

/**
 * 经纬度转换
 * @param params
 * @param options
 */
export async function lngLatCvt(
  params: API.LngLatCvtParams,
  options?: Record<string, any>,
): Promise<API.Result<API.LngLatCvtResult>> {
  return request<API.Result<API.LngLatCvtResult>>('/v0/qixun/lngLatCvt', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

//答题排行
export async function postRanking(
  params: API.PostRankingParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PostRankingResult>> {
  return request<API.Result<API.PostRankingResult>>('/v0/qixun/post/ranking', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
// ============ 互动相关接口 End ============

// ============ 街景审核 ============
export async function generateQueue(
  params?: { index?: number; mapsId?: number },
  options?: Record<string, any>,
): Promise<API.Result<API.GenerateQueueResult>> {
  return request<API.Result<API.GenerateQueueResult>>(
    '/v0/qixun/game/generateQueue',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function checkPano(
  params: { id: number },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/game/check', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function deletePano(
  params: { id: number },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/game/delete', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPanoContent(
  params: { id: number },
  options?: Record<string, any>,
): Promise<API.Result<API.PanoContentResult>> {
  return request<API.Result<API.PanoContentResult>>(
    '/v0/qixun/game/getContent',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

// ============ 抽奖！ ============
export async function drawLottery(
  params: API.drawLotteryParams,
  options?: Record<string, any>,
): Promise<API.Result<API.drawLotteryResult>> {
  return request<API.Result<API.drawLotteryResult>>(
    '/v0/qixun/commodity/draw',
    {
      method: 'POST',
      params,
      ...(options || {}),
    },
  );
}

export async function getUserDrawCount(
  params: API.getUserDrawCountParams,
  options?: Record<string, any>,
): Promise<API.Result<number>> {
  return request<API.Result<number>>('/v0/qixun/commodity/getUserDrawCount', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function adminAddVip(
  params: API.AdminAddVipParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/vip/adminAddVip', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function adminAddGems(
  params: API.AdminAddGemsParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/gems/adminAdd', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function listReports(
  params: API.ListReportsParams,
  options?: Record<string, any>,
): Promise<API.Result<API.ReportItem[]>> {
  return request<API.Result<API.ReportItem[]>>('/v0/report/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function solveReport(
  params: API.ReportSolvingParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/report/solve', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function solveReportMessage(
  params: API.ReportSolvingParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/report/solveMsg', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function clearUserInfo(
  params: API.ClearUserInfoParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/clearUserInfo', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// 成就相关接口

export async function listAchievements(
  options?: Record<string, any>,
): Promise<API.Result<API.AchievementItem[]>> {
  return request<API.Result<API.AchievementItem[]>>(
    '/v0/qixun/achievement/list',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function listAchievementsManage(
  options?: Record<string, any>,
): Promise<API.Result<API.AchievementManageItem[]>> {
  return request<API.Result<API.AchievementManageItem[]>>(
    '/v0/qixun/achievement/listManage',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function editAchievement(
  params: API.EditAchievementParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/achievement/edit', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function createAchievement(
  params: API.CreateAchievementParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/achievement/create', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// 年度报告

export async function getAnnual(
  params?: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<API.AnnualReportItem>> {
  return request<API.Result<API.AnnualReportItem>>('/v0/qixun/annual/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function checkAnnual(
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/qixun/annual/check', {
    method: 'GET',
    ...(options || {}),
  });
}

// 回放数据读写

export async function getRecords(
  params?: API.ReplayParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameReplay>> {
  return request<API.Result<API.GameReplay>>(`/v0/qixun/replay/getRecords`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function addRecords(
  replayData: API.GameReplay,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  try {
    const response = await request<API.Result<null>>(
      '/v0/qixun/replay/addRecords',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: replayData,
        ...(options || {}),
      },
    );
    return response;
  } catch (error) {
    console.error('Error uploading replay data:', error); // 打印错误
    throw error;
  }
}

export async function checkHasRecord(
  params?: API.ReplayParams,
  options?: Record<string, any>,
): Promise<API.Result<API.GameReplay>> {
  return request<API.Result<API.GameReplay>>(
    `/v0/qixun/replay/checkHasRecord`,
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function checkAdmin(
  params?: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/user/checkAdmin', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function checkAdminMonitor(
  params?: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<boolean>> {
  return request<API.Result<boolean>>('/v0/user/checkAdminMonitor', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function checkqixunRole(
  params?: API.UserIdParams,
  options?: Record<string, any>,
): Promise<API.Result<{ isAdmin: boolean; isVolunteer: boolean }>> {
  return request<API.Result<{ isAdmin: boolean; isVolunteer: boolean }>>('/v0/qixun/user/checkqixunRole', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function submitFeedback(
  params: API.FeedbackParams,
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/feedback', {
    method: 'POST',
    data: { ...params, product: 'qixun' },
    ...(options || {}),
  });
}

/**
 * 获取提示信息
 *
 * @export
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.TipInfo>>} 提示信息
 */
export async function getTips(
  options?: Record<string, any>,
): Promise<API.Result<API.TipInfo>> {
  return request<API.Result<API.TipInfo>>('/v0/qixun/tips/get', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function listTips(
  options?: Record<string, any>,
): Promise<API.Result<API.TipInfo[]>> {
  return request<API.Result<API.TipInfo[]>>('/v0/qixun/tips/list', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function addTip(
  params: { tip: string },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/tips/add', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

export async function editTip(
  params: { id: number; tip: string },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/tips/edit', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

export async function deleteTip(
  params: { id: number },
  options?: Record<string, any>,
): Promise<API.Result<null>> {
  return request<API.Result<null>>('/v0/qixun/tips/delete', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

// ============ 修改密码相关接口 Start ============

/**
 * 获取修改密码二维码
 *
 * @export
 * @param {API.GetPasswordChangeQrcodeParams} params 平台参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.PasswordChangeQrcodeResult>>} 二维码信息
 */
export async function getPasswordChangeQrcode(
  params: API.GetPasswordChangeQrcodeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.PasswordChangeQrcodeResult>> {
  return request<API.Result<API.PasswordChangeQrcodeResult>>(
    '/v0/user/password/wechat/qrcode',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/**
 * 检查修改密码状态
 *
 * @export
 * @param {API.CheckPasswordChangeParams} params 检查参数
 * @param {Record<string, any>} [options] 请求配置
 * @return {Promise<API.Result<API.CheckPasswordChangeResult>>} 状态结果
 */
export async function checkPasswordChange(
  params: API.CheckPasswordChangeParams,
  options?: Record<string, any>,
): Promise<API.Result<API.CheckPasswordChangeResult>> {
  // 手动构建 form data 字符串
  const formData = new URLSearchParams();
  formData.append('ticket', params.ticket);
  formData.append('newPassword', params.newPassword);

  return request<API.Result<API.CheckPasswordChangeResult>>(
    '/v0/user/password/wechat/check',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formData.toString(),
      skipErrorHandler: true,
      ...(options || {}),
    },
  );
}

// ============ 修改密码相关接口 End ============
