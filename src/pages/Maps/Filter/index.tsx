import Panorama, { PanoramaRef } from '@/components/Map/GoogleMap/Panorama';
import { useLoadGoogle } from '@/hooks/use-load-google';
import {
  deleteMapPanoRequest,
  getPanoInfo,
  getQQPanoInfo,
  listMapPanosRequest,
} from '@/services/api';
import { useParams } from '@umijs/max';
import { Button, GetProp, Table, TableProps, message } from 'antd';
import { useEffect, useRef, useState } from 'react';

import HeaderLogo from '@/components/Header/Logo';
import { MapProvider } from 'react-map-gl';
import MapWithMarker from './MapWithMarker';
import styles from './style.less';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];
type TablePaginationConfig = Exclude<
  GetProp<TableProps, 'pagination'>,
  boolean
>;

interface TableParams {
  pagination?: TablePaginationConfig;
}

const MapFilter = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const [loaded, setLoaded] = useState<boolean>(false);
  const panoRef = useRef<PanoramaRef | null>(null);
  const [selected, setSelected] = useState<string>();
  const [round, setRound] = useState<API.GameRound>({
    round: 1,
    contentType: 'panorama',
    source: 'google_pano',
    panoId: '',
    content: null,
    heading: 180,
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
    vHeading: 0,
    vZoom: 0,
    vPitch: 0,
  });
  const [data, setData] = useState<API.MapContain[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 100,
      position: ['topCenter', 'bottomCenter'],
    },
  });

  const changePano = (record: API.MapContain) => {
    if (record.source !== 'google_pano') {
      if (record.source === 'baidu_pano') {
        getPanoInfo({ pano: record.panoId }).then((res) => {
          if (res.success) {
            setRound({
              round: 1,
              contentType: 'panorama',
              source: record?.source,
              panoId: record?.panoId,
              content: null,
              heading: res.data.centerHeading,
              contentSpeedUp: 0,
              lat: record.lat,
              lng: record.lng,
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
              vHeading: record?.heading ?? 0,
              vZoom: record?.zoom ?? 0,
              vPitch: record?.pitch ?? 0,
            });
            setSelected(record?.panoId);
          }
        });
      } else {
        getQQPanoInfo({ pano: record.panoId }).then((res) => {
          if (res.success) {
            setRound({
              round: 1,
              contentType: 'panorama',
              source: record?.source,
              panoId: record?.panoId,
              content: null,
              heading: res.data.centerHeading,
              contentSpeedUp: 0,
              lat: record.lat,
              lng: record.lng,
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
              vHeading: record?.heading ?? 0,
              vZoom: record?.zoom ?? 0,
              vPitch: record?.pitch ?? 0,
            });
            setSelected(record?.panoId);
          }
        });
      }
    } else {
      setRound({
        round: 1,
        contentType: 'panorama',
        source: record?.source,
        panoId: record?.panoId,
        content: null,
        heading: 0,
        contentSpeedUp: 0,
        lat: record.lat,
        lng: record.lng,
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
        vHeading: record?.heading ?? 0,
        vZoom: record?.zoom ?? 0,
        vPitch: record?.pitch ?? 0,
      });
      setSelected(record?.panoId);
    }
  };

  const fetchData = () => {
    setLoading(true);
    listMapPanosRequest({
      mapsId: Number(mapId),
      page: tableParams.pagination?.current ?? 0,
      size: tableParams.pagination?.pageSize,
    }).then((res) => {
      setData(res.data.list);
      setLoading(false);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: res.data.total,
        },
      });
      if (res.data.list.length) {
        changePano(res.data.list[0]);
      }
    });
  };

  useEffect(fetchData, [
    tableParams.pagination?.current,
    tableParams.pagination?.pageSize,
  ]);

  const handleTableChange: TableProps<API.MapContain>['onChange'] =
    (pagination: { pageSize?: any }) => {
      setTableParams({
        pagination,
      });
      if (pagination.pageSize !== tableParams.pagination?.pageSize) {
        setData([]);
      }
    };

  const columns: ColumnsType<API.MapContain> = [
    {
      title: 'panoId',
      dataIndex: 'panoId',
      align: 'center',
      ellipsis: true,
    },
  ];

  const handleArrowDown = () => {
    const index = data?.findIndex((v) => v.panoId === selected);
    if (
      index === (data?.length ?? 0) - 1 ||
      index === -1 ||
      index === undefined
    ) {
      return;
    }
    if (data) {
      changePano(data[index + 1]);
    }
  };

  const handleArrowUp = () => {
    const index = data?.findIndex((v) => v.panoId === selected);
    if (index === 0 || index === -1 || index === undefined) {
      return;
    }
    if (data) {
      changePano(data[index - 1]);
    }
  };

  const handleBackspace = () => {
    const index = data?.findIndex((v) => v.panoId === selected);
    if (index === -1 || index === undefined || !data) {
      return;
    }
    deleteMapPanoRequest({
      mapsId: Number(mapId),
      containId: data[index].id,
    }).then((res) => {
      if (res.success) {
        message.success(`删除 ${selected} 成功`);
        fetchData();
      } else {
        message.error(`删除失败`);
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'ArrowDown') {
        event.preventDefault();
        handleArrowDown();
      }
      if (event.code === 'ArrowUp') {
        event.preventDefault();
        handleArrowUp();
      }
      if (event.code === 'Backspace') {
        event.preventDefault();
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, selected]);

  useLoadGoogle({ setLoaded });
  return (
    <>
      <HeaderLogo canBack={true} className={styles.header} />
      {loaded && round && <Panorama round={round} ref={panoRef}></Panorama>}
      <div className={styles.container} style={{}}>
        <Table
          columns={columns}
          className={styles.list}
          rowKey={(record) => record.id.toString()}
          dataSource={data}
          pagination={tableParams.pagination}
          loading={loading}
          onChange={handleTableChange}
          showHeader={false}
          scroll={{ scrollToFirstRowOnChange: true }}
          size="small"
          onRow={(record) => {
            return {
              onClick: () => {
                changePano(record);
              },
            };
          }}
          rowClassName={(record) =>
            record.panoId === selected ? styles.selected : ''
          }
        />
      </div>
      <div
        className={styles.buttonContainer}
        style={{ position: 'fixed', top: '40%', right: '1%' }}
      >
        <Button
          type="primary"
          danger
          style={{ marginBottom: 10 }}
          onClick={handleBackspace}
        >
          删除
        </Button>
      </div>
      <span
        style={{
          position: 'fixed',
          right: '1%',
          top: '1%',
          backgroundColor: 'black',
          padding: 5,
          borderRadius: 5,
        }}
      >
        上下键切换街景，Backspace(删除)键删除街景。
      </span>
      <div
        className={styles.container2}
        style={{
          position: 'fixed',
          right: '1%',
          bottom: '3%',
        }}
      >
        <MapProvider>
          <div className={styles.map}>
            <MapWithMarker round={round}></MapWithMarker>
          </div>
        </MapProvider>
      </div>
    </>
  );
};

export default MapFilter;
