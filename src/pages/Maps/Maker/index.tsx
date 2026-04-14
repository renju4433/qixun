import Panorama, { PanoramaRef } from '@/components/Map/GoogleMap/Panorama';
import { useLoadGoogle } from '@/hooks/use-load-google';
import {
  deleteMapPanoRequest,
  deleteMapReportRequest,
  getMapReportRequest,
  listReportMapPanosRequest,
} from '@/services/api';
import { useParams } from '@umijs/max';
import { Button, GetProp, Table, TableProps, message } from 'antd';
import { useEffect, useRef, useState } from 'react';

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

type LocalPano = {
  id: number;
  panoId: string;
  source: 'baidu_pano' | 'qixun_pano' | 'google_pano' | 'qq_pano';
};

const MapReport = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const [loaded, setLoaded] = useState<boolean>(false);
  const panoRef = useRef<PanoramaRef | null>(null);
  const [selected, setSelected] = useState<LocalPano>();
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
  const [reportData, setReportData] = useState<API.MapReport[]>();
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
      vHeading: 0,
      vZoom: 0,
      vPitch: 0,
    });
    // panoRef?.current?.reset();
    setSelected({
      id: record.id,
      panoId: record?.panoId,
      source: record.source,
    });
    getMapReportRequest({ mapsId: Number(mapId), containId: record.id }).then(
      (res) => {
        if (res.success) {
          setReportData(res.data);
        }
      },
    );
  };

  const fetchData = () => {
    setLoading(true);
    listReportMapPanosRequest({
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
      if (res.data.list) {
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
    },
  ];

  const handleArrowDown = () => {
    const index = data?.findIndex((v) => v.id === selected?.id);
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
    const index = data?.findIndex((v) => v.id === selected?.id);
    if (index === 0 || index === -1 || index === undefined) {
      return;
    }
    if (data) {
      changePano(data[index - 1]);
    }
  };

  const handleBackspace = () => {
    const index = data?.findIndex((v) => v.id === selected?.id);
    if (index === -1 || index === undefined || !data) {
      return;
    }
    deleteMapPanoRequest({
      mapsId: Number(mapId),
      containId: data[index].id,
    }).then((res) => {
      if (res.success) {
        message.success(`删除 ${selected?.panoId} 成功`);
        fetchData();
      } else {
        message.error(`删除失败`);
      }
    });
  };

  const handleDelete = () => {
    const index = data?.findIndex((v) => v.id === selected?.id);
    if (index === -1 || index === undefined || !data) {
      return;
    }
    deleteMapReportRequest({
      mapsId: Number(mapId),
      containId: data[index].id,
    }).then((res) => {
      if (res.success) {
        message.success(`忽略反馈成功`);
        fetchData();
      } else {
        message.error(`忽略失败`);
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
      if (event.code === 'Delete') {
        event.preventDefault();
        handleDelete();
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
      <div
        style={{
          position: 'absolute',
          left: '30%',
          width: '50%',
          height: '100%',
          backgroundColor: 'white',
          zIndex: 100,
        }}
      >
        {loaded && round && <Panorama round={round} ref={panoRef}></Panorama>}
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
        className={styles.hint}
      >
        上下键切换街景，Backspace(退格)键删除街景，Delete(删除)键忽略反馈。
      </span>
      <div
        className={styles.mapContainer}
        style={{
          position: 'absolute',
          width: '30%',
          height: '100%',
        }}
      >
        <MapProvider>
          <div className={styles.map}>
            <MapWithMarker round={round}></MapWithMarker>
          </div>
        </MapProvider>
      </div>

      <div className={styles.container} style={{ position: 'fixed' }}>
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
            record.id === selected?.id ? styles.selected : ''
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
        <br></br>
        <Button type="primary" onClick={handleDelete}>
          忽略
        </Button>
      </div>
    </>
  );
};

export default MapReport;
