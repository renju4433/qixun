import NormalPage from '@/pages/NormalPage';
import {
  addMapPanosRequest as addPanos,
  clearMapRequest,
  deleteMapPanoRequest as deletePano,
  deleteMapReportRequest as deleteReport,
  getMapInfo,
  getMapReportRequest as getReport,
  getMapReportCountRequest as getReportCount,
  getMapStausRequest as getStatus,
  listMapPanosRequest as listPanos,
  listReportMapPanosRequest as listReports,
  modifyMapInfo,
  publishMapRequest as publish,
  refreshMapStatusRequest as refresh,
  unpublishMapRequest as unpublish,
} from '@/services/api';
import { useNavigate, useParams } from '@@/exports';
import { AlignLeftOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  Flex,
  Image,
  Input,
  List,
  Modal,
  Popconfirm,
  Tabs,
  Tag,
  Typography,
  Upload,
  UploadFile,
  UploadProps,
  message,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useEffect, useState } from 'react';

const MapModify = () => {
  const [map, setMap] = useState<API.MapItem>();
  const [choose, setChoose] = useState<string>('all');
  const [status, setStatus] = useState<API.MapStatus>();
  const [list, setList] = useState<API.MapContainPage>();
  const [page, setPage] = useState<number>(1);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  const [openAdd, setOpenAdd] = useState<boolean>(false);
  const [panos, setPanos] = useState<string>('');
  const [reportCount, setReportCount] = useState<number>(0);
  const [selectedPano, setSelectedPano] = useState<API.MapContain>();
  const [showReport, setShowReport] = useState<boolean>(false);
  const [reportReasons, setReportReasons] = useState<API.MapReport[]>();
  const [cover, setCover] = useState<string>();
  const [name, setName] = useState<string>();
  const [desc, setDesc] = useState<string>();
  const { mapId } = useParams();
  const navigate = useNavigate();
  const getPanoStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      ready: '待发布',
      wait_check: '待审核',
      crawler_fail: '准备失败',
      crawling: '准备中',
      publish: '已发布',
    };
    return statusMap[status] || status;
  };

  const getMap = () => {
    getMapInfo({ mapsId: Number(mapId) }).then((res) => setMap(res.data));
  };

  const getMapStatus = () => {
    getStatus({ mapsId: Number(mapId) }).then((res) => setStatus(res.data));
    getReportCount({ mapsId: Number(mapId) }).then((res) =>
      setReportCount(res.data),
    );
  };

  const getMapPanos = () => {
    const requestFn = choose !== 'report' ? listPanos : listReports;
    requestFn({ mapsId: Number(mapId), page, size: 100, status: choose }).then(
      (res) => {
        if (res.success) setList(res.data);
      },
    );
  };

  const toPanorama = (source: string, panoId: string) => {
    if (source === 'baidu_pano')
      window.open(
        `https://maps.baidu.com/#panoid=${panoId}&panotype=street&pitch=0&l=13&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=${panoId}`,
      );
    else if (source === 'qq_pano') message.warning('暂不支持打开腾讯街景');
    else if (panoId.indexOf('AF') === 0)
      window.open(
        `https://www.google.com/maps/@0.0,0.0,3a,75y,90t/data=!3m7!1e1!3m5!1s${panoId}!2e10!3e11!7i8192!8i4096`,
      );
    else
      window.open(
        `https://www.google.com/maps/@?api=1&map_action=pano&pano=${panoId}`,
      );
  };

  useEffect(() => {
    if (selectedPano) {
      getReport({ mapsId: Number(mapId), containId: selectedPano.id }).then(
        (res) => setReportReasons(res.data),
      );
    }
  }, [showReport]);

  useEffect(() => {
    getMap();
    getMapStatus();
  }, []);

  useEffect(() => {
    setList(undefined);
    getMapPanos();
  }, [choose, page]);

  useEffect(() => {
    getMapStatus();
  }, [choose]);

  useEffect(() => {
    if (map) {
      setName(map.name);
      setDesc(map.desc);
      setCover(map.cover);
    }
  }, [map]);

  const props = {
    name: 'file',
    action: 'https://saiyuan.top/api/upload_image',
    data: (file: any) => ({ fileName: file.name }),
    onChange: (info: any) => {
      if (info.file.status === 'done' && info.file.response.success === true) {
        setCover(info.file.response.data);
        message.success(`上传成功`);
      } else if (info.file.status === 'error') message.error(`上传失败`);
    },
  };

  const [addMode, setAddMode] = useState<string>('input');
  const [jsonFileList, setJsonFileList] = useState<UploadFile[]>([]);
  const props2: UploadProps = {
    maxCount: 1,
    fileList: jsonFileList,
    beforeUpload: (file) => {
      const isJSON = file.type === 'application/json';
      if (!isJSON) {
        message.error(`只支持上传 JSON 文件`);
        return false;
      }
      return false;
    },
    onChange: (info) => {
      // 受控模式：始终同步 fileList，避免删除后卡死和重复导入提示「上一次传输进行中」
      let nextFileList = [...info.fileList];
      // beforeUpload 返回 false 时文件会卡在 uploading 状态，手动设为 done 以便正常显示和删除
      nextFileList = nextFileList.map((f) =>
        f.status === 'uploading' ? { ...f, status: 'done' as const } : f,
      );
      setJsonFileList(nextFileList);
    },
  };

  return (
    <NormalPage title={`题库管理 - ${map?.name ?? ''} (id: ${map?.id ?? ''})`}>
      {map && (
        <>
          <Typography.Title
            level={4}
            style={{ margin: 5, textAlign: 'center' }}
          >
            题库操作
          </Typography.Title>
          <Flex gap="small" wrap="wrap" justify="center">
            <Button
              onClick={() =>
                publish({ mapsId: map.id }).then(() => {
                  getMap();
                  getMapStatus();
                  setTimeout(() => getMapStatus(), 2000);
                  setTimeout(() => getMapStatus(), 5000);
                  setTimeout(() => getMapStatus(), 20000);
                })
              }
              type="primary"
            >
              发布
            </Button>
            {map.publish && (
              <Button
                onClick={() =>
                  unpublish({ mapsId: map.id }).then(() => {
                    getMap();
                    getMapStatus();
                  })
                }
              >
                撤回
              </Button>
            )}
            <Button onClick={() => setOpenSetting(true)}>修改基础属性</Button>
            <Button
              onClick={() =>
                window.open('/api/v0/qixun/maps/export?mapsId=' + map.id)
              }
            >
              导出 JSON
            </Button>
            <Popconfirm
              title="确认清空题库吗？"
              onConfirm={() =>
                clearMapRequest({ mapsId: map.id }).then(() => {
                  getMap();
                  getMapStatus();
                  getMapPanos();
                })
              }
            >
              <Button danger>清空题库</Button>
            </Popconfirm>
          </Flex>
          <Divider style={{ margin: 15 }} />
        </>
      )}

      {map && (
        <>
          <Typography.Title
            level={4}
            style={{ margin: 5, textAlign: 'center' }}
          >
            街景操作
          </Typography.Title>
          <Flex gap="small" wrap="wrap" justify="center">
            <Button onClick={() => navigate(`/mapdistribute/${map.id}`)}>
              街景分布
            </Button>
            <Button onClick={() => navigate(`/maptagger/${map.id}`)}            >
              标签管理
            </Button>
            <Button onClick={() => navigate(`/mapfilter/${map.id}`)}>
              筛选
            </Button>
            <Button onClick={() => refresh({ mapsId: map.id }).then(getMapStatus)}>
              重试失败
            </Button>
            <Button onClick={() => navigate(`/baidumaker/${map.id}`)}>
              百度添加
            </Button>
            <Button onClick={() => setOpenAdd(true)}>链接/JSON添加</Button>
            <Button onClick={() => navigate(`/mapreport/${map.id}`)}>
              坏题处理
            </Button>
          </Flex>
          <Divider style={{ margin: 15 }} />
        </>
      )}

      <Typography.Title level={4} style={{ margin: 5, textAlign: 'center' }}>
        街景列表
      </Typography.Title>
      <Flex
        gap="small"
        justify="space-between"
        style={{ margin: '5px 0' }}
        wrap="wrap"
      >
        {[
          { label: '全部', value: 'all', count: status?.total ?? 0 },
          { label: '待发布', value: 'ready', count: status?.ready ?? 0 },
          {
            label: '待审核',
            value: 'wait_check',
            count: status?.wait_check ?? 0,
          },
          {
            label: '准备失败',
            value: 'crawler_fail',
            count: status?.crawler_fail ?? 0,
          },
          { label: '准备中', value: 'crawling', count: status?.crawling ?? 0 },
          { label: '已发布', value: 'publish', count: status?.publish ?? 0 },
          { label: '坏题反馈', value: 'report', count: reportCount },
        ].map(({ label, value, count }) => (
          <Button
            key={value}
            onClick={() => setChoose(value)}
            size="small"
            type={choose === value ? 'primary' : 'default'}
          >
            {label}({count})
          </Button>
        ))}
      </Flex>

      <List
        dataSource={list?.list}
        loading={list === undefined}
        pagination={{
          align: 'start',
          current: page,
          onChange: setPage,
          pageSize: 100,
          position: 'both',
          style: { marginTop: -15 },
          showSizeChanger: false,
          total: list?.total ?? 0,
        }}
        renderItem={(item) => (
          <Flex justify="space-between" style={{ margin: '6px 0' }} wrap="wrap">
            <Flex align="center">
              <span
                onClick={() => toPanorama(item.source, item.panoId)}
                style={{ cursor: 'pointer' }}
              >
                {item.panoId}
              </span>
            </Flex>
            <Flex align="center" gap="small" justify="space-between">
              <Button
                onClick={() => toPanorama(item.source, item.panoId)}
                size="small"
              >
                查看
              </Button>
              <Popconfirm
                key="delete"
                title={`确认删除街景${selectedPano?.panoId}吗？`}
                onConfirm={() => {
                  if (map && selectedPano)
                    deletePano({
                      mapsId: map.id,
                      containId: selectedPano.id,
                    }).then(() => {
                      getMap();
                      getMapStatus();
                      getMapPanos();
                      setSelectedPano(undefined);
                    });
                }}
              >
                <Button
                  danger
                  onClick={() => setSelectedPano(item)}
                  size="small"
                >
                  删除
                </Button>
              </Popconfirm>
              {choose === 'report' && (
                <Button
                  onClick={() => {
                    setSelectedPano(item);
                    setShowReport(true);
                  }}
                  size="small"
                >
                  查看反馈
                </Button>
              )}
              <Tag
                color={
                  item.status === 'publish'
                    ? 'green'
                    : item.status === 'ready'
                      ? 'blue'
                      : item.status === 'wait_check'
                        ? 'gold'
                        : item.status === 'crawler_fail'
                          ? 'red'
                          : item.status === 'crawling'
                            ? 'orange'
                            : item.status === 'report'
                              ? 'purple'
                              : 'default'
                }
              >
                {getPanoStatus(item.status)}
              </Tag>
            </Flex>
          </Flex>
        )}
        rowKey="id"
      />

      <Modal
        title="添加街景"
        open={openAdd}
        onCancel={() => {
          setOpenAdd(false);
          setJsonFileList([]); // 关闭时清空，避免再次打开时残留「上一次传输进行中」
        }}
        onOk={() => {
          if (map) {
            if (addMode === 'input') {
              addPanos({ mapsId: map.id, links: panos }).then((res) => {
                getMap();
                getMapStatus();
                getMapPanos();
                if (res.success) {
                  setPanos('');
                  setOpenAdd(false);
                }
              });
            } else if (addMode === 'upload') {
              const file = jsonFileList[0]?.originFileObj ?? jsonFileList[0];
              if (!file) {
                message.warning('请先选择 JSON 文件');
                return;
              }
              addPanos({ mapsId: map.id, file }).then((res) => {
                getMap();
                getMapStatus();
                getMapPanos();
                if (res.success) {
                  setJsonFileList([]);
                  setOpenAdd(false);
                }
              });
            }
          }
        }}
      >
        <a
          href="https://www.yuque.com/chaofun/qixun/added"
          target="_blank"
          rel="noreferrer"
        >
          点击跳转教程
        </a>
        <br />
        街景链接 或 PanoId 一行一条；支持百度街景/Google 街景/腾讯街景。
        <br />也支持{' '}
        <a href="https://map-making.app" target="_blank" rel="noreferrer">
          map-making.app
        </a>{' '}
        的 JSON 字符串，请直接粘贴。
        <Tabs
          items={[
            {
              key: 'input',
              label: '输入',
              children: (
                <TextArea
                  style={{ height: '50vh' }}
                  value={panos}
                  onChange={(v) => setPanos(v.target.value)}
                />
              ),
              icon: <AlignLeftOutlined />,
            },
            {
              key: 'upload',
              label: '上传',
              children: (
                <Upload {...props2}>
                  <Button icon={<UploadOutlined />}>选择 JSON 文件</Button>
                </Upload>
              ),
              icon: <UploadOutlined />,
            },
          ]}
          onChange={(v) => setAddMode(v)}
        />
      </Modal>

      <Modal
        title="查看反馈"
        open={showReport}
        footer={[
          <Popconfirm
            key="delete"
            title={`确认删除街景${selectedPano?.panoId}吗？`}
            onConfirm={() => {
              if (map && selectedPano) {
                deletePano({
                  mapsId: map.id,
                  containId: selectedPano.id,
                }).then(() => {
                  getMap();
                  getMapStatus();
                  getMapPanos();
                  setSelectedPano(undefined);
                  setShowReport(false);
                });
              }
            }}
          >
            <Button danger>删除</Button>
          </Popconfirm>,
          <Button
            key="ignore"
            onClick={() => {
              if (map && selectedPano)
                deleteReport({
                  mapsId: map.id,
                  containId: selectedPano.id,
                }).then(() => {
                  getMapPanos();
                  getMapStatus();
                  setSelectedPano(undefined);
                  setShowReport(false);
                });
            }}
            type="dashed"
          >
            忽略
          </Button>,
          <Button key="cancel" onClick={() => setShowReport(false)}>
            取消
          </Button>,
        ]}
        onCancel={() => {
          setSelectedPano(undefined);
          setShowReport(false);
        }}
      >
        {reportReasons?.map((v, index) => (
          <div key={index}>
            {v.reason}: {v.more}
          </div>
        ))}
      </Modal>

      <Modal
        title="编辑属性"
        open={openSetting}
        onCancel={() => setOpenSetting(false)}
        onOk={() => {
          if (name && map)
            modifyMapInfo({ mapsId: map.id, name, desc, cover }).then(() => {
              getMap();
              setOpenSetting(false);
            });
        }}
      >
        <Flex align="center" gap="small" justify="center" vertical>
          <Upload {...props}>
            <Button icon={<UploadOutlined />}>点击上传</Button>
          </Upload>
          {cover && (
            <Image src={`https://b68v.daai.fun/${cover}`} height={100} />
          )}
          <Input
            placeholder="题库名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextArea
            placeholder="题库描述"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </Flex>
      </Modal>
    </NormalPage>
  );
};

export default MapModify;