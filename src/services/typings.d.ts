declare namespace API {
  /**
   * 结果
   */
  type Result<T = null> = {
    success?: boolean;
    errorCode?: string;
    errorMessage?: string;
    data: T;
  };

  /**
   * 记录参数
   */
  type CounterDayParams = {
    event: string;
  };

  type LogParams = {
    text: string;
  };
  /**
   * 登录参数
   */
  type LoginParams = {
    userName?: string;
    password?: string;
    phone?: string;
    code?: string;
  };

  /**
   * 登录结果
   */
  type LoginResult = {
    name: string;
    value: string;
    version: number;
    comment: number | null;
    maxAge: number;
  };

  /**
   * 积分排行参数
   */
  type PointRankParams = {
    province: string | null;
  } & TypeParams;

  type TypeParams = {
    type: string;
    userId?: number;
  };

  /**
   * 寻景列表参数
   */
  type FinderListParams = {
    userId: string | undefined;
    startTime: number | null;
    endTime: number | null;
    time: number | null;
    timeUnit: string | null;
  };

  /**
   * 寻景
   */
  type EventPublishParams = {
    id: number;
    lat: string | null;
    lng: string | null;
  };
  /**
   * 发送消息参数
   */
  type AppealParams = {
    reason: string | null;
    messageId: number;
  };

  /**
   * 发送消息参数
   */
  type SendFriendMessageParams = {
    friend: number;
    message: string;
  };

  type AdminSendMessageParams = {
    userId: number;
    text: string;
  };

  /**
   * 删除好友参数
   */
  type DeleteFriendParams = {
    friend: number;
  };

  /**
   * 设置好友昵称参数
   */
  type SetFriendNicknameParams = {
    friend: number;
    nickname: string;
  };

  /**
   * 屏蔽好友参数
   */
  type BlockUserParams = {
    targetUserId: number;
  };

  /**
   * 搜索用户参数
   */
  type SearchUserParams = {
    keyword: string;
    pageNum: number;
    pageSize?: number;
  };

  /**
   * 好友下单参数
   */
  type OrderCommodityParams = {
    id: number;
  };

  type CommodityIdParams = {
    commodityId: number;
  };

  /**
   * 积分排行结果
   */
  type PointRank = {
    userAO: API.UserProfile;
    rating: number;
    rank: number;
  };

  /**
   * 积分排行结果
   */
  type ProvinceRank = {
    province: string;
    user_count: number;
  };

  /**
   * 寻景
   */
  type Finder = {
    id: number | null;
    userId: number | null;
    type: string;
    user: UserProfile;
    lat: number;
    lng: number;
    img: string;
    originImg: string;
    status: string;
    gmtCreate: number | null;
    gmtModified: number | null;
  };

  /**
   * 寻景
   */
  type Emoji = {
    id: string;
    image: string;
  };

  /**
   * 修改用户头像参数
   */
  type SetUserIconParams = {
    imageName: string;
  };

  /**
   * 修改用户头像参数
   */
  type SetUserNameParams = {
    userName: string;
  };

  /**
   * 修改个性签名参数
   */
  type SetDescParams = {
    desc: string;
  };

  /**
   * 修改省份参数
   */
  type SetProvinceParams = {
    province: string;
  };

  /**
   * 获取验证码参数
   */
  type StartMatchingParams = {
    interval: number;
  };

  /**
   * 获取验证码参数
   */
  type CaptchaParams = {
    phone: string;
    captchaVerifyParam?: string | null;
  };

  type ResetPasswordByPhoneParams = {
    code: string;
    password: string;
  } & CaptchaParams;

  type SetPhoneParams = {
    phone: string;
  } & CaptchaParams;

  /**
   * 用户信息
   */
  type UserProfile = {
    userId: number;
    userName: string;
    icon: string;
    ups: number;
    followers: number;
    focus: number;
    desc: string | null;
    rating: number;
    chinaRating: number;
    province: string | null;
    organization: string | null;
    avatarFrame: string | null;
  };

  type FriendProfile = UserProfile & {
    nickname: string;
  };

  type UserBind = {
    phone: boolean;
    wechat: boolean;
    apple: boolean;
    phoneNumber: string | null;
  };

  /**
   * 积分信息
   */
  type PointProfile = {
    userAO: UserProfile;
    chinaRank: TypeRank;
    worldRank: TypeRank;
  };

  type TypeRank = {
    rating: number | null;
    maxRating: number | null;
    rank: number | null;
    lastRanking: number | null;
    maxRanking: number | null;
    gameTimes: number | null;
    winningStreak: number | null;
    loseStreak: number | null;
    longestLoseStreak: number | null;
    longestWinningStreak: number | null;
    soloTimes: number;
    soloWin: number;
    soloLose: number;
  };

  /**
   * 积分信息
   */
  type UserActivity = {
    date: string;
    count: number;
  };

  type UserAchievement = {
    id: number;
    gmtCreate: number;
    achievement: {
      id: id;
      name: string;
      task: string;
      gems: number;
      count: number;
      seriesId?: string;
      seriesSeq?: number;
    };
  };

  /**
   * 技术分析结果
   */
  type UAResult = {
    userName: string;
    userId: number;
    rating: number;
    gameCount: number;
    roundCount: number;
    score5000: number;
    score4990: number;
    mean: number | null;
    standard: number | null;
    variance: number | null;
    scoreBucketList: scoreBucket[];
    lowestMean: CountryState[] | ProvinceState[];
    mostWrong: CountryState[] | ProvinceState[];
    mostRight: CountryState[] | ProvinceState[];
    highestMean: CountryState[] | ProvinceState[];
    allCountries: CountryState[];
    allProvinces: ProvinceState[];
    meanTimeConsume: number | null;
  };

  /**
   * 分桶结果
   */
  type scoreBucket = {
    scoreMin: number;
    scoreMax: number;
    count: number;
  };

  /**
   * 国家状态
   */
  type CountryState = {
    count: number;
    country: string;
    docLink: string | null;
    mean: number;
    wrong: number;
    right: number;
  };

  type ProvinceState = {
    count: number;
    province: string;
    docLink: string | null;
    mean: number;
    wrong: number;
    right: number;
  };

  /**
   * 消息处理通用参数
   */
  type MessageSolveParams = {
    messageId: number;
  };

  /**
   * 消息
   */
  type Message = {
    id: number;
    type: string;
    solve: boolean;
    solveAction: string;
    sender: UserProfile | null;
    gmtCreate: number;
    data: string | null;
    banUntil: number | null;
    banReason: string;
    banTime: number | null;
    banTimeUnit: string;
    more: string | null;
    // 预留后端 link 字段，便于消息跳转（例如互动/网络迷踪评论）
    link?: string | null;
  };

  /**
   * 商品信息
   */
  type Commodity = {
    deleted: boolean;
    drawGems: number | null;
    drawGuaranteed: number | null;
    emojiId: string | null;
    expectGems: number | null;
    gems: number | null;
    icon: string;
    id: number;
    inventory: number | null;
    totalInventory: number | null;
    link: string | null;
    more: string | null;
    name: string;
    oldPrice: number | null;
    orderNum: number;
    price: number;
    probability: number | null;
    sell: number;
    type: string;
  };

  /**
   * 商品信息
   */
  type CommodityOrder = {
    orderId: number;
    qrCodeUrl: string;
    url: string;
  };

  /**
   * 注册参数
   */
  type RegisterParams = {
    userName: string;
    password: string;
    phone: string;
    code: string;
  };

  /**
   * 检查Ticket参数
   */
  type CheckTicketLoginParams = {
    ticket: string;
  };

  /**
   * 检查Code参数
   */
  type CheckWXCodeLoginParams = {
    code: string;
    platform: string;
  };

  /**
   * 检查Vip状态参数
   */
  type CheckVipStateParams = {
    userId: number;
  };

  /**
   * 检查Vip状态参数
   */
  type GetJSPayUrlParams = { period: string };

  type GetGemsJSPayUrlParams = { planId: number };

  /**
   * 为Uid购买VIP
   */
  type GetJSPayUrlByUidParams = GetJSPayUrlParams & UserIdParams;

  /**
   * Vip 充值成功请求
   */
  type JSPayConfirm = { orderId: string };

  /**
   * id 参数
   */
  type NumberIdParams = {
    id: number;
  };

  /**
   * uid 参数
   */
  type UserIdParams = {
    userId: number;
  };

  type PlatformParams = {
    platform: string;
  };

  type BanUserParams = {
    time: number | null;
    timeUnit: string | null;
    reason?: string | null;
    more?: string | null;
  } & UserIdParams;

  /**
   * friend 参数
   */
  type FriendParams = {
    friend: number;
  };

  type InviteFriendPartyParams = FriendParams & {
    code: string;
  };

  /**
   * img 参数
   */
  type ImgParams = {
    img: string;
  };

  /**
   * 举报用户参数
   */
  type ReportUserParams = {
    target: number;
    reason: string;
    more?: string | null;
    gameId?: string | null;
  };

  /**
   * 举报 参数
   */
  type ReportPanoParams = {
    panoId: string;
    mapsId: number;
    reason?: string | null;
    more?: string | null;
  };

  /**
   * 获取全景图信息参数
   */
  type GetPanoInfoParams = {
    pano: string;
  };

  /**
   * 全景图信息
   */
  type PanoInfo = {
    pano: string;
    links: (google.maps.StreetViewLink & {
      centerHeading: number;
    })[];
    lat: number;
    lng: number;
    width: number | null;
    height: number | null;
    centerHeading: number;
    bd09Lat: number;
    bd09Lng: number;
    fov: number | null;
  };

  /**
   * 汇报全景图错误参数
   */
  type ReportErrorPanoParams = {
    panoId: string;
    status: google.maps.StreetViewStatus;
    page: string;
  };

  /**
   * 获取每日挑战ID参数
   */
  type GetDailyChallengeIdParams = {
    type: DailyChallengeType;
  };

  /**
   * 获取每日挑战总数参数
   */
  type GetDailyChallengeTotalParams = {
    challengeId: string;
  };

  /**
   * 每日挑战排名类型参数
   */
  type GetDailyChallengeRankParams = {
    rankType: DailyChallengeRankType;
    challengeId: string;
  };

  /**
   * 获取我的每日挑战排名参数
   */
  type GetMyDailyChallengeRankParams = {
    gameId?: string;
  } & GetDailyChallengeTotalParams;

  /**
   * 获取每日挑战复盘链接参数
   */
  type ListDailyChallengeLinkParams = {
    userId: string;
    day?: string;
  };

  /**
   * 每日挑战复盘链接数据
   */
  type DailyChallengeLinkData = {
    gameIdChina: string | null;
    gameIdWorld: string | null;
  };

  /**
   * 我的每日挑战排名
   */
  type MyDailyChallengeRank = {
    moreThan: number | null;
    percent: number | null;
    rank: number | null;
    total: number | null;
  };

  type DailyChallengeInfo = {
    challengeId: string;
    provider: API.UserProfile;
  };

  /**
   * 获取连胜挑战ID参数
   */
  type GetStreakIdParams = {
    type: StreakType;
  };

  type UserReportItems = {
    reports: UserReportItem[];
    total: number;
  };

  type CheatLogItem = {
    id: number;
    // userId: number;
    user: UserProfile;
    submitter: UserProfile;
    // submitterId: number;
    link: string;
    type: string;
    gmtCreate: number;
    gmtModified: number;
  };

  type BanByLogParams = {
    userId: number;
    logIds: number[];
    time?: number | null;
    timeUnit?: string;
  };

  type AddCheatLogParams = {
    userId: number;
    links: string;
  };

  type BanReviewItem = {
    id: number;
    user: User;
    reason: string;
    detail: string;
    helper: User;
    status: string;
    reviewer: User;
    gmtCreate: number;
    gmtModified: number;
  };

  type UserReportItem = {
    id: number;
    reportUser: UserProfile;
    user: UserProfile;
    reason: string | null;
    gameId: string | null;
    more: string | null;
    status: string | null;
    meta: string;
  };

  type IgnoreReportParam = {
    id: number;
  };

  type BatchIgnoreReportParam = {
    ids: number[];
  };

  type GetUATimeParams = {
    extra?: string;
  };

  type SubmitBanParams = {
    userId: number;
    reason: string;
    detail: string;
  };

  type SetLoggedParams = {
    id: number;
    links: string;
  };

  type ApproveBanReviewParams = {
    id?: number;
    detail: string;
    time?: number | null;
    timeUnit: string;
  };

  type BanHistoryItem = {
    user: UserProfile;
    gmtCreate: number;
    banUntil: number | null;
    banReason: string | null;
    more: string | null;
    revoked: boolean;
  };

  type UserAltItem = {
    userId: number;
    userName: string;
    count: number;
    rating: number | null;
    chinaRating: number | null;
    ban: boolean;
    lastRating: string | null;
  };

  type AppealManageItem = {
    id: number;
    // userId: number;
    user: UserProfile;
    permanent: boolean;
    gmtUntil: number;
    // operatorId: number;
    operator: UserProfile;
    gmtBan: number;
    banReason: string;
    banDetail: string;
    appealText: string;
    gmtLastAppeal: number;
    revoked: boolean;
    // revokerId: number;
    revoker: UserProfile;
    gmtRevoke: number;
    appealReplyText: string;
    gmtCreate: number;
    gmtModified: number;
  };

  /**
   *  连胜排名类型参数
   */
  type GetStreakRankParam = {
    type: string;
    player?: string;
  };

  type StreakRankInfo = {
    user: UserProfile;
    rank: number;
    bestStreaks: number;
  };

  /**
   * VIP 支付二维码链接
   */
  type GetJSPayUrlResult = {
    orderId: string;
    qrCodeUrl: string;
    url: string;
  };

  type VipPlan = {
    showName: string;
    price: string;
    expectPrice: string | null;
    period: string;
    appleProductId: string;
    vipPeriod: string;
    pricePerMonth: string | null;
    extraDays: number | null;
  };

  type GemsPlan = {
    id: number;
    price: string;
    expectPrice: string | null;
    gems: number;
    awardGems: number | null;
    appleProductId: string | null;
  };

  type GetVipPlanResult = {
    hint1: string;
    hint2: string;
    plans: VipPlan[];
  };

  type GetGemsPlanResult = {
    hint1: string;
    hint2: string;
    plans: GemsPlan[];
  };

  /**
   * 每日挑战类型排行榜
   */
  type DailyChallengeRank = {
    score: number;
    user: UserProfile;
  };

  type ChallengeRankParams = {
    period: string;
    type?: string;
  };

  type PostChallengeRank = {
    rank: number;
    times: number;
    costTime?: number;
    user: UserProfile;
  };

  /**
   * 每日挑战排行榜
   */
  type DailyChallengeRanks = {
    rank: DailyChallengeRank[];
    total: number;
  };

  /**
   * 检查每日挑战是否绑定
   */
  type DailyChallengeBind = {
    chinaBind: boolean;
    worldBind: boolean;
  };

  /**
   * 获取比赛信息参数
   */
  type GetGameInfoParams = {
    day?: number;
    type?: DailyChallengeType;
    challengeId?: string;
  };

  /** 挑战页公开配置（hubMeta 返回 qixunChallengeAO，无题目信息） */
  type qixunChallengeAO = {
    playType?: string | null;
    mapsId?: number | null;
    /** 内嵌地图信息（与 maps/get 的 MapItem / 后端 qixunMapsAO 一致，字段可能不全） */
    map?: Partial<MapItem> | null;
    /** 发起挑战/对局的用户 */
    creator?: UserProfile | null;
    move?: boolean | null;
    pan?: boolean | null;
    zoom?: boolean | null;
    noCar?: boolean | null;
    blinkTime?: number | null;
    roundTimerPeriod?: number | null;
    /** 已登录且在 challenge_rank 已有该挑战成绩为 true；已登录未完成 false；未登录或未识别用户为 null */
    viewerCompleted?: boolean | null;
    /** 已登录时 Redis 中该用户与本挑战关联的对局 id（与 getGameInfo 一致），用于复盘；未登录为 null */
    gameId?: string | null;
  };

  /**
   * 创建
   */
  type CreateChallengeParams = {
    mapsId: number;
    type: 'move' | 'noMove';
    move?: boolean | null;
    pan?: boolean | null;
    zoom?: boolean | null;
    timeLimit?: number | null;
    blinkTime?: number | null;
    noCar?: boolean | null;
  };

  type GameIdParams = {
    gameId: string;
  };

  type StringIdParams = {
    id: string;
  };

  type EmojiIdParams = {
    emojiId: string;
  };

  type SendEmojiParams = EmojiIdParams & GameIdParams;

  type SendPartyEmojiParams = EmojiIdParams & {
    partyId: string;
  };

  /**
   * 创建
   */
  type SaveBindParams = {
    type: string;
    links: string;
  };

  type BindParams = {
    solution: string;
    today: boolean;
  } & SaveBindParams;

  /**
   * 获取绑定配置
   */
  type GetBindParams = {
    type: string;
  };

  /**
   * 获取比赛回合信息
   */
  type GameRoundResult = {
    round: number;
    score: number;
    distance: number;
    healthBefore?: number;
    healthAfter?: number;
    guessPlace?: string | null;
    targetPlace?: string | null;
    user: UserProfile | null;
  };

  /**
   * 获取当前玩家比赛信息
   */
  type GamePlayerInfo = {
    totalScore: number;
    roundResults: GameRoundResult[];
    lastRoundResult?: GameRoundResult;
    guesses: UserGuessPinHint[];
    user: API.UserProfile;
  };

  /**
   * 回合数据
   */
  type GameRound = {
    round: number;
    contentType: 'panorama';
    content: string | null;
    heading: number;
    contentSpeedUp: number | null;
    lat: number;
    lng: number;
    startTime: number;
    timerStartTime: number | null;
    timerGuessStartTime: number | null;
    endTime: number | null;
    contents: string[] | null;
    isDamageMultiple: boolean;
    damageMultiple: number;
    obsoleteTeamIds: string[] | null;
    move: boolean;
    source: 'baidu_pano' | 'qixun_pano' | 'google_pano' | 'qq_pano';
    panoId: string;
    pan: boolean;
    zoom: boolean;
    vHeading: number;
    vZoom: number;
    vPitch: number;
  };

  /**
   * 比赛信息
   */
  type GameInfo = {
    id?: string;
    status: GameStatus;
    health: number;
    type: GameType;
    challengeId: string;
    player: GamePlayerInfo;
    rounds: GameRound[];
    currentRound: number | null;
    roundNumber: number | null;
    roundTimePeriod: number | null;
    roundTimeGuessPeriod: number | null;
    timerStartTime: number | null;
    startTimerPeriod: number | null;
    mapsName: string | null;
    mapsId: number | null;
    teams: PartyTeam[] | null;
    playerIds: number[] | null;
    me?: UserProfile;
    onlineNums?: number;
    saveTeamCount?: number;
    partyId?: string | null;
    china?: boolean | null;
    noCar?: boolean | null;
    record?: boolean | null;
    move?: boolean | null;
    pan?: boolean | null;
    mapMaxLat?: number | null;
    mapMinLat?: number | null;
    mapMaxLng?: number | null;
    mapMinLng?: number | null;
    centerLat?: number | null;
    centerLng?: number | null;
    mapZoom?: number | null;
    blinkTime?: number | null;
    requestUserId: number | null;
    host: UserProfile;
  };

  type AgainResult = {
    gameId?: string | null;
    challengeId?: string | null;
  };

  /**
   * 开始比赛参数
   */
  type StartGameParams = {
    gameId: string;
  };

  /**
   * 加入比赛参数
   */
  type JoinGameParams = {
    gameId: string;
  };

  type DrawDailyChallenge = {
    status: string;
    drawResult?: DrawDailyChallengeResult | null;
  };

  type DrawDailyChallengeResult = {
    resultType: string;
    result: string;
  };

  /**
   * 通过邀请码加入派对参数
   */
  type JoinByCodeParams = {
    joinCode: string;
  };

  /**
   * 提交位置参数
   */
  type SubmitPinParams = {
    type: 'game' | 'challenge' | 'br' | 'streak' | 'infinity';
    gameId: string;
    lng: number;
    lat: number;
  };

  /**
   * 下一轮参数
   */
  type NextRoundParams = {
    type: 'game' | 'challenge' | 'br' | 'streak' | 'infinity';
    gameId: string;
  };

  /**
   * 获取日常挑战排名参数
   */
  type GetDailyChallengeRanParams = {
    challengeId: string;
    gameId: string;
  };

  /**
   * 用户猜测信息
   */
  type UserGuessPinHint = {
    round: number;
    lat: number;
    lng: number;
    distance: number;
    gmtCreate: number;
    timeConsume: number | null;
    score: number | null;
  };

  /**
   * Team User对象
   */
  type TeamUser = {
    user: UserProfile;
    guesses: UserGuessPinHint[] | null;
    pin?: UserGuessPinHint;
    hint?: UserGuessPinHint;
  };

  /**
   * 派对队伍信息
   */
  type PartyTeam = {
    id: string;
    choose: boolean;
    finalRating: number;
    health: number | null;
    lastRoundResult: GameRoundResult | null;
    ratingChange: number | null;
    teamUsers: TeamUser[];
    users: UserProfile[];
  };

  /**
   * 派对信息
   */
  type PartyInfo = {
    id: string;
    gameHealth: number;
    gameId: string | null;
    gameMapsId: number;
    gameMapsName: string;
    gameMove: boolean;
    gamePan: boolean;
    gameZoom: boolean;
    gameType: PartyMatchType;
    record: boolean;
    noCar: boolean;
    host: UserProfile;
    joinCode: string;
    onlookers: UserProfile[];
    players: UserProfile[];
    requestUserId: number;
    roundCountDown: RoundCountDownType;
    roundTimerPeriod: number;
    roundTimerGuessPeriod: number;
    blinkTime: number | null;
    blockPlayerIds: number[];
    status: GameStatus;
    teams: PartyTeam[];
    roundNumber: number;
    multiplierOpen: boolean;
    multiplierStartRound: number | null;
    roundMultiplierIncrement: number | null;
  };

  /**
   * 是否自由视角
   */
  type ChangePanParams = {
    free: boolean;
  };

  /**
   * 设置倍率参数
   */
  type ChangeMultiplierParams = {
    open: boolean;
    startRound: number | null;
    increment: number | null;
  };

  /**
   * 切换为玩家参数
   */
  type SwitchToPlayerParams = {
    teamId: string | null;
  };

  /**
   * 切换派对类型参数
   */
  type ChangePartyTypeParams = {
    type: PartyMatchType;
  };

  /**
   * 设置无车模式参数
   */
  type ChangeNoCarParams = {
    noCar: boolean;
  };

  /**
   * 设置回合时间参数
   */
  type ChangeCountDownParams = {
    countDown: RoundCountDownType;
    roundTimerPeriod: number;
    roundTimerGuessPeriod: number;
  };

  /**
   * 设置眨眼时间参数
   */
  type ChangeBlinkTimeParams = {
    blinkTime: number | null;
  };

  /**
   * 设置生命值
   */
  type ChangeHealthParams = {
    health: number;
  };

  type ChangeRoundNumberParams = {
    roundNumber: number;
  };

  /**
   * 设置是否自由视角
   */
  type ChangeFreeParams = {
    free: boolean;
  };

  /**
   * 设置是否开启回放
   */
  type changeRecordParams = {
    record: boolean;
  };

  /**
   * 切换派对地图参数
   */
  type ChangePartyMapsParams = {
    mapsId: number;
    type: 'move' | 'noMove' | 'npmz';
  };

  /**
   * 地图Id参数
   */
  type MapIdParams = {
    mapId: number;
  };
  type MapsIdParams = {
    mapsId: number;
  };

  /**
   * 上传街景参数
   */
  type uploadPanoramaParams = {
    links: string;
    mapsId: number;
  };

  type MapRankParams = {
    mapsId: number;
    type: 'move' | 'noMove' | 'npmz';
  };

  /**
   * 地图搜索参数
   */
  type SearchMapsParams = {
    keyword: string;
  };

  /**
   * 地图筛选参数
   */
  type CountParams = {
    count: number;
  };

  /**
   * 地图筛选参数
   */
  type MapFilterParams = {
    duration?: string;
  } & CountParams;

  /**
   * 获取地图信息参数
   */
  type GetMapInfoParams = {
    mapsId: number;
  };
  type ModifyMapInfoParams = {
    mapsId: number;
    name: string;
    desc?: string;
    cover?: string;
  };

  type AddMapPanosParams = {
    mapsId: number;
    links?: string;
    file?: file;
  };
  type MapContainParams = {
    mapsId: number;
    containId: number;
  };

  type MapReport = {
    id: number;
    reason: string;
    more: string;
  };
  type ListMapPanosParams = {
    mapsId: number;
    page: number;
    size?: number;
    status?: string | undefined;
  };

  type ListMapPanosByTagParams = {
    mapsId: number;
    tags?: string;
    reverse: boolean;
    noTag: boolean;
    all: boolean;
  };

  type MapTag = {
    count: number;
    tag: string;
  };

  /**
   * 创建题库
   */
  type MapCreateParams = {
    name: string;
    desc?: string;
    cover?: string;
  };

  /**
   * 地图对象
   */
  type MapItem = {
    id: number;
    cover?: string;
    name: string;
    desc: string;
    pcount: number;
    players: number;
    canMove: boolean;
    userId: number;
    countryStreak: boolean;
    avgScore: number | null;
    publish: boolean | null;
    user: UserProfile;
  };

  type MapStatus = {
    total: number | null;
    publish: number | null;
    ready: number | null;
    crawling: number | null;
    crawler_fail: number | null;
    wait_check: number | null;
  };

  type MapContain = {
    id: number;
    panoId: string;
    source: 'baidu_pano' | 'qixun_pano' | 'google_pano' | 'qq_pano';
    status: string;
    lat: number;
    lng: number;
    heading: number;
    zoom: number;
    pitch: number;
  };

  type MapContainPage = {
    pageNum: number;
    pageSize: number;
    total: number;
    list: MapContain[];
  };

  type UserIdParams = {
    userId: number;
  };

  type HistoryItem = {
    id: number;
    type: string;
    moveType: string | null;
    gameId: string | null;
    moveType: string | null;
    gmtCreate: number;
    gmtEnd: number;
    gmtModified: number;
    partyId: string | null;
    rating: number | null;
    ratingChange: number | null;
    ratingType: string | null;
    score: number | null;
    season: string | null;
  };

  type Activity = {
    title: string;
    link: string;
  };

  type Activities = {
    normalActivities: Activity[];
    specialActivities: Activity[];
  };

  /**
   * 更改房主参数
   */
  type ChangeHostParams = UserIdParams;
  type KickOffParams = UserIdParams;
  type HostSwapTeamParams = UserIdParams;

  /**
   * App版本
   */
  type AppVersion = {
    version: string;
  };

  /**
   * 获取App版本参数
   */
  type AppVersionAO = {
    android: AppVersion;
    ios: AppVersion;
  };

  /**
   * 派对信息
   */
  type TeamInfo = {
    id: string;
    joinCode: string;
    players: UserProfile[];
    captain: UserProfile;
    gameId: string | null;
    status: string;
    type: string;
  };

  type TeamIdParams = {
    teamId: string;
  };

  type InviteFriendTeamParams = FriendParams & TeamIdParams;

  type SetTeamTypeParams = {
    type: string;
  } & TeamIdParams;

  type ChangeTeamCaptainParams = TeamIdParams & UserIdParams;

  /* 互动相关接口 */

  /**
   * 帖子列表
   */
  type ListPostParams = {
    userId?: number | null;
    success?: boolean | null;
    period?: string;
    pageNum: number;
    pageSize: number;
    sort?: string;
    solveStatus?: string; // 'all' | 'solved' | 'unsolved' 已解/未解状态
  };

  /**
   * 发布帖子
   */
  type QuestionPostParams = {
    title: string;
    content: string;
  };

  /**
   * 帖子id
   */
  type PostIdParams = {
    postId: number;
  };

  /**
   * 提交答案
   */
  type SubmitDistanceParams = {
    postId: number;
    distance: number;
  };

  type SubmitLatLngParams = {
    postId: number;
    lat: number | undefined;
    lng: number | undefined;
  };

  type PostChallengeSubmitResponse = {
    success;
  };

  /**
   * 是否提交过答案？
   */
  type checkSubmitParams = {
    postId: number;
    userId: number;
  };

  /**
   * 帖子详情参数
   */
  type PostParams = {
    id: number;
    status: number;
    user: UserProfile;
    type: string;
    title: string;
    question: QuestionParams;
    gmtCreate: number;
    gmtModified: number;
    startTimes: number;
    endTimes: number;
    commentCount: number;
    currentUserDistance: number;
    currentUserRank: number;
    successUser: UserProfile;
    successTime: number;
    canDelete: boolean;
    collected?: boolean;
  };

  /**
   * 帖子内容参数
   */
  type QuestionParams = {
    id: number;
    type: string;
    distance: number;
    items: API.QuestionItemParams[];
  };

  /**
   * 帖子单图参数
   */
  type QuestionItemParams = {
    type: string;
    path: string;
    lat: number;
    lng: number;
  };

  /**
   * 帖子列表
   */
  type PostListResult = {
    posts: PostParams[];
    pageNum: number;
    total: number;
    pageSize: number;
  };

  /**
   * 评论列表
   */
  type listCommentParams = {
    commentList: CommentParams[];
  };

  /**
   * 评论里的@信息（与猜盐保持一致）
   */
  type MentionItem = {
    user_id: number;
    display: string;
    start: number;
    end: number;
  };

  /**
   * 评论id
   */
  type CommentIdParams = {
    commentId: number;
  };

  /**
   * 发布评论参数
   */
  type postCommentParams = {
    commentText: string;
    mentions?: MentionItem[];
    id: number;
    postId: number;
    userId: number;
  };

  /**
   * 评论详情参数
   */
  type CommentParams = {
    id: number;
    user: UserProfile;
    postId: number;
    commentText: string;
    mentions?: MentionItem[];
    gmtCreate: number;
    gmtModify: number;
    parentCommentId: number | null;
    childCommentCount: number;
    likeCount: number;
    isLike: boolean;
    isDelete: boolean;
    isTop: boolean;
    childComments: CommentParams[];
  };

  /**
   * 答题排行参数
   */
  type PostRankingParams = {
    postId: number;
    count?: number;
  };

  type PostRankingResult = {
    postId: number;
    count: number;
    rankList: Ranking[];
  };

  /**
   * 经纬度转换
   */
  type LngLatCvtParams = {
    content: string;
  };

  type LngLatCvtResult = {
    lng: string;
    lat: string;
  };

  /**
   * 街景审核参数
   */
  type generateQueueResponseParams = {
    // 因为只需要这一个所以其他的不填了 等什么时候优先级到这了再说
    totalCount: number;
  };

  type GenerateQueueResult = {
    id: number;
    panoId: string;
    totalCount: number;
    mapsName?: string;
    nation?: string;
    heading?: number;
  };

  type PanoContentResult = {
    id: number;
    content: string;
    panoId: string;
    totalCount: number;
  };

  /**
   * 抽奖！
   */

  type drawLotteryParams = {
    commodityId: number;
    draws: number;
  };

  type drawLotteryResult = {
    commodityId: number;
    isWin: boolean;
    refundGems: number;
    userId: number;
    winTimes: number;
    vipMinutes: number;
  };

  type getUserDrawCountParams = {
    userId: number;
    commodityId: number;
  };

  type GetUserBagParams = {
    userId: number;
    type: string;
  };

  type WearAvatarFrameParams = {
    userId: number;
    commodityId: number;
  };

  type AdminAddVipParams = {
    userId: number;
    day: number;
  };

  type AdminAddGemsParams = {
    userId: number;
    gems: number;
  };

  type ListReportsParams = {
    count?: number;
    page?: number;
    status?: string;
    desc?: boolean;
    reason?: string;
  };

  type ReportSolvingParams = {
    id: number;
    action: string;
    additionAction?: string;
  };

  type ClearUserInfoParams = {
    userId: number;
    action: string;
  };

  type ReportItem = {
    id: number;
    type: string;
    reason: string;
    postInfo: {
      imageName: string;
      title: string;
      postId: number;
      forum: {
        name: string;
      };
    } | null;
    commentInfo: {
      id: number;
      text: string;
      postId: number;
      userInfo: UserProfile;
    } | null;
    userInfo: UserProfile | null;
  };

  type AchievementItem = {
    id: number;
    count: number;
    name: string;
    task: string | null;
    hint: string | null;
    gems: number;
    hidden: boolean;
    seriesId: string | null;
    seriesSeq: number;
    gmtCreate: number;
    gmtModified: number;
  };

  type AchievementProgressItem = {
    achievementId: number;
    progress: number;
    target: number;
  };

  type AchievementManageItem = {
    id: number;
    name: string;
    task: string | null;
    hint: string | null;
    gems: number;
    hidden: boolean;
    disabled: boolean;
    seriesId: string | null;
    seriesSeq: number;
    count: number;
    action: string | null;
    actionCount: number;
    gmtCreate: number;
    gmtModified: number;
  };

  type EditAchievementParams = {
    id: number;
    name: string;
    task: string | null;
    hint: string | null;
    seriesId: string | null;
    seriesSeq: number;
    gems: number;
    hidden: boolean;
    disabled: boolean;
  };

  type CreateAchievementParams = {
    name: string;
    task: string | null;
    hint: string | null;
    seriesId: string | null;
    seriesSeq: number;
    gems: number;
    hidden: boolean;
    disabled: boolean;
  };

  type AnnualReportItem = {
    gmtRegister: number;
    activeDays: number[];
    modeTime: ModeTimeItem[];
    gmtLatest: number;
    gmtEarliest: number;
    periodCount: number[];
    newFriends: number[];
    firstFriend: number;
    gmtFirstFriend: number;
    bestAchievement: AchievementItem;
    bestAchievementRank: number;
    gmtBestAchievement: number;
    goodGames: SimpleGameItem[];
    maxMinGames: SimpleGameItem2[];
    worldRatingCount: number;
    chinaRatingCount: number;
  };

  type ModeTimeItem = {
    mode: string;
    time: number;
  };

  type SimpleGameItem = {
    gameId: string;
    ratingChange: number;
  };

  type SimpleGameItem2 = {
    gameId: string;
    rating: number;
    ratingType: string;
  };

  type ReplayParams = {
    gameId: string;
    userId: number;
    round: number;
  };

  type RecordItem = {
    action: string;
    type: string;
    time: number;
    data: string;
  };

  type GameReplay = {
    playerId: number;
    gameId: string;
    round: number;
    game: any;
    records: RecordItem[];
  };

  type FeedbackParams = {
    feedback: string;
    extra?: string;
    source?: string;
  };

  /**
   * 提示信息
   */
  type TipInfo = {
    id: number;
    tip: string;
    gmtCreate: string | null;
    gmtModified: string | null;
  };

  /**
   * 获取修改密码二维码参数
   */
  type GetPasswordChangeQrcodeParams = {
    platform: string;
  };

  /**
   * 获取修改密码二维码结果
   */
  type PasswordChangeQrcodeResult = {
    qrcodeUrl: string;
    ticket: string;
  };

  /**
   * 检查修改密码状态参数
   */
  type CheckPasswordChangeParams = {
    ticket: string;
    newPassword: string;
  };

  /**
   * 检查修改密码状态结果
   */
  type CheckPasswordChangeResult = {
    status: 'pending' | 'success' | 'expired' | 'wechat_mismatch';
    message?: string;
  };
}
