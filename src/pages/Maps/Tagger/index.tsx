import Panorama, { PanoramaRef } from '@/components/Map/GoogleMap/Panorama';
import { useLoadGoogle } from '@/hooks/use-load-google';
import {
  addTag,
  addTagByFilter,
  cleanTagByFilter,
  deleteMapPanoRequest,
  deleteMapPanosByTag,
  getPanoInfo,
  getQQPanoInfo,
  listMapPanosByTag,
  listMapTags,
  listTagsByPano,
  removeTag,
} from '@/services/api';
import { useParams } from '@umijs/max';
import {
  Button,
  Divider,
  Empty,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Spin,
  Tag,
  message,
} from 'antd';
import { useEffect, useRef, useState } from 'react';

import HeaderLogo from '@/components/Header/Logo';
import {
  CloseCircleOutlined,
  CloseOutlined,
  CloseSquareOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusCircleOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { MapLayerMouseEvent, MapProvider } from 'react-map-gl';
import MapWithMarker from './MapWithMarker';
import styles from './style.less';

type LocalPano = {
  id: number;
  panoId: string;
  source: 'baidu_pano' | 'qixun_pano' | 'google_pano' | 'qq_pano';
};

const MapTagger = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const [loaded, setLoaded] = useState<boolean>(false);
  const panoRef = useRef<PanoramaRef | null>(null);
  const [selected, setSelected] = useState<LocalPano>();
  const [round, setRound] = useState<API.GameRound | undefined>(undefined);
  const [data, setData] = useState<API.MapContain[]>();
  const [tagData, setTagData] = useState<API.MapTag[]>();
  const [selectedTag, setSelectedTag] = useState<string>();
  const [noTag, setNoTag] = useState<boolean>(false);
  const [reverse, setReverse] = useState<boolean>(false);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTags, setLoadingTags] = useState<boolean>(true);
  const [panoTags, setPanoTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState<string>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>('batch_add');

  const updatePanoTags = (containId: number) => {
    listTagsByPano({ mapsId: Number(mapId), containId: containId }).then(
      (res) => {
        setPanoTags(res.data);
        setLoadingTags(false);
      },
    );
  };

  const updateTagData = () => {
    listMapTags({
      mapsId: Number(mapId),
    }).then((res) => {
      setTagData(res.data);
      setLoading(false);
      setLoadingTags(false);
    });
  };

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
            setSelected({
              id: record.id,
              panoId: record?.panoId,
              source: record.source,
            });
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
            setSelected({
              id: record.id,
              panoId: record?.panoId,
              source: record.source,
            });
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
      setSelected({
        id: record.id,
        panoId: record?.panoId,
        source: record.source,
      });
    }
    updatePanoTags(record.id);
  };

  const fetchData = () => {
    if (requesting) {
      return;
    }
    setRequesting(true);

    setLoading(true);

    listMapPanosByTag({
      mapsId: Number(mapId),
      tags: noTag ? undefined : selectedTag,
      reverse: reverse,
      noTag: noTag,
      all: !noTag && selectedTag === undefined,
    }).then((res) => {
      setData(res.data);
      setLoading(false);
      setRequesting(false);
    });

    updateTagData();
  };

  const exportData = () => {
    setLoading(true);
    window.open(
      location.origin +
        '/api/v0/qixun/maps/exportByTags?mapsId=' +
        Number(mapId) +
        '&tags=' +
        (noTag ? undefined : selectedTag) +
        '&reverse=' +
        reverse +
        '&noTag=' +
        noTag +
        '&all=' +
        (!noTag && selectedTag === undefined),
      '_self',
    );
  };

  const deletePanos = () => {
    setLoading(true);
    setLoadingTags(true);
    setRound(undefined);
    setSelected(undefined);
    setSelectedTag(undefined);
    deleteMapPanosByTag({
      mapsId: Number(mapId),
      tags: noTag ? undefined : selectedTag,
      reverse: reverse,
      noTag: noTag,
      all: !noTag && selectedTag === undefined,
    }).then((res) => {
      if (res.success) {
        message.success('删除成功');
      } else {
        message.error('删除失败');
      }
      setLoading(false);
      setLoadingTags(false);
      fetchData();
    });
  };

  const batchAddTag = () => {
    if (!inputTag) {
      return;
    }
    setLoadingTags(true);
    addTagByFilter({
      mapsId: Number(mapId),
      tags: noTag ? undefined : selectedTag,
      reverse: reverse,
      noTag: noTag,
      all: !noTag && selectedTag === undefined,
      tag: inputTag,
    }).then((res) => {
      if (res.success) {
        message.success('添加成功');
      } else {
        message.error('添加失败');
      }
      updateTagData();
      setLoadingTags(false);
    });
  };

  const panoAddTag = (tag: string | undefined) => {
    if (!tag || !selected) {
      return;
    }
    setLoadingTags(true);
    addTag({
      mapsId: Number(mapId),
      containId: selected.id,
      tag: tag,
    }).then(() => {
      updateTagData();
      updatePanoTags(selected.id);
    });
  };

  const panoRemoveTag = (tag: string | undefined) => {
    if (!tag || !selected) {
      return;
    }
    setLoadingTags(true);
    removeTag({
      mapsId: Number(mapId),
      containId: selected.id,
      tag: tag,
    }).then(() => {
      updateTagData();
      updatePanoTags(selected.id);
    });
  };

  const cleanTags = () => {
    setLoadingTags(true);
    cleanTagByFilter({
      mapsId: Number(mapId),
      tags: noTag ? undefined : selectedTag,
      reverse: reverse,
      noTag: noTag,
      all: !noTag && selectedTag === undefined,
    }).then((res) => {
      if (res.success) {
        message.success('清空成功');
      } else {
        message.error('清空失败');
      }
      updateTagData();
      setLoadingTags(false);
    });
  };

  const handleBackspace = () => {
    if (!selected) {
      return;
    }
    deleteMapPanoRequest({
      mapsId: Number(mapId),
      containId: selected.id,
    }).then((res) => {
      if (res.success) {
        message.success(`删除 ${selected?.panoId} 成功`);
        fetchData();
      } else {
        message.error(`删除失败`);
      }
    });
  };

  // useEffect(() => {
  //   fetchData();
  // }, []);
  useEffect(() => {
    fetchData();
  }, [selectedTag, noTag]);

  const _onClick = (e: MapLayerMouseEvent) => {
    if (e.features && e.features[0] && e.features[0].properties) {
      const feature = e.features[0].properties;
      changePano(feature);
    }
  };

  // useEffect(() => {
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     if (event.code === 'Backspace') {
  //       event.preventDefault();
  //       handleBackspace();
  //     }
  //     if (event.code === 'Delete') {
  //       event.preventDefault();
  //       handleDelete();
  //     }
  //   };
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [data, selected]);

  useLoadGoogle({ setLoaded });
  return (
    <>
      <HeaderLogo canBack={true} className={styles.header} />
      <div
        style={{
          position: 'absolute',
          left: '60%',
          width: '40%',
          height: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        {loaded && round ? (
          <Panorama round={round} ref={panoRef}></Panorama>
        ) : (
          <Empty description="点击左侧地图 Pin 以显示街景/编辑标签" />
        )}
      </div>

      <div
        className={styles.mapContainer}
        style={{
          position: 'absolute',
          width: '60%',
          height: '100%',
        }}
      >
        <MapProvider>
          <div className={styles.map}>
            <MapWithMarker
              rounds={data}
              onClick={_onClick}
              cluster={(data && data.length >= 10000) ?? false}
            ></MapWithMarker>
          </div>
        </MapProvider>
      </div>

      <div className={styles.controlContainer}>
        <Flex justify="space-around">
          <div>
            <Button
              icon={<TagsOutlined />}
              disabled={!!round}
              onClick={() => {
                setModalType('batch_add');
                setModalOpen(true);
              }}
            >
              添加标签
            </Button>
            <Popconfirm
              title="确认清空标签?"
              description={`确认清空选中 ${data?.length} 条街景的全部标签?`}
              onConfirm={() => {
                cleanTags();
              }}
            >
              <Button danger icon={<CloseOutlined />} disabled={!!round}>
                清空标签
              </Button>
            </Popconfirm>
          </div>
          <div>
            <Button
              disabled={!round}
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setSelected(undefined);
                setRound(undefined);
              }}
            >
              取消选中
            </Button>
            <Popconfirm
              title="确认删除街景?"
              description={`确认删除街景 ${selected?.panoId}?`}
              onConfirm={() => {
                handleBackspace();
              }}
            >
              <Button danger disabled={!round} icon={<DeleteOutlined />}>
                删除街景
              </Button>
            </Popconfirm>
          </div>
          <div>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                exportData();
              }}
            >
              导出 JSON
            </Button>
            <Popconfirm
              title="确认删除街景?"
              description={`确认删除选中的 ${data?.length} 条街景?`}
              onConfirm={() => {
                deletePanos();
              }}
            >
              <Button icon={<CloseSquareOutlined />} danger>
                删除选中
              </Button>
            </Popconfirm>
          </div>
        </Flex>
        <Divider />
        <Spin tip="加载中" spinning={loadingTags || requesting}>
          <h2>{round ? '标签编辑' : '标签筛选'}</h2>
          <Flex
            gap={4}
            align="center"
            wrap
            style={{ overflowY: 'auto', flex: 1 }}
          >
            {tagData?.map((tag) => (
              <Tag.CheckableTag
                key={tag.tag}
                checked={
                  round ? panoTags.includes(tag.tag) : selectedTag === tag.tag
                }
                onChange={(checked) => {
                  if (!round) {
                    setRound(undefined);
                    setSelected(undefined);
                    if (checked) {
                      setSelectedTag(tag.tag);
                      setNoTag(false);
                    } else {
                      setSelectedTag(undefined);
                    }
                  } else {
                    if (checked) {
                      panoAddTag(tag.tag);
                    } else {
                      panoRemoveTag(tag.tag);
                    }
                  }
                }}
              >
                {round ? tag.tag : tag.tag + '(' + tag.count + ')'}
              </Tag.CheckableTag>
            ))}
            {round ? (
              <Tag
                color={!panoTags || panoTags.length === 0 ? '#e89a3c' : 'black'}
              >
                无标签
              </Tag>
            ) : (
              <Tag.CheckableTag
                checked={noTag === true}
                onChange={(checked) => {
                  setRound(undefined);
                  setSelected(undefined);
                  if (checked) {
                    setSelectedTag(undefined);
                    setNoTag(true);
                  } else {
                    setNoTag(false);
                  }
                }}
              >
                无标签
              </Tag.CheckableTag>
            )}
            {round && (
              <Button
                size="small"
                icon={<PlusCircleOutlined />}
                onClick={() => {
                  setModalType('pano_add');
                  setModalOpen(true);
                }}
              ></Button>
            )}
          </Flex>
        </Spin>
      </div>
      <Modal
        title="输入标签"
        open={modalOpen}
        onOk={() => {
          if (modalType === 'batch_add') {
            batchAddTag();
          } else if (modalType === 'pano_add') {
            panoAddTag(inputTag);
          } else if (modalType === 'pano_remove') {
            panoRemoveTag(inputTag);
          }
          setModalOpen(false);
        }}
        onCancel={() => {
          setModalOpen(false);
        }}
      >
        <Input
          value={inputTag}
          onChange={(e) => setInputTag(e.target.value)}
        ></Input>
      </Modal>
    </>
  );
};

export default MapTagger;
