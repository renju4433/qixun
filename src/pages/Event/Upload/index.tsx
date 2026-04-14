import { baseURL, CFMapTile } from '@/constants';
import NormalPage from '@/pages/NormalPage';
import {
  addEventRequest,
  checkCanUploadWithoutLatLng,
  deleteEvent,
  eventPublish,
  getEventInfo,
} from '@/services/api';
import { useParams } from '@@/exports';
import { UploadOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  Button,
  Image,
  message,
  Modal,
  Popconfirm,
  Upload,
  UploadProps,
} from 'antd';
import mapboxgl, { Marker } from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import styles from './style.less';

const EventUpload = () => {
  const { id } = useParams();
  let marker = useRef<Marker | null>();
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

  const [selfMarker, setSelfMarker] = useState<Marker | null>();
  const [choosing, setChoosing] = useState<boolean>(false);
  const [imageName, setImageName] = useState<string | null>();
  const [eventInfo, setEventInfo] = useState<API.Finder | null>();
  const [showLocation, setShowLoaction] = useState<boolean>(false);
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [canUploadWithoutLatLng, setCanUploadWithoutLatLng] =
    useState<boolean>();

  const solveData = (data: API.Finder) => {
    setEventInfo(data);

    if (data.lat) setLat(data.lat.toString());
    else setLat('');

    if (data.lng) setLng(data.lng.toString());
    else setLng('');

    setImageName(data.img);
    if (data.img) setShowLoaction(true);
  };

  function check() {
    checkCanUploadWithoutLatLng().then((res) => {
      if (res.success) setCanUploadWithoutLatLng(res.data);
    });
  }

  const getEvent = () => {
    getEventInfo({ id: id ? parseInt(id) : eventInfo!.id! }).then((res) => {
      if (res.success) solveData(res.data);
    });
  };

  const addEvent = () => {
    addEventRequest().then((res) => {
      if (res.success) solveData(res.data);
    });
  };

  const props: UploadProps = {
    name: 'file',
    action: `${baseURL}/v0/finder/upload_image`,
    data(file) {
      return { id: eventInfo?.id, fileName: file.name };
    },

    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        if (info.file.response.errorCode) {
          console.log(info.file.response);
          message.error(info.file.response.errorMessage);
        } else setImageName(info.file.response.data);

        getEvent();
      } else if (info.file.status === 'error') {
        message.error(`上传失败`);
      }
    },
  };

  useEffect(() => {
    check();
    if (id) getEvent();
    else addEvent();
  }, []);

  const mapContainer = useRef(null);
  let map = useRef<mapboxgl.Map | null>(null);
  const url = CFMapTile;
  const tileSize = 512;

  const addMarker = (lng: number, lat: number) => {
    const popup = new mapboxgl.Popup().setHTML(
      '<div style="color: black">' +
        lng.toFixed(7) +
        ', ' +
        lat.toFixed(7) +
        '</div>',
    );
    if (marker.current) marker.current?.remove();

    marker.current = new mapboxgl.Marker({ color: '#FFD326' })
      .setLngLat([lng, lat])
      .addTo(map.current!);
    marker.current?.setPopup(popup);
    marker.current?.togglePopup();
    setSelfMarker(marker.current!);
  };

  const initMap = () => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      attributionControl: false,
      // style: 'mapbox://styles/mapbox/streets-v11', // style URL
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [url],
            tileSize: tileSize,
          },
        },
        layers: [
          { id: 'simple-tiles', type: 'raster', source: 'raster-tiles' },
        ],
      },
      center: [106.0, 38.0],
      zoom: 2, // starting zoom
      minZoom: 1,
      maxZoom: 17,
      dragRotate: false,
    }).addControl(
      new mapboxgl.AttributionControl({
        compact: false,
        customAttribution: '华为地图',
      }),
      'bottom-right',
    );

    map.current.on('load', () => {
      const logoElement = document.getElementsByClassName(
        'mapboxgl-ctrl-logo',
      )[0] as HTMLElement;
      if (logoElement) {
        logoElement.style.display = 'none';
      }
    });
    map.current?.on('click', (e) => addMarker(e.lngLat.lng, e.lngLat.lat));
  };

  const [showExif, setShowExif] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  return (
    <>
      {!choosing && (
        <NormalPage>
          <div className={styles.wrapper}>
            <h2 className={styles.title}>{id ? '投稿修改' : '寻景投稿'}</h2>
            <div className={styles.hint}>
              <p>
                目前只支持上传携带
                <a onClick={() => setShowExif(true)}>位置信息</a>
                的图片。
                <a onClick={() => setShowGuide(true)}>为什么需要位置信息？</a>
              </p>
              <p>
                推荐上传自己旅行拍摄的照片（不能是家周边环境），尽量不上传网图。
              </p>
              <p>禁止上传含有敏感信息的违规内容，违者会被封号。</p>
              <p>
                手机照片可以
                <a href={'https://saiyuan.top/app'}>下载App</a>上传
              </p>
              {!canUploadWithoutLatLng && (
                <p>
                  上传100张有EXIF信息的图片以后，才允许对无EXIF的图片进行坐标标注
                </p>
              )}
              {canUploadWithoutLatLng && (
                <p>
                  你已上传超过100张图片，允许上传无EXIF的图片进行坐标标注后发布
                </p>
              )}
            </div>

            <div className={styles.imageContainer}>
              {imageName && (
                <Image
                  className={styles.image}
                  src={`https://b68v.daai.fun/${imageName}?x-oss-process=image/resize,h_200`}
                />
              )}
              {!imageName && <div className={styles.image}></div>}
            </div>
            {!id && (
              <div className={styles.upload}>
                <Upload {...props}>
                  <Button icon={<UploadOutlined />}>点击上传</Button>
                </Upload>
              </div>
            )}

            {showLocation && (
              <div className={styles.location}>
                <div className={styles.title}> </div>
                <Button
                  onClick={() => {
                    setChoosing(true);
                    window.setTimeout(initMap, 200);
                  }}
                >
                  地图选点
                </Button>
                <div className={styles.subTitle}>经度: {lng}</div>
                <div className={styles.subTitle}>纬度: {lat}</div>

                <div className={styles.publishContainer}>
                  <Button
                    onClick={() => {
                      eventPublish({ id: eventInfo!.id!, lat, lng }).then(
                        (res) => {
                          if (res.success) {
                            history.push('/event/user/' + res.data.userId);
                          }
                        },
                      );
                    }}
                    className={styles.publish}
                    type="primary"
                  >
                    发布
                  </Button>

                  <Popconfirm
                    title="删除投稿？"
                    description="你确认要删除吗?"
                    onConfirm={() => {
                      deleteEvent({ id: eventInfo!.id! }).then((res) => {
                        if (res.success) {
                          history.push('/event/user/' + eventInfo!.user.userId);
                        }
                      });
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button style={{ marginLeft: '1rem' }} type="dashed" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )}
          </div>
        </NormalPage>
      )}

      <div
        className={styles.mapPicker}
        style={choosing ? { display: '' } : { display: 'none' }}
      >
        <div ref={mapContainer} className={styles.map}></div>
        <div className={styles.leftButtonContainer}>
          {selfMarker && (
            <Button
              type="primary"
              onClick={() => {
                setLat(selfMarker?.getLngLat().lat.toString());
                setLng(selfMarker?.getLngLat().lng.toString());
                setChoosing(false);
              }}
            >
              确认
            </Button>
          )}
        </div>
        <div className={styles.rightButtonContainer}>
          <Button onClick={() => setChoosing(false)}>取消</Button>
        </div>
      </div>

      <Modal
        footer={null}
        open={showExif}
        onCancel={() => setShowExif(false)}
        title="什么是位置信息?"
      >
        <ul style={{ margin: 0, padding: 0 }}>
          <li>
            在拍摄照片时，手机需要打开「增加地理位置」类似的设置才会在图片中加入位置信息。
          </li>
          <li>导入或者发送文件时，使用「原图」传输才不会丢失位置信息。</li>
          <li>
            在网页和小程序上传图片时，系统可能会因为隐私安全问题自动抹除位置信息。
          </li>
        </ul>
      </Modal>

      <Modal
        footer={null}
        open={showGuide}
        onCancel={() => setShowGuide(false)}
        title="为什么需要位置信息?"
      >
        <p style={{ margin: 0 }}>
          后台会检测拍摄时间，地理位置这两个属性来制作寻景。
          <br />
          现在上传有两种方式：
        </p>
        <ol style={{ margin: 0 }}>
          第一种：
          <li>手机拍摄时打开「增加地理位置」等类似设置；</li>
          <li>微信/QQ将原图发送到电脑，或用蓝牙直接传输；</li>
          <li>电脑上传到寻景。</li>
          第二种：使用 geosetter 工具添加地理位置信息
        </ol>
      </Modal>
    </>
  );
};

export default EventUpload;
