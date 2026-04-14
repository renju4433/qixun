import { CFMapTile } from '@/constants';
import NormalPage from '@/pages/NormalPage';
import {
  eventShow,
  finderUpload,
  getFinderlist,
  getqixunUserProfile,
} from '@/services/api';
import { history, useModel, useParams } from '@@/exports';
import { Button, Flex, Select, message } from 'antd';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import 'viewerjs/dist/viewer.js';
import styles from './style.less';

const Event = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

  // const mapBoxSupport = mapboxgl.supported();
  if (!mapboxgl.supported()) {
    alert('你的浏览器内核版本过低，请尝试升级！');
  }
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const url = CFMapTile;
  const tileSize = 512;
  const [preview, setPreview] = useState<API.Finder>();
  const [userName, setUserName] = useState<string | undefined>();

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  let { userId } = useParams();

  const isManager = location.pathname.includes('/event-manager');
  if (isManager) {
    try {
      userId = user!.userId.toString();
    } catch (e) {
      message.error('您未登录，请先登录');
    }
  }

  const [timeSelect, setTimeSelect] = useState<string>(
    userId || isManager ? 'all' : 'week',
  );
  const viewerRef = useRef<Viewer | null>(null);
  const imgOrigin = 'https://b68v.daai.fun/';
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  function getUserInfo() {
    getqixunUserProfile({ userId: parseInt(userId!) }).then((res) => {
      setUserName(res.data.userName);
    });
  }

  function addMapListener() {
    map.current?.on('click', 'points', async (e) => {
      // eslint-disable-next-line no-eval
      const finder: API.Finder = eval(
        '(' + e.features![0].properties!.finder + ')',
      );

      if (!userId && !isManager) {
        // @ts-ignore
        const coordinates = e?.features![0].geometry.coordinates.slice();
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `<a href='/event/user/${finder.user.userId}' target='_blank' >${finder.user.userName}</a>`,
          )
          .addTo(map.current!);
      }

      if (isManager) {
        history.push('/event-modify/' + finder.id);
        return;
      }

      setPreview(finder);

      setTimeout(() => {
        if (!viewerRef.current) {
          viewerRef.current = new Viewer(document.getElementById('image')!, {
            navbar: false,
          });
        }
        viewerRef.current.show();
        eventShow({ id: finder.id! }).then(() => { });
      }, 200);
    });

    map.current?.on('mouseenter', 'points', async (e) => {
      // eslint-disable-next-line no-eval
      const finder: API.Finder = eval(
        '(' + e.features![0].properties!.finder + ')',
      );

      let coordinates = undefined;
      try {
        // @ts-ignore
        coordinates = e?.features![0].geometry.coordinates.slice();
      } catch (e) { }
      if (!coordinates) return;
      if (popupRef.current) popupRef.current.remove();

      popupRef.current = new mapboxgl.Popup();
      popupRef.current
        .setLngLat(coordinates)
        .setHTML(
          `<img style='height: 150px; width: 150px; object-fit: contain; ' src='${imgOrigin}${finder.img}?x-oss-process=image/resize,h_250' ></img>`,
        )
        .addTo(map.current!);
      popupRef.current.getElement().style.pointerEvents = 'none';
    });

    map.current?.on('mouseleave', 'points', async () => {
      if (popupRef.current) popupRef.current.remove();
    });
  }
  function getList(time: number | null, timeUnit: string | null) {
    getFinderlist({
      userId,
      startTime: null,
      endTime: null,
      time,
      timeUnit,
    }).then(async (res) => {
      if (res.success && res.data) {
        const features: any[] = [];
        for (let i = 0; i < res.data.length; i++) {
          const finder = res.data[i];
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [finder.lng, finder.lat],
            },
            properties: { finder },
          });
        }

        try {
          if (popupRef.current) popupRef.current.remove();

          if (map.current?.getLayer('points')) {
            map.current.removeLayer('points');
          }
          if (map.current?.getSource('points')) {
            map.current.removeSource('points');
          }
        } catch (e) { }
        await map.current?.addSource('points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features,
          },
        });
        // Add a symbol layer
        await map.current?.addLayer({
          id: 'points',
          type: 'symbol',
          source: 'points',
          layout: {
            'icon-image': 'custom-marker',
            'icon-anchor': 'bottom',
            'icon-size': 0.7,
            'icon-allow-overlap': true,
          },
        });
      }
    });
  }
  function getListByTimeSelect(value: string) {
    switch (value) {
      case 'day':
        getList(1, 'day');
        break;
      case 'week':
        getList(7, 'day');
        break;
      case 'month':
        getList(30, 'day');
        break;
      case 'all':
        getList(null, null);
        break;
    }
  }
  async function initMap() {
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

    map.current.loadImage(
      'https://b68v.daai.fun/biz/1662830770348_9499340182724556af66f2b42846135b_0.png',
      (error, image) => {
        if (error) throw error;
        else if (map.current?.hasImage('custom-marker')) return;
        map.current?.addImage('custom-marker', image!);
        getListByTimeSelect(timeSelect);
        addMapListener();
      },
    );
  }

  useEffect(() => {
    initMap();
    if (userId) getUserInfo();
    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <>
      <NormalPage fullscreen={true} feedbackButton={false}>
        <img
          style={{ position: 'absolute' }}
          width={0}
          height={0}
          id="image"
          src={`${imgOrigin}${preview?.img}`}
          alt={`${preview?.user.userName} 投稿`}
        />
        <div ref={mapContainer} className={styles.mapContainer} />
      </NormalPage>

      <Flex
        gap="small"
        vertical
        className={`${styles.topRight} ${isInApp ? styles.appNavigate : ''}`}
      >
        {!userId && !isInApp && (
          <Button
            style={{ backgroundColor: '#141414' }}
            onClick={() =>
              finderUpload().then((res) => {
                if (res.success) history.push('/event-upload');
              })
            }
          >
            上传投稿
          </Button>
        )}
        {!userId && (
          <Button
            style={{ backgroundColor: '#141414' }}
            onClick={() => history.push('/event-manager')}
          >
            投稿管理
          </Button>
        )}
        <Select
          defaultValue={timeSelect}
          value={timeSelect}
          onChange={async (value) => {
            getListByTimeSelect(value);
            setTimeSelect(value);
          }}
          options={[
            { label: '一天内', value: 'day' },
            { label: '一周内', value: 'week' },
            { label: '一月内', value: 'month' },
            { label: '全部', value: 'all' },
          ]}
        />
      </Flex>

      {userId && userName && !isManager && (
        <div className={styles.userName}>{userName} 的投稿</div>
      )}
      {isManager && <div className={styles.userName}>投稿管理</div>}
      {!isManager && (
        <div className={styles.hint}>提示：点击大头针查看内容</div>
      )}
    </>
  );
};

export default Event;
