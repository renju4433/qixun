import InteractComment from '@/components/Interact/Comment';
import LngLatCvtTip from '@/components/Interact/LngLatCvtTip';
import MapContainer from '@/components/Map/MapContainer';
import qixunAvatar from '@/components/User/qixunAvatar';
import {
  deleteQuestion,
  lngLatCvt,
  postChallengeSubmit,
  submitDistance,
} from '@/services/api';
import {
  CaretDownOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  QuestionOutlined,
  RightOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { BulbOutlined } from '@ant-design/icons';
import { Link } from '@umijs/max';
import { Button, Image, Input, message, Modal } from 'antd';
import copy from 'copy-to-clipboard';
import { LngLat } from 'maplibre-gl';
import { FC, useEffect, useState } from 'react';
import { Layer, Marker, Source, useMap } from 'react-map-gl/maplibre';
import styles from './style.less';

type InteractQuestionParams = {
  question: API.QuestionParams;
  type: string;
  postId: number;
  postUser: API.UserProfile;
  postCommentCount: number;
  userId?: number;
  success?: boolean | null;
  canDelete?: boolean;
  done: () => void;
};

const InteractQuestion: FC<InteractQuestionParams> = ({
  question,
  type,
  done,
  postId,
  postUser,
  postCommentCount,
  userId,
  success,
  canDelete,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [chooseLocations, setChooseLocations] = useState<Array<LngLat | null>>(
    new Array(question.items.length).fill(null),
  );
  const [confirm, setConfirm] = useState<boolean[]>(
    new Array(question.items.length).fill(false),
  );
  const [commentVisible, setCommentVisible] = useState<boolean>(false);
  const [lngLatInputVisible, setLngLatInputVisible] = useState<boolean>(false);
  const [lngLatQuickInput, setLngLatQuickInput] = useState<string>('');
  const [lngLatQuickInputTipVisible, setLngLatQuickInputTipVisible] =
    useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const { map } = useMap();
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  useEffect(() => {
    if (
      chooseLocations[currentImageIndex] &&
      confirm[currentImageIndex] &&
      type !== 'challenge'
    ) {
      map?.fitBounds(
        [
          [
            chooseLocations[currentImageIndex]!.lng,
            chooseLocations[currentImageIndex]!.lat,
          ],
          [
            question.items[currentImageIndex].lng,
            question.items[currentImageIndex].lat,
          ],
        ],
        {
          padding: 100,
          duration: 500,
        },
      );
    }
  }, [chooseLocations, confirm, currentImageIndex, map, question.items]);

  function distance(lat1: number, lat2: number, lon1: number, lon2: number) {
    const el1 = 0;
    const el2 = 0;

    const R = 6371; // Radius of the earth in km

    const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

    let latDistance = toRadians(lat2 - lat1);
    let lonDistance = toRadians(lon2 - lon1);
    let a =
      Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(lonDistance / 2) *
      Math.sin(lonDistance / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distance = R * c * 1000; // convert to meters

    let height = el1 - el2;

    distance = Math.pow(distance, 2) + Math.pow(height, 2);

    return Math.sqrt(distance) / 1000;
  }

  const handleNextImage = () => {
    if (currentImageIndex < question.items.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleConfirm = () => {
    if (chooseLocations[currentImageIndex]) {
      const updatedConfirm = [...confirm];
      updatedConfirm[currentImageIndex] = true;
      setConfirm(updatedConfirm);

      const location = chooseLocations[currentImageIndex];

      if (type === 'challenge') {
        postChallengeSubmit({
          postId: postId,
          lat: location?.lat,
          lng: location?.lng,
        }).then((res) => {
          if (res.data.success) {
            message.success('挑战成功, 请评论区留下思路～');
          } else {
            //reset map
            setChooseLocations([]);
            setConfirm([false]);

            message.warning('挑战失败');
          }
        });
      } else {
        const totalDistance = distance(
          location!.lat,
          question.items[currentImageIndex].lat,
          location!.lng,
          question.items[currentImageIndex].lng,
        );

        submitDistance({
          postId: postId,
          distance: totalDistance,
        });

        if (confirm[currentImageIndex]) {
          handleNextImage();
        }
      }
    } else {
      message.warning('请在地图选择当前图片的地点');
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (commentVisible || lngLatInputVisible) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentImageIndex,
    chooseLocations,
    confirm,
    commentVisible,
    lngLatInputVisible,
  ]);

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const makeCircle = (lng: number, lat: number, radiusInKm: number) => {
    const points = 64;
    const coords = [];
    const distanceX = radiusInKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    const distanceY = radiusInKm / 110.574;

    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const radians = (angle * Math.PI) / 180;
      coords.push([
        lng + distanceX * Math.cos(radians),
        lat + distanceY * Math.sin(radians),
      ]);
    }
    coords.push(coords[0]); // 结束闭合

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    };
  };

  const handleDeleteQuestion = async (postId: number) => {
    // 需要二次确认
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该题目吗？',
      onOk: async () => {
        const res = await deleteQuestion({ postId: postId });
        if (res.success) {
          message.success('删除成功');
          done();
        } else {
          message.error('删除失败，请检查网络或联系管理员');
        }
      },
    });
  };

  /**
   * 经度, 纬度 / 地图url 转化为 经度 和 纬度
   */
  function lngLatQuickInputCvt() {
    let str: string = lngLatQuickInput.trim();
    if (!str) {
      void message.error('不支持的格式！');
      return;
    }
    lngLatCvt({
      content: str,
    }).then((res) => {
      let data = res.data;
      if (!data.lng || !data.lat) {
        void message.error('不支持的格式！');
        return;
      }
      setManualLng(data.lng);
      setManualLat(data.lat);
      void message.success('转换成功！');
    });
  }

  return (
    <div className={styles.question}>
      <div className={styles.mapContainer}>
        <div className={styles.splitContainer}>
          <Image
            wrapperClassName={styles.image}
            style={{ height: '100%', width: '100%', objectFit: 'contain' }}
            src={`https://b68v.daai.fun/${question.items[currentImageIndex].path}`}
            preview={{ mask: false }}
          />
          {question.items && question.items.length > 1 && (
            <span className={styles.imageIndex} style={{ textAlign: 'center' }}>
              {currentImageIndex + 1} / {question.items.length}
            </span>
          )}
          <div className={styles.map}>
            <MapContainer
              cursor="crosshair"
              onClick={(e) => {
                if (!confirm[currentImageIndex]) {
                  const updatedChooseLocations = [...chooseLocations];
                  updatedChooseLocations[currentImageIndex] = e.lngLat;
                  setChooseLocations(updatedChooseLocations);
                }
              }}
            >
              {/*<Marker*/}
              {/*  latitude={28.684114}*/}
              {/*  longitude={115.875394}*/}
              {/*  color="yellow"*/}
              {/*/>*/}
              {chooseLocations[currentImageIndex] && (
                <Marker
                  latitude={chooseLocations[currentImageIndex]!.lat}
                  longitude={chooseLocations[currentImageIndex]!.lng}
                />
              )}
              {((confirm[currentImageIndex] && type !== 'challenge') ||
                showAnswer) && (
                  <Marker
                    latitude={question.items[currentImageIndex].lat}
                    longitude={question.items[currentImageIndex].lng}
                    color="yellow"
                  />
                )}
              {chooseLocations[currentImageIndex] && (
                <Source
                  id="selected-location-circle"
                  type="geojson"
                  data={makeCircle(
                    chooseLocations[currentImageIndex]!.lng,
                    chooseLocations[currentImageIndex]!.lat,
                    question.distance / 1000,
                  )}
                >
                  <Layer
                    id="circle-layer"
                    type="fill"
                    paint={{
                      'fill-color': '#00f',
                      'fill-opacity': 0.2,
                    }}
                  />
                </Source>
              )}
            </MapContainer>
          </div>
        </div>
        <div className={styles.controls}>
          <Button onClick={done}>返回</Button>

          {/*分享*/}
          <Button
            onClick={() => {
              let shareUrl =
                type === 'challenge'
                  ? window.location.origin + '/interact/challenge?id=' + postId
                  : window.location.origin + '/interact?id=' + postId;
              copy(shareUrl);
              void message.success('已复制链接！');
            }}
            icon={<ShareAltOutlined />}
          >
            {'分享'}
          </Button>

          {/*评论Button*/}
          <Button
            onClick={() => {
              setCommentVisible(true);
            }}
            icon={<CommentOutlined />}
          >
            {' ' + postCommentCount}
          </Button>

          {/*坐标输入Button*/}
          {!success && question.distance && (
            <Button
              onClick={() => {
                setLngLatQuickInput('');
                if (chooseLocations[0]?.lng && chooseLocations[0].lat) {
                  setManualLng('' + chooseLocations[0].lng.toFixed(6));
                  setManualLat('' + chooseLocations[0].lat.toFixed(6));
                } else {
                  setManualLng('');
                  setManualLat('');
                }
                setLngLatInputVisible(true);
              }}
              icon={<EnvironmentOutlined />}
            >
              {'坐标'}
            </Button>
          )}

          {question.items && question.items.length > 1 && (
            <>
              <div className={styles.iconControls}>
                <Button
                  onClick={handlePreviousImage}
                  shape="round"
                  disabled={currentImageIndex === 0}
                >
                  <LeftOutlined />
                </Button>
                <Button
                  onClick={handleNextImage}
                  shape="round"
                  disabled={
                    !confirm[currentImageIndex] ||
                    currentImageIndex >= question.items.length - 1
                  }
                >
                  <RightOutlined />
                </Button>
              </div>
              <div className={styles.textControls}>
                <Button
                  onClick={handlePreviousImage}
                  disabled={currentImageIndex === 0}
                >
                  上一题
                </Button>
                <span style={{ margin: '0 1rem' }}>
                  {currentImageIndex + 1} / {question.items.length}
                </span>
                <Button
                  onClick={handleNextImage}
                  disabled={
                    !confirm[currentImageIndex] ||
                    currentImageIndex >= question.items.length - 1
                  }
                >
                  下一题
                </Button>
              </div>
            </>
          )}
          {success && (
            <Button type="default" onClick={() => setShowAnswer(true)}>
              查看答案
            </Button>
          )}

          {!success && (
            <Button
              type={chooseLocations[currentImageIndex] ? 'primary' : 'default'}
              onClick={handleConfirm}
              disabled={
                confirm[currentImageIndex] ||
                chooseLocations[currentImageIndex] === null
              }
            >
              确定
            </Button>
          )}

          {canDelete && (
            <Button danger onClick={() => handleDeleteQuestion(postId)}>
              删除
            </Button>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          {question.distance
            ? question.distance + 'm挑战，每次确定需要2宝石（会员1宝石）'
            : '每次确定需要1宝石（会员免费）'}
        </div>

        {/*用户信息*/}
        <Link
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#dcdcdc',
            justifyContent: 'center',
          }}
          to={`/user/${postUser.userId}`}
        >
          <qixunAvatar user={postUser} size={30} />
          {postUser.userName}
        </Link>

        {commentVisible && (
          <Modal
            open={commentVisible}
            onCancel={() => setCommentVisible(false)}
            footer={null}
            title="评论"
          >
            <InteractComment postId={postId} userId={userId}></InteractComment>
          </Modal>
        )}

        {/*输入坐标地图跳转*/}
        {lngLatInputVisible && (
          <Modal
            title="经纬度"
            open={lngLatInputVisible}
            onCancel={() => setLngLatInputVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setLngLatInputVisible(false)}>
                取消
              </Button>,
              <Button
                key="save"
                type="primary"
                onClick={() => {
                  if (manualLat && manualLng) {
                    let lng = Number(manualLng);
                    let lat = Number(manualLat);
                    if (
                      isNaN(lng) ||
                      isNaN(lat) ||
                      lng < -180 ||
                      lng > 180 ||
                      lat < -90 ||
                      lat > 90
                    ) {
                      void message.error('请输入有效的坐标');
                      return;
                    }

                    let updatedChooseLocations = [new LngLat(lng, lat)];
                    setChooseLocations(updatedChooseLocations);
                    if (map) {
                      map.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                      });
                    }
                    setLngLatInputVisible(false);
                  } else {
                    void message.error('请输入有效的坐标');
                  }
                }}
                disabled={!manualLat || !manualLng}
              >
                跳转
              </Button>,
            ]}
          >
            <Input
              addonBefore="快捷输入"
              placeholder="经度, 纬度 / 地图链接 等"
              value={lngLatQuickInput}
              onChange={(e) => setLngLatQuickInput(e.target.value)}
            />
            <div className={styles.lngLatInputControls}>
              <span></span>
              <Button
                type="primary"
                onClick={() => {
                  lngLatQuickInputCvt();
                }}
                icon={<CaretDownOutlined />}
              >
                转换
              </Button>
              <Button
                onClick={() => {
                  setLngLatQuickInputTipVisible(true);
                }}
                icon={<QuestionOutlined />}
              >
                说明
              </Button>
            </div>
            <Input
              addonBefore="经度"
              placeholder="请输入经度"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
            />
            <Input
              addonBefore="纬度"
              placeholder="请输入纬度"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
            />
            <span className={styles.tip}>
              <BulbOutlined /> 使用 GCJ-02 火星坐标系
            </span>
          </Modal>
        )}

        {/*快捷输入 使用说明*/}
        {lngLatQuickInputTipVisible && (
          <Modal
            title="快捷输入 使用说明"
            open={lngLatQuickInputTipVisible}
            onCancel={() => setLngLatQuickInputTipVisible(false)}
            footer={[
              <Button
                type="primary"
                onClick={() => {
                  setLngLatQuickInputTipVisible(false);
                }}
              >
                关闭
              </Button>,
            ]}
          >
            <LngLatCvtTip />
          </Modal>
        )}
      </div>
    </div>
  );
};
export default InteractQuestion;
