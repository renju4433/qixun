import {
  Button,
  Card,
  Carousel,
  Col,
  ConfigProvider,
  Flex,
  List,
  message,
  Popconfirm,
  QRCode,
  Row,
  Statistic,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import {
  checkAnnual,
  getAnnual,
  getSoloGameInfo,
  getqixunUserProfile,
} from '@/services/api';
import { Bar } from '@ant-design/plots';
import moment from 'moment';

import HeaderLogo from '@/components/Header/Logo';
import Panorama, { PanoramaRef } from '@/components/Map/GoogleMap/Panorama';
import qixunAvatar from '@/components/User/qixunAvatar';
import { useLoadGoogle } from '@/hooks/use-load-google';
import {
  CaretUpOutlined,
  CloudDownloadOutlined,
  FileImageOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { useModel, useNavigate } from '@umijs/max';
import { CarouselRef } from 'antd/lib/carousel';

import html2canvas from 'html2canvas';

import SendMessageModal from '../Friend/SendMessageModal';
import styles from './style.less';

const VER = '2412261150';
const CACHE_EXPIRE = 1000 * 60 * 60;

const Year2024: React.FC = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const now = moment();
  const [data, setData] = useState<API.AnnualReportItem>();
  const [disabled, setDisabled] = useState<boolean>(
    new Date().getTime() <= 1735660800000,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [done2, setDone2] = useState<boolean>(false);
  const [check, setCheck] = useState<boolean>(false);
  const ref = useRef<CarouselRef>(null);
  const [curr, setCurr] = useState<number>(0);
  const [scroll, setScroll] = useState<boolean>(false);

  const [showModal, setShowModal] = useState<boolean>(false);

  const [detailInfo, setDetailInfo] = useState<Record<string, API.GameInfo>>(
    {},
  );
  const [friends, setFriends] = useState<API.UserProfile[]>();
  const [firstFriend, setFirstFriend] = useState<API.UserProfile>();
  const [chosenFriend, setChosenFriend] = useState<API.UserProfile>();

  const [loaded, setLoaded] = useState<boolean>(false);
  const panoRef = useRef<PanoramaRef | null>(null);
  useLoadGoogle({ setLoaded });

  const navigator = useNavigate();

  const [genLoading, setGenLoading] = useState<boolean>(false);
  const [backgroundLoading, setBackgroundLoading] = useState<boolean>(false);
  const [background, setBackground] = useState<
    API.GameRound & { desc: string }
  >();

  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const rounds = [
    {
      source: 'google_pano',
      panoId: 'sbxnmByvDGC3toX9uS92pg',
      vHeading: 205,
      vZoom: 2,
      vPitch: 0,
      desc: '葡萄牙, 亚速尔群岛, 绣球花大道',
    },
    {
      source: 'google_pano',
      panoId: 'sTbQiuU65viHrJBtWAX90A',
      vHeading: 54,
      vZoom: 4,
      vPitch: 1,
      desc: '智利, 洛斯拉戈斯县, 火山',
    },
    {
      source: 'google_pano',
      panoId: 'RpUkayXeO0VRJxdFRCge-Q',
      vHeading: 238,
      vZoom: 4,
      vPitch: 0,
      desc: '阿曼, 佐法尔省, 悬崖边的单峰骆驼',
    },
    {
      source: 'qq_pano',
      panoId: '180810C2140110143021000',
      vHeading: 130,
      vZoom: 1,
      desc: '中国, 浙江, 舟山, 东极岛',
    },
    {
      source: 'qq_pano',
      panoId: '14071028130705121829000',
      vHeading: 15,
      vZoom: 2,
      desc: '中国, 辽宁, 锦州, 锦州湾',
    },
    {
      source: 'google_pano',
      panoId: 'sZNHBSL0GRTpzYTE0dEjLw',
      vHeading: 225,
      vZoom: 2,
      desc: '挪威, 诺尔兰郡, 冬日晚霞',
    },
    {
      source: 'qq_pano',
      panoId: '10081042141213105130400',
      vHeading: 181,
      vZoom: 2,
      desc: '中国, 重庆, 武隆区, 仙女山风景区',
    },
    {
      source: 'qq_pano',
      panoId: '36061003131127134916400',
      vHeading: 110,
      vZoom: 2.3,
      desc: '中国, 西藏, 波密县, 雅鲁藏布江和远处的雪山',
    },
    {
      source: 'google_pano',
      panoId: 'fCMAE91I7vifFNIX5cUdKA',
      vHeading: 137,
      desc: '西班牙, 阿拉贡自治区, 田园樱花',
    },
    {
      source: 'google_pano',
      panoId: 'vXq5TPqJhxYs-edtyQo7_Q',
      desc: '意大利, 巴尔奇斯, 多洛米蒂山脉',
      vHeading: 275,
      vZoom: 2.7,
      vPitch: 5,
    },
    {
      source: 'google_pano',
      panoId: 'qjIOYIB_OujEayuPBsUXzw',
      vHeading: 100,
      vPitch: 20,
      vZoom: 2.2,
      desc: '俄罗斯, 勘察加半岛, 爱心云',
    },
    {
      source: 'google_pano',
      panoId: 'rwUmiCtYLeV8NXh26Mrthg',
      vHeading: 313,
      vZoom: 2,
      desc: '巴西, 马拉尼昂州, 伦索伊斯-马拉年塞斯国家公园, 沙丘与潟湖',
    },
    {
      source: 'qq_pano',
      panoId: '35011003130918141028600',
      vHeading: 146,
      vZoom: 2.5,
      desc: '中国, 新疆, 乌鲁木齐市, 天山天池',
    },
    {
      source: 'qq_pano',
      panoId: '10091019150416102819600',
      vHeading: 13,
      vZoom: 2.4,
      desc: '中国, 杭州, 西湖风景区, 龙井问茶',
    },
    {
      source: 'google_pano',
      panoId: 'JwNH17CkwQ_GXgTZAlI5mQ',
      vHeading: 148,
      vPitch: -5,
      desc: '泰国, 清迈, 安康山',
    },
    {
      source: 'google_pano',
      panoId: 'dZmHM-ah-2pkaKYWk-pjMg',
      vHeading: 310,
      vZoom: 2.2,
      vPitch: 3,
      desc: '法国, 内瓦什, 阿尔卑斯山脉',
    },
    {
      source: 'google_pano',
      panoId: '05Y7CQdAl6ngHODal7-WBg',
      vHeading: 333,
      vZoom: 2.15,
      desc: '冰岛, 杰古沙龙冰河湖',
    },
    {
      source: 'google_pano',
      panoId: 'JwUnP2B_4vWLN2a2um-o4g',
      vHeading: 193,
      vPitch: -5,
      vZoom: 2.25,
      desc: '土耳其, 特拉布宗省, 盘山公路',
    },
    {
      source: 'google_pano',
      panoId: 'unI2hoAhopNm1cXUXRSygg',
      vHeading: 315,
      vZoom: 2.2,
      desc: '智利, 阿塔卡马, 贝尔德潟湖',
    },
    {
      source: 'qq_pano',
      panoId: '10022006120801221750800',
      vHeading: 295,
      vPitch: 28,
      vZoom: 2.1,
      desc: '中国, 上海, 陆家嘴, 东方明珠',
    },
    {
      source: 'qq_pano',
      panoId: '12091124131007143808400',
      vHeading: 38,
      vZoom: 2.3,
      vPitch: 7,
      desc: '山西, 忻州, 五台山, 塔院寺大白塔',
    },
    {
      source: 'qq_pano',
      panoId: '10161051150719130703300',
      vHeading: 261,
      vZoom: 2.3,
      vPitch: 13,
      desc: '中国, 陕西, 西安, 钟楼',
    },
    {
      source: 'qq_pano',
      panoId: '36061103131126155025600',
      vHeading: 10,
      vZoom: 2.5,
      vPitch: 3,
      desc: '中国, 西藏, 墨脱县, 墨脱公路',
    },
    {
      source: 'qq_pano',
      panoId: '170930U8140106120849100',
      vHeading: 90,
      vZoom: 2.3,
      desc: '中国, 江苏, 镇江, 西津渡',
    },
    {
      source: 'qq_pano',
      panoId: '10111014141126132805200',
      vHeading: 79,
      vZoom: 3.2,
      vPitch: 1,
      desc: '中国, 山东, 青岛, 海军博物馆',
    },
    {
      source: 'qq_pano',
      panoId: '190910C3140508151430000',
      vHeading: 45,
      vZoom: 2.3,
      vPitch: 5,
      desc: '中国, 安徽, 黄山',
    },
    {
      source: 'google_pano',
      panoId: 'SDMg0EkCVlfzSGtU7h481A',
      vHeading: 338,
      vZoom: 2.1,
      desc: '美国, 亚利桑那, 赛多纳, 雪覆红岩',
    },
  ];

  const pageRef = useRef<HTMLDivElement>(null);

  const handleScreenshot = async () => {
    if (pageRef.current) {
      setSaveLoading(true);
      try {
        const canvas = await html2canvas(pageRef.current, {
          // removeContainer: false,
          useCORS: true,
          // allowTaint: true,
        });
        const imgData = canvas.toDataURL('image/png');

        // 创建下载链接
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `棋寻年度报告-${user?.userName}.png`;
        link.click();
      } catch (error) {
        console.error('截图失败：', error);
      }
      setSaveLoading(false);
    }
  };

  const getRandomBackground = () => {
    let index = -1;
    while (index === -1 || rounds[index].panoId === background?.panoId) {
      index = Math.floor(Math.random() * rounds.length);
    }
    // index = 26;
    // index = 5;
    return {
      round: index,
      contentType: 'panorama',
      source: rounds[index].source,
      panoId: rounds[index].panoId,
      content: null,
      heading: 0.1,
      contentSpeedUp: 0,
      lat: 0,
      lng: 0,
      startTime: 0,
      timerStartTime: null,
      timerGuessStartTime: null,
      endTime: null,
      contents: null,
      isDamageMultiple: false,
      damageMultiple: 0,
      obsoleteTeamIds: null,
      move: false,
      pan: false,
      zoom: false,
      vHeading: rounds[index].vHeading,
      vZoom: rounds[index].vZoom,
      vPitch: rounds[index].vPitch,
      desc: rounds[index].desc,
    };
  };

  // const gemImageLink =
  //   'https://b68v.daai.fun/front/gems.png?x-oss-process=image/resize,h_120';

  const randomChoose = (arr: number[], num: number) => {
    let temp_array = new Array();
    for (let index in arr) {
      if (Object.hasOwn(arr, index)) {
        temp_array.push(arr[index]);
      }
    }
    let return_array = new Array();
    for (let i = 0; i < num; i++) {
      if (temp_array.length > 0) {
        let arrIndex = Math.floor(Math.random() * temp_array.length);
        return_array[i] = temp_array[arrIndex];
        temp_array.splice(arrIndex, 1);
      } else {
        break;
      }
    }
    return return_array;
  };

  const fetchFriendInfos = async (
    userIds: number[],
  ): Promise<(API.UserProfile | null)[]> => {
    return await Promise.all(
      userIds.map((userId) =>
        getqixunUserProfile({ userId: userId }).then((res) => {
          if (res.success) {
            return res.data;
          } else {
            return null;
          }
        }),
      ),
    );
  };

  const fetchGameInfos = async (
    gameIds: string[],
  ): Promise<(API.GameInfo | null)[]> => {
    return await Promise.all(
      gameIds.map((gameId) =>
        getSoloGameInfo({ gameId: gameId }).then((res) => {
          if (res.success) {
            return res.data;
          } else {
            return null;
          }
        }),
      ),
    );
  };

  const autoScroll = () => {
    if (
      sessionStorage.getItem('qixun_annual_page') &&
      sessionStorage.getItem('qixun_annual_data') &&
      sessionStorage.getItem('qixun_annual_time') &&
      new Date().getTime() -
      parseInt(sessionStorage.getItem('qixun_annual_time') ?? '0') <=
      CACHE_EXPIRE &&
      sessionStorage.getItem('qixun_annual_version') === VER
    ) {
      const adat = JSON.parse(sessionStorage.getItem('qixun_annual_data'));
      fetchGameInfos(
        [
          ...adat['goodGames'].map((item) => item.gameId),
          ...adat['maxMinGames'].map((item) => item.gameId),
        ].filter((v) => v),
      ).then((dat) => {
        setDetailInfo(
          Object.fromEntries(
            dat
              .filter((v) => v !== null && v.id !== null)
              .map((game) => [game!.id, game]),
          ),
        );
        setDone(true);
        fetchFriendInfos(randomChoose(adat.newFriends, 3)).then((dat) => {
          setFriends(dat.filter((v) => v !== null));
          if (dat) {
            getqixunUserProfile({ userId: adat['firstFriend'] }).then(
              (dat2) => {
                setFirstFriend(dat2.data);
                setDone2(true);
                setData(adat);
                ref.current?.goTo(
                  parseInt(sessionStorage.getItem('qixun_annual_page') ?? '0'),
                );
              },
            );
          } else {
            setDone2(true);
            setData(adat);
            ref.current?.goTo(
              parseInt(sessionStorage.getItem('qixun_annual_page') ?? '0'),
            );
          }
        });
      });
    } else {
      setScroll(true);
    }
  };

  const fetchData = () => {
    if (!data) {
      setLoading(true);
      getAnnual()
        .then((res) => {
          if (res.success) {
            fetchGameInfos(
              [
                ...res.data.goodGames.map((item) => item.gameId),
                ...res.data.maxMinGames.map((item) => item.gameId),
              ].filter((v) => v),
            ).then((dat) => {
              setDetailInfo(
                Object.fromEntries(
                  dat
                    .filter((v) => v !== null && v.id !== null)
                    .map((game) => [game!.id, game]),
                ),
              );
              setDone(true);
              fetchFriendInfos(randomChoose(res.data.newFriends, 3)).then(
                (dat) => {
                  setFriends(dat.filter((v) => v !== null));
                  if (dat && res.data.firstFriend) {
                    getqixunUserProfile({ userId: res.data.firstFriend }).then(
                      (res2) => {
                        if (res2.success) {
                          setFirstFriend(res2.data);
                          setDone2(true);
                          setData(res.data);
                          sessionStorage.setItem(
                            'qixun_annual_data',
                            JSON.stringify(res.data),
                          );
                          sessionStorage.setItem('qixun_annual_version', VER);
                          sessionStorage.setItem(
                            'qixun_annual_time',
                            new Date().getTime().toString(),
                          );
                        } else {
                          message.error('获取失败');
                        }
                      },
                    );
                  } else {
                    setDone2(true);
                    setData(res.data);
                    sessionStorage.setItem(
                      'qixun_annual_data',
                      JSON.stringify(res.data),
                    );
                    sessionStorage.setItem('qixun_annual_version', VER);
                    sessionStorage.setItem(
                      'qixun_annual_time',
                      new Date().getTime().toString(),
                    );
                  }
                },
              );
            });
          } else message.error('获取失败');
        })
        .finally(() => { });
    } else {
      ref.current?.next();
    }
  };

  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout;

    const handleScroll = (e: WheelEvent) => {
      if (!isScrolling) {
        if (e.deltaY > 0) {
          ref.current?.next();
        } else {
          ref.current?.prev();
        }
        isScrolling = true;
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 200);
    };
    window.addEventListener('wheel', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setBackground(getRandomBackground());
    autoScroll();
    checkAnnual().then((res) => {
      if (res.success) {
        setCheck(res.data);
      }
    });
    setInterval(() => {
      if (new Date().getTime() > 1735660800000) {
        setDisabled(false);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    if (data && scroll) {
      ref.current?.next();
    }
  }, [data]);

  const handlers = useSwipeable({
    onSwipedUp: () => ref.current?.next(),
    onSwipedDown: () => {
      // if (curr > 0) {
      ref.current?.prev();
      // }
    },
    trackMouse: true,
  });

  const formatTime = (time: number) => {
    if (time === -1) return '';
    return moment(time).year() === moment().year()
      ? moment(time).month() === moment().month() &&
        moment(time).date() === moment().date()
        ? moment(time).format('今天 HH:mm')
        : moment(time).format('M月D日')
      : moment(time).format('YYYY年M月D日');
  };

  const getLongestConsecutive = (e: number[]) => {
    let cnt = 1,
      base = 0,
      max_cnt = 1,
      max_base = 0;
    for (let i = 0; i < e.length; i++) {
      if (i > 0) {
        if (e[i - 1] === e[i] - 1) {
          cnt++;
          if (cnt > max_cnt) {
            max_cnt = cnt;
            max_base = base;
          }
        } else {
          cnt = 1;
          base = i + 1;
        }
      }
    }
    return { cnt: max_cnt, base: max_base };
  };

  const getTotalTime = (e: API.ModeTimeItem[]) =>
    e.reduce((sum, item) => sum + item.time, 0);

  const getMoreThan = (e: number) => {
    const percentMap: Map<number, string> = {
      // 453: '99.99%',
      // 381: '99.98%',
      // 336: '99.97%',
      // 310: '99.96%',
      // 273: '99.95%',
      // 255: '99.94%',
      // 237: '99.93%',
      // 222: '99.92%',
      // 214: '99.91%',
      208: '99.9%',
      149: '99.8%',
      122: '99.7%',
      104: '99.6%',
      92: '99.5%',
      82: '99.4%',
      76: '99.3%',
      69: '99.2%',
      64: '99.1%',
      60: '99%',
      36: '98%',
      26: '97%',
      21: '96%',
      18: '95%',
      15: '94%',
      13: '93%',
      12: '92%',
      11: '91%',
      10: '90%',
      7: '85%',
      6: '80%',
      4: '70%',
      3: '60%',
      2: '40%',
    };
    const rankList = [-1, 176805, 287243, 350425, 344365, 442246];
    if (rankList.includes(user?.userId ?? 0)) {
      return (
        <>
          排名{' '}
          <span className={styles.stat}>
            #{rankList.indexOf(user?.userId ?? 0)}
          </span>
        </>
      );
    } else {
      let percentage = 0;
      for (let key of Object.keys(percentMap)
        .map(Number)
        .sort((a, b) => b - a)) {
        if (e >= key) {
          percentage = percentMap[key];
          break;
        }
      }
      if (percentage) {
        return (
          <>
            超过 <span className={styles.stat}>{percentage}</span> 的玩家
          </>
        );
      }
    }
  };

  const getMaxModeItem = (e: API.ModeTimeItem[]) =>
    e.reduce((max, item) => (item.time > max.time ? item : max), {
      mode: '',
      time: -1,
    });

  const getMaxIndex = (e: number[]) => {
    if (e.length === 0) return { max: 0, index: 0 };

    const index = e.reduce(
      (maxIndex, value, i) => (value > e[maxIndex] ? i : maxIndex),
      0,
    );
    return { max: e[index], index };
  };

  const getMissingPeriods = (activityCounts: number[]): string => {
    const missingPeriods: [number, number][] = [];
    let start: number | null = null;

    for (let hour = 0; hour < 24; hour++) {
      if (activityCounts[hour] === 0) {
        if (start === null) start = hour;
      } else if (start !== null) {
        missingPeriods.push([start, hour]);
        start = null;
      }
    }
    if (start !== null) missingPeriods.push([start, 24]);

    const missingPeriodStrings = missingPeriods.map(
      ([start, end]) =>
        `${start.toString().padStart(2, '0')}:00~${end
          .toString()
          .padStart(2, '0')}:00`,
    );
    if (missingPeriodStrings.length === 0) {
      return 'none';
    }
    if (missingPeriodStrings.length > 2) {
      return '';
    } else return missingPeriodStrings.join(' 和 ');
  };

  const getModeName = (e: string) => {
    switch (e) {
      case 'map_country_streak':
        return '题库国家连胜';
      case 'solo':
        return '派对1v1';
      case 'team':
        return '派对组队赛';
      case 'daily_challenge':
        return '每日挑战';
      case 'solo_match':
        return '积分匹配';
      case 'challenge':
        return '题库';
      case 'team_match':
        return '组队匹配';
      case 'province_streak':
        return '省份连胜';
      case 'battle_royale':
        return '派对淘汰赛';
      case 'rank':
        return '派对排位赛';
      default:
        return '未知模式';
    }
  };

  const parseGoodGames = (data: API.SimpleGameItem[]) => {
    const newData = data.map((v) => {
      if (v.gameId) {
        return {
          opponent: detailInfo[v.gameId].teams?.filter(
            (v) => v.teamUsers[0].user.userId !== user?.userId,
          )[0].teamUsers[0].user,
          ratingChange: v.ratingChange,
          gameId: v.gameId,
          gmtCreate: detailInfo[v.gameId].timerStartTime,
          ratingType: detailInfo[v.gameId].china ? 'china' : 'world',
        };
      } else {
        return {
          opponent: null,
          ratingChange: v.ratingChange,
          gameId: v.gameId,
          gmtCreate: null,
          ratingType: 'world',
        };
      }
    });
    newData.sort((a, b) => -a.ratingChange + b.ratingChange);
    return newData;
  };

  const parseMaxMinGames = (data: API.SimpleGameItem2[]) => {
    const newData = data.map((v) => {
      if (v.gameId) {
        return {
          opponent: detailInfo[v.gameId].teams?.filter(
            (v) => v.teamUsers[0].user.userId !== user?.userId,
          )[0].teamUsers[0].user,
          rating: v.rating,
          gameId: v.gameId,
          gmtCreate: detailInfo[v.gameId].timerStartTime,
          ratingType: v.ratingType,
        };
      } else {
        return {
          opponent: null,
          rating: v.rating,
          gameId: v.gameId,
          gmtCreate: null,
          ratingType: 'world',
        };
      }
    });
    newData.sort((a, b) => {
      if (a.ratingType === b.ratingType) {
        return -a.rating + b.rating;
      } else if (a.ratingType === 'world') {
        return -1;
      } else {
        return 1;
      }
    });
    return newData;
  };

  const onClick = (friend: API.UserProfile) => {
    setShowModal(true);
    setChosenFriend(friend);
  };

  return (
    <div {...handlers}>
      <Carousel
        infinite={false}
        vertical
        arrows
        speed={750}
        easing="ease-in-out"
        beforeChange={(cur, nxt) => {
          setCurr(cur);
          if (nxt === 0) {
            ref.current?.goTo(1);
          } else {
            console.log(nxt);
            sessionStorage.setItem('qixun_annual_page', nxt.toString());
          }
        }}
        ref={ref}
      >
        <div className={styles.container}>
          <div className={styles.content}>
            <HeaderLogo canBack={true} className={styles.header} />
            <Card
              loading={loading}
              actions={[
                <Button
                  type="primary"
                  size="large"
                  key="start"
                  onClick={() => {
                    fetchData();
                  }}
                  loading={loading && (!done || !done2)}
                  disabled={disabled}
                >
                  {loading && (!done || !done2) ? (
                    '正在开启中'
                  ) : (
                    <>{disabled ? '暂未开放' : check ? '回顾' : '开启'}</>
                  )}
                </Button>,
              ]}
              style={{ minWidth: 300 }}
            >
              <Card.Meta
                title={
                  <div style={{ fontSize: '32px' }}>
                    棋寻{' '}
                    <span style={{ fontFamily: 'Baloo Bhaina' }}> 2024</span>{' '}
                    年度报告
                  </div>
                }
              />
            </Card>
            <div style={{ fontSize: 10, color: 'gray' }}>
              *点击此按钮代表你同意棋寻调取和保存你的游戏数据
            </div>
          </div>
        </div>
        {data && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span style={{ fontSize: 40, fontFamily: 'Baloo Bhaina' }}>
                {formatTime(data.gmtRegister)}
              </span>
              你加入棋寻大家庭
              <br />
              已陪伴棋寻{' '}
              <div>
                <span className={styles.stat}>
                  {now.diff(moment(data.gmtRegister), 'day')}
                </span>{' '}
                天
              </div>
            </div>
          </div>
        )}
        {data && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span style={{ fontSize: 56 }}>2024年</span>
              <div>
                你游玩棋寻{' '}
                <span className={styles.stat}>{data.activeDays.length}</span> 天
              </div>
              <div>
                从{' '}
                <span style={{ fontSize: 56 }}>
                  {moment('20240101')
                    .add(getLongestConsecutive(data.activeDays).base, 'day')
                    .format('M月D日')}
                </span>{' '}
                开始
              </div>
              <div>
                连续全勤{' '}
                <span className={styles.stat}>
                  {getLongestConsecutive(data.activeDays).cnt}
                </span>{' '}
                天
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span style={{ fontSize: 56 }}>2024年</span>
              你在棋寻度过
              <div>
                <span className={styles.stat}>
                  {getTotalTime(data.modeTime) / 3600000 >= 1
                    ? Math.round(getTotalTime(data.modeTime) / 3600000)
                    : (getTotalTime(data.modeTime) / 3600000).toFixed(1)}
                </span>{' '}
                小时
              </div>
              <div>
                {getMoreThan(getTotalTime(data.modeTime) / 3600000)}
                <br />有{' '}
                <span className={styles.stat}>
                  {getMaxModeItem(data.modeTime).time / 3600000 >= 1
                    ? Math.round(getMaxModeItem(data.modeTime).time / 3600000)
                    : (getMaxModeItem(data.modeTime).time / 3600000).toFixed(1)}
                </span>{' '}
                小时都在玩
              </div>
              <span style={{ fontSize: 56 }}>
                {getModeName(getMaxModeItem(data.modeTime).mode)}
              </span>
              <div>
                占比{' '}
                <span className={styles.stat}>
                  {Math.round(
                    (getMaxModeItem(data.modeTime).time /
                      getTotalTime(data.modeTime)) *
                    100,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span style={{ fontSize: 56 }}>2024年</span>
              你最常出没于
              <div>
                <span className={styles.stat}>
                  {getMaxIndex(data.periodCount).index}~
                  {getMaxIndex(data.periodCount).index + 1}
                </span>{' '}
                点
              </div>
              <br />
              <div style={{ width: '100%', justifySelf: 'center' }}>
                <Bar
                  data={data.periodCount.map((v, i) => ({
                    period: i + ':00~' + (i + 1) + ':00',
                    局数: v,
                  }))}
                  xField="局数"
                  yField="period"
                  style={{ fontSize: 50 }}
                />
              </div>
            </div>
          </div>
        )}
        {data && getMissingPeriods(data.periodCount) && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span style={{ fontSize: 56 }}>2024年</span>
              {getMissingPeriods(data.periodCount) !== 'none' ? (
                <>
                  除了{' '}
                  <span className={styles.stat}>
                    {getMissingPeriods(data.periodCount)}
                  </span>
                  所有时间段都留下了你的身影
                </>
              ) : (
                '每个时间段都留下了你的身影'
              )}
            </div>
          </div>
        )}
        {data &&
          moment(data.gmtLatest).format('M月D日') !==
          moment(data.gmtEarliest).format('M月D日') &&
          moment(data.gmtLatest).format('H:mm').length === 4 &&
          moment(data.gmtEarliest).format('H:mm').length === 4 && (
            <div className={styles.container}>
              <div className={styles.content}>
                <HeaderLogo canBack={true} className={styles.header} />
                {moment(data.gmtLatest).format('M月D日')}
                <br />
                <span className={styles.stat}>
                  {moment(data.gmtLatest).format('H:mm')}
                </span>
                你还在玩棋寻
                <br />
                夜很孤独，棋寻陪你一起度过
                <br />
                <br />
                {moment(data.gmtEarliest).format('M月D日')}
                <span className={styles.stat}>
                  {moment(data.gmtEarliest).format('H:mm')}
                </span>
                你就在玩棋寻了
                <br />
                你一定向寻友道了一声早安
              </div>
            </div>
          )}
        {data && done2 && firstFriend && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span
                style={{
                  fontSize: 40,
                  fontFamily: 'Baloo Bhaina',
                }}
              >
                {formatTime(data.gmtFirstFriend)}
              </span>
              你结交了第一个好友
              <Flex
                justify="center"
                style={{ alignItems: 'center', margin: 16 }}
              >
                <qixunAvatar user={firstFriend} size={56} />
                <span style={{ fontSize: 30 }}>{firstFriend.userName}</span>
              </Flex>
              你们是否还保持着联系？
            </div>
          </div>
        )}
        {data && done2 && data.newFriends.length >= 3 && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span style={{ fontSize: 56 }}>2024年</span>
              <div>
                你新结交{' '}
                <span className={styles.stat}>{data.newFriends.length}</span>{' '}
                个好友
              </div>
              你是否向他们送上了新年祝福？
              <List
                itemLayout="horizontal"
                dataSource={friends}
                style={{
                  // width: '480px',
                  maxWidth: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
                renderItem={(item) => (
                  <List.Item>
                    <div
                      className={styles.friend}
                      onClick={() => onClick(item)}
                      key={item.userId.toString()}
                      style={{ whiteSpace: 'pre' }}
                    >
                      <qixunAvatar user={item} size={48} />{' '}
                      <span style={{ fontSize: 24, marginLeft: 4 }}>
                        {item.userName}
                      </span>
                    </div>
                  </List.Item>
                )}
              ></List>
              <div style={{ fontSize: 16, color: 'gray' }}>*随机选取</div>
            </div>
          </div>
        )}

        {data &&
          done &&
          data.maxMinGames.length >= 4 &&
          parseMaxMinGames(data.maxMinGames)[0].rating > 1500 && (
            <div className={styles.container}>
              <div className={styles.content}>
                <HeaderLogo canBack={true} className={styles.header} />
                <span style={{ fontSize: 56 }}>2024年</span>
                全球积分进入第三年
                <br />
                你共游玩全球积分
                <div>
                  <span className={styles.stat}>{data.worldRatingCount}</span>{' '}
                  局
                </div>
                <span style={{ fontSize: 40 }}>
                  {formatTime(
                    parseMaxMinGames(data.maxMinGames)[0].gmtCreate ?? -1,
                  )}
                </span>
                {parseMaxMinGames(data.maxMinGames)[0].opponent ? (
                  <Flex justify="center" style={{ alignItems: 'center' }}>
                    你战胜
                    <qixunAvatar
                      user={parseMaxMinGames(data.maxMinGames)[0].opponent!}
                      size={56}
                    />
                    <span style={{ fontSize: 30 }}>
                      {parseMaxMinGames(data.maxMinGames)[0].opponent!.userName}
                    </span>
                  </Flex>
                ) : (
                  '你赢下一轮积分赛'
                )}
                <div>
                  全球积分达{' '}
                  <span className={styles.stat}>
                    {parseMaxMinGames(data.maxMinGames)[0].rating}
                  </span>
                </div>
                {parseMaxMinGames(data.maxMinGames)[0].opponent && (
                  <Card
                    hoverable
                    onClick={() =>
                      navigator(
                        '/replay?gameId=' +
                        parseMaxMinGames(data.maxMinGames)[0].gameId,
                      )
                    }
                    size="small"
                    style={{
                      marginTop: 16,
                      background: 'inherit',
                      padding: 0,
                      textAlign: 'center',
                      fontSize: '1rem',
                      alignContent: 'center',
                    }}
                  >
                    回顾对局
                  </Card>
                )}
              </div>
            </div>
          )}
        {data &&
          done &&
          data.maxMinGames.length >= 4 &&
          parseMaxMinGames(data.maxMinGames)[2].rating > 1500 && (
            <div className={styles.container}>
              <div className={styles.content}>
                <HeaderLogo canBack={true} className={styles.header} />
                <span style={{ fontSize: 56 }}>2024年</span>
                中国积分全新上线
                <br />
                你共游玩中国积分
                <div>
                  <span className={styles.stat}>{data.chinaRatingCount}</span>{' '}
                  局
                </div>
                <span style={{ fontSize: 40 }}>
                  {formatTime(
                    parseMaxMinGames(data.maxMinGames)[2].gmtCreate ?? -1,
                  )}
                </span>
                <Flex justify="center" style={{ alignItems: 'center' }}>
                  你战胜
                  <qixunAvatar
                    user={parseMaxMinGames(data.maxMinGames)[2].opponent!}
                    size={50}
                  />
                  <span style={{ fontSize: 30 }}>
                    {parseMaxMinGames(data.maxMinGames)[2].opponent!.userName}
                  </span>
                </Flex>
                <div>
                  中国积分达{' '}
                  <span className={styles.stat}>
                    {parseMaxMinGames(data.maxMinGames)[2].rating}
                  </span>
                </div>
                {parseMaxMinGames(data.maxMinGames)[2].opponent && (
                  <Card
                    hoverable
                    onClick={() =>
                      navigator(
                        '/replay?gameId=' +
                        parseMaxMinGames(data.maxMinGames)[2].gameId,
                      )
                    }
                    size="small"
                    style={{
                      marginTop: 16,
                      background: 'inherit',
                      padding: 0,
                      textAlign: 'center',
                      fontSize: '1rem',
                      alignContent: 'center',
                    }}
                  >
                    回顾对局
                  </Card>
                )}
              </div>
            </div>
          )}
        {data && data.gmtBestAchievement && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              <span style={{ fontSize: 56 }}>2024年</span>
              成就系统全新上线
              <span style={{ fontSize: 40 }}>
                {formatTime(data.gmtBestAchievement)}
              </span>
              <div>你{data.bestAchievement.task}</div>
              <div>
                获得{' '}
                <span style={{ fontSize: 40, textShadow: '1px 0 10px' }}>
                  {data.bestAchievement.name}
                </span>{' '}
                成就
              </div>
              <div>
                成为第{' '}
                <span
                  style={{
                    fontSize: 56,
                    fontFamily: 'Baloo Bhaina',
                  }}
                >
                  {data.bestAchievementRank}
                </span>{' '}
                位获得该成就的玩家
              </div>
              <Card
                hoverable
                onClick={() => navigator('/achievement')}
                size="small"
                style={{
                  marginTop: 16,
                  background: 'inherit',
                  padding: 0,
                  textAlign: 'center',
                  fontSize: '1rem',
                  alignContent: 'center',
                }}
              >
                查看所有成就
              </Card>
            </div>
          </div>
        )}
        {data &&
          done &&
          data.goodGames.length >= 2 &&
          parseGoodGames(data.goodGames)[1].ratingChange < 0 && (
            <div className={styles.container}>
              <div className={styles.content}>
                <HeaderLogo canBack={true} className={styles.header} />
                <span style={{ fontSize: 56 }}>2024年</span>
                <div>
                  在{' '}
                  <span style={{ fontSize: 40 }}>
                    {formatTime(
                      parseGoodGames(data.goodGames)[1].gmtCreate ?? -1,
                    )}
                  </span>
                </div>
                {parseGoodGames(data.goodGames)[1].gameId ? (
                  <Flex justify="center" style={{ alignItems: 'center' }}>
                    你败给
                    <qixunAvatar
                      user={parseGoodGames(data.goodGames)[1].opponent!}
                      size={56}
                    />
                    <span style={{ fontSize: 30 }}>
                      {parseGoodGames(data.goodGames)[1].opponent!.userName}
                    </span>
                  </Flex>
                ) : (
                  '你输掉一轮积分赛'
                )}
                <div>
                  失去{' '}
                  <span className={styles.stat}>
                    {Math.abs(parseGoodGames(data.goodGames)[1].ratingChange)}
                  </span>{' '}
                  {parseGoodGames(data.goodGames)[1].ratingType === 'world'
                    ? '全球'
                    : '中国'}
                  积分
                </div>
                那一刻，你是否感到遗憾？
                {parseGoodGames(data.goodGames)[1].opponent && (
                  <Card
                    hoverable
                    onClick={() =>
                      navigator(
                        '/replay?gameId=' +
                        parseGoodGames(data.goodGames)[1].gameId,
                      )
                    }
                    size="small"
                    style={{
                      marginTop: 16,
                      background: 'inherit',
                      padding: 0,
                      textAlign: 'center',
                      fontSize: '1rem',
                      alignContent: 'center',
                    }}
                  >
                    回顾对局
                  </Card>
                )}
              </div>
            </div>
          )}
        {data &&
          done &&
          data.goodGames.length >= 2 &&
          parseGoodGames(data.goodGames)[0].ratingChange > 0 && (
            <div className={styles.container}>
              <div className={styles.content}>
                <HeaderLogo canBack={true} className={styles.header} />
                <span style={{ fontSize: 56 }}>2024年</span>
                <div>
                  在{' '}
                  <span style={{ fontSize: 40 }}>
                    {formatTime(
                      parseGoodGames(data.goodGames)[0].gmtCreate ?? -1,
                    )}
                  </span>
                </div>
                {parseGoodGames(data.goodGames)[0].gameId ? (
                  <Flex justify="center" style={{ alignItems: 'center' }}>
                    你赢下
                    <qixunAvatar
                      user={parseGoodGames(data.goodGames)[0].opponent!}
                      size={56}
                    />
                    <span style={{ fontSize: 30 }}>
                      {parseGoodGames(data.goodGames)[0].opponent!.userName}
                    </span>
                  </Flex>
                ) : (
                  '你赢下一轮积分赛'
                )}
                <div>
                  获得{' '}
                  <span className={styles.stat}>
                    {Math.abs(parseGoodGames(data.goodGames)[0].ratingChange)}
                  </span>{' '}
                  {parseGoodGames(data.goodGames)[0].ratingType === 'world'
                    ? '全球'
                    : '中国'}
                  积分
                </div>
                那一刻，你是否感到兴奋？
                {parseGoodGames(data.goodGames)[0].opponent && (
                  <Card
                    hoverable
                    onClick={() =>
                      navigator(
                        '/replay?gameId=' +
                        parseGoodGames(data.goodGames)[0].gameId,
                      )
                    }
                    size="small"
                    style={{
                      marginTop: 16,
                      background: 'inherit',
                      padding: 0,
                      textAlign: 'center',
                      fontSize: '1rem',
                      alignContent: 'center',
                    }}
                  >
                    回顾对局
                  </Card>
                )}
              </div>
            </div>
          )}
        {data && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              无论懊悔还是惊喜
              <br />
              棋寻始终伴你身旁
              <br />
              2024年，棋寻还推出了
              <br />
              <Card
                hoverable
                onClick={() => navigator('/interact')}
                size="small"
                style={{
                  margin: 8,
                  background: 'inherit',
                  padding: 0,
                  textAlign: 'center',
                  fontSize: '1rem',
                  alignContent: 'center',
                }}
              >
                互动
              </Card>
              <Card
                hoverable
                onClick={() => navigator('/interact/challenge')}
                size="small"
                style={{
                  margin: 8,
                  background: 'inherit',
                  padding: 0,
                  textAlign: 'center',
                  fontSize: '1rem',
                  alignContent: 'center',
                }}
              >
                网络迷踪
              </Card>
              <Card
                hoverable
                onClick={() => navigator('/match?tab=team')}
                size="small"
                style={{
                  margin: 8,
                  background: 'inherit',
                  padding: 0,
                  textAlign: 'center',
                  fontSize: '1rem',
                  alignContent: 'center',
                }}
              >
                娱乐匹配(中国)
              </Card>
              等功能
              <br />
              希望能继续带给你放松
            </div>
          </div>
        )}
        {data && (
          <div className={styles.container}>
            <div className={styles.content}>
              <HeaderLogo canBack={true} className={styles.header} />
              2025已经到来
              <br />
              回望过去，展望未来
              <br />
              新的一年，让我们继续一同
              <br />
              <br />
              <div
                style={{ textAlign: 'center', fontSize: 48, whiteSpace: 'pre' }}
              >
                「以棋会友」
              </div>
              <br />
              <Button
                type="text"
                icon={<FileImageOutlined />}
                onClick={() => {
                  setGenLoading(true);
                  setTimeout(() => {
                    ref.current?.next();
                    setGenLoading(false);
                  }, 1500);
                }}
                size="large"
                loading={genLoading}
              >
                生成年度海报
              </Button>
            </div>
          </div>
        )}
        {data && user && (
          <div className={styles.container}>
            <div className={styles.content} ref={pageRef}>
              {loaded && background && (
                <Panorama
                  round={background}
                  ref={panoRef}
                  useProp={true}
                ></Panorama>
              )}
              <HeaderLogo
                canBack={true}
                className={styles.header}
                useAlt={true}
              />
              {/* temporary workaround for svg rendering*/}
              <div
                style={{
                  // textShadow: '',
                  // backdropFilter: 'blur(0.25rem)',
                  // paddingTop: 32,
                  // paddingBottom: 32,
                  textShadow: '1px 0px 10px currentColor, 1px 1px 0px black',
                  // paddingTop: '32px',
                  paddingBottom: '32px',
                  // borderRadius: '32px',
                }}
              >
                <ConfigProvider
                  theme={{
                    components: {
                      Statistic: {
                        contentFontSize: 26,
                        titleFontSize: 16,
                      },
                    },
                  }}
                >
                  <Row>
                    <Col span={24}>
                      <Flex justify="center" style={{ alignItems: 'center' }}>
                        <qixunAvatar user={user} size={56} />
                        <Flex vertical gap={0}>
                          <span style={{ fontSize: 30 }}>{user.userName}</span>
                          <span style={{ fontSize: 16, color: 'grey' }}>
                            uid: {user.userId}
                          </span>
                        </Flex>
                      </Flex>
                      <div style={{ height: 36 }}></div>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={12}>
                      <Statistic
                        title="注册时间"
                        style={{ marginBottom: 16 }}
                        value={moment(data.gmtRegister).format('YYYY/M/D')}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="活跃天数"
                        style={{ marginBottom: 16 }}
                        value={data.activeDays.length}
                        suffix="天"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col span={12}>
                      <Statistic
                        title="游戏时长"
                        style={{ marginBottom: 16 }}
                        value={Math.round(
                          getTotalTime(data.modeTime) / 3600000,
                        )}
                        suffix="小时"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="最爱模式"
                        style={{ marginBottom: 16 }}
                        value={getModeName(getMaxModeItem(data.modeTime).mode)}
                      />
                    </Col>
                  </Row>
                  {parseMaxMinGames(data.maxMinGames).length === 4 && (
                    <Row>
                      <Col span={12}>
                        <Statistic
                          title="最高中国积分"
                          style={{ marginBottom: 16 }}
                          value={
                            parseMaxMinGames(data.maxMinGames) &&
                              parseMaxMinGames(data.maxMinGames).length === 4
                              ? Math.max(
                                1500,
                                parseMaxMinGames(data.maxMinGames)[2].rating,
                              )
                              : 1500
                          }
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="最高全球积分"
                          style={{ marginBottom: 16 }}
                          value={
                            parseMaxMinGames(data.maxMinGames) &&
                              parseMaxMinGames(data.maxMinGames).length === 4
                              ? Math.max(
                                1500,
                                parseMaxMinGames(data.maxMinGames)[0].rating,
                              )
                              : 1500
                          }
                        />
                      </Col>
                    </Row>
                  )}
                  <Row>
                    <Col span={24} style={{ fontSize: 20 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginTop: 16,
                        }}
                      >
                        <Flex align="center">
                          <QRCode value="https://saiyuan.top/2024" size={100} />
                          <div style={{ width: 16 }}></div>
                          <Flex vertical>
                            <span>棋寻2024年度报告</span>
                            <span style={{ fontSize: 16, color: 'lightgrey' }}>
                              https://saiyuan.top/2024
                            </span>
                          </Flex>
                        </Flex>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24} style={{ fontSize: 16 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginTop: 64,
                          color: 'white',
                          // textShadow: '1px 0px 10px',
                        }}
                      >
                        {background?.desc}
                      </div>
                    </Col>
                  </Row>
                </ConfigProvider>
              </div>
              <Flex
                align="center"
                justify="center"
                data-html2canvas-ignore="true"
              >
                <Button
                  type="text"
                  icon={<CaretUpOutlined />}
                  onClick={() => {
                    ref.current?.goTo(1);
                  }}
                >
                  再看一遍
                </Button>
                <Button
                  type="text"
                  icon={<RedoOutlined />}
                  onClick={() => {
                    setBackgroundLoading(true);
                    setBackground(getRandomBackground());
                    setTimeout(() => {
                      setBackgroundLoading(false);
                    }, 1000);
                  }}
                  loading={backgroundLoading}
                >
                  换背景
                </Button>
                <Popconfirm
                  title="保存海报"
                  description="建议使用电脑端浏览器下载, 否则可能会有黑屏或错位问题"
                  okText="继续保存"
                  cancelText="取消"
                  onConfirm={() => {
                    handleScreenshot();
                  }}
                >
                  <Button
                    type="text"
                    icon={<CloudDownloadOutlined />}
                    loading={saveLoading}
                  >
                    保存海报
                  </Button>
                </Popconfirm>
              </Flex>
            </div>
          </div>
        )}
      </Carousel>
      <SendMessageModal
        open={showModal}
        friend={chosenFriend}
        onClose={() => {
          setShowModal(false);
          ref.current?.next();
        }}
        defaultMessage={
          '2025新年快乐！来棋寻看年度报告：https://saiyuan.top/2024'
        }
      />
    </div>
  );
};

export default Year2024;
