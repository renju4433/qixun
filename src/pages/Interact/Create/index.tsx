import LngLatCvtTip from '@/components/Interact/LngLatCvtTip';
import MapContainer from '@/components/Map/MapContainer';
import { baseURL } from '@/constants';
import styles from '@/pages/Event/Upload/style.less';
import NormalPage from '@/pages/NormalPage';
import { lngLatCvt, postChallenge, postQuestion } from '@/services/api';
import { useSearchParams } from '@@/exports';
import {
  BookOutlined,
  CaretDownOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  QuestionOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Input,
  Modal,
  Radio,
  Space,
  Spin,
  Upload,
  UploadProps,
  message,
} from 'antd';
import EXIF from 'exif-js';
import gcoord from 'gcoord';
import { useEffect, useState } from 'react';
import { Layer, Marker, Source } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';
import { history } from 'umi';
import createStyle from './style.less';

const { Dragger } = Upload;

const InteractCreate = () => {
  const navigator = useNavigate();
  const [images, setImages] = useState<
    Array<{
      name: string;
      lat: number | null;
      lng: number | null;
      loading: boolean;
    }>
  >([]);
  const [checkCanPublish, setCheckCanPublish] = useState<boolean>(false);
  const [coordinatingVisible, setCoordinatingVisible] =
    useState<boolean>(false);
  const [mapVisible, setMapVisible] = useState<boolean>(false);
  const [manualConfirmMapPoint, setManualConfirmMapPoint] =
    useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [lngLatQuickInput, setLngLatQuickInput] = useState<string>('');
  const [lngLatQuickInputTipVisible, setLngLatQuickInputTipVisible] =
    useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null,
  );
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const [searchParams] = useSearchParams();

  const [distance, setDistance] = useState(300);
  const type = searchParams.get('type');

  // 用于存储文件的 EXIF 信息（在 beforeUpload 中提取，在 onChange 中使用）
  const [fileExifMap, setFileExifMap] = useState<
    Map<string, { lat: number | null; lng: number | null }>
  >(new Map());

  useEffect(() => {
    const allImagesHaveCoordinates = images.every(
      (image) => image.lat && image.lng,
    );
    if (!title || images.length === 0 || !allImagesHaveCoordinates) {
      setCheckCanPublish(false);
    } else setCheckCanPublish(true);
  }, [title, images]);

  useEffect(() => {
    if (currentImageIndex !== null && images[currentImageIndex]) {
      setManualLat(images[currentImageIndex]?.lat?.toString() ?? '');
      setManualLng(images[currentImageIndex]?.lng?.toString() ?? '');
    }
  }, [currentImageIndex]);

  let props: UploadProps = {
    name: 'file',
    action: `${baseURL}/upload_image`,
    accept: 'image/*',
    multiple: true,
    beforeUpload(file) {
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        message.error(`${file.name} 文件过大，请选择小于20MB的文件`);
        return false;
      }

      // 在文件上传前就读取 EXIF 信息
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const exifData = EXIF.readFromBinaryFile(
            e.target!.result as ArrayBuffer,
          );
          let lat: number | null = null;
          let lng: number | null = null;

          if (exifData && exifData.GPSLatitude && exifData.GPSLongitude) {
            lat =
              exifData.GPSLatitude[0] +
              exifData.GPSLatitude[1] / 60 +
              exifData.GPSLatitude[2] / 3600;
            lng =
              exifData.GPSLongitude[0] +
              exifData.GPSLongitude[1] / 60 +
              exifData.GPSLongitude[2] / 3600;

            // 西经和南纬
            if (lng && 'W' == exifData.GPSLongitudeRef) {
              lng *= -1;
            }
            if (lat && 'S' == exifData.GPSLatitudeRef) {
              lat *= -1;
            }

            // 说明: Android(未确认是否全部) 和 iPhone 照片均使用WGS84坐标系
            [lng, lat] = gcoord.transform(
              [Number(lng), Number(lat)],
              gcoord.WGS84,
              gcoord.GCJ02,
            );

            console.log(`[EXIF] ${file.name} GPS坐标读取成功:`, { lat, lng });
          } else {
            console.log(`[EXIF] ${file.name} 未找到GPS坐标信息`);
          }

          // 存储 EXIF 信息，key 是文件名
          setFileExifMap((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.set(file.name, { lat, lng });
            return newMap;
          });
        } catch (error) {
          console.error('[EXIF] 读取 EXIF 信息失败:', error);
          message.error(`${file.name} EXIF信息读取失败`);
          // 即使失败也要存储空值，避免后续等待
          setFileExifMap((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.set(file.name, { lat: null, lng: null });
            return newMap;
          });
        }
      };

      reader.onerror = function (error) {
        console.error('[EXIF] FileReader 错误:', error);
        message.error(`${file.name} 文件读取失败，请重试`);
        // 存储空值
        setFileExifMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(file.name, { lat: null, lng: null });
          return newMap;
        });
      };

      reader.readAsArrayBuffer(file);

      setImages((prevImages) => [
        ...prevImages,
        { name: file.name, lat: null, lng: null, loading: true },
      ]);
      return true;
    },
    data(file) {
      return { scene: 'qixun/question', fileName: file.name };
    },
    onChange(info) {
      if (info.file.status === 'uploading') {
        console.log(`[上传] ${info.file.name} 上传中...`);
      } else if (info.file.status === 'done') {
        console.log(`[上传] ${info.file.name} 上传完成`, info.file.response);

        // 检查后端是否返回了错误
        if (!info.file.response) {
          message.error(`${info.file.name} 上传失败：服务器无响应`);
          setImages((prevImages) =>
            prevImages.filter((image) => image.name !== info.file.name),
          );
          setFileExifMap((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.delete(info.file.name);
            return newMap;
          });
          return;
        }

        if (info.file.response.errorCode) {
          message.error(info.file.response.errorMessage || '上传失败');
          setImages((prevImages) =>
            prevImages.filter((image) => image.name !== info.file.name),
          );
          // 清理 EXIF 缓存
          setFileExifMap((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.delete(info.file.name);
            return newMap;
          });
          return;
        }

        // 从预先读取的 EXIF 信息中获取坐标
        const currentFileName = info.file.name;
        const exifInfo = fileExifMap.get(currentFileName);
        const lat = exifInfo?.lat ?? null;
        const lng = exifInfo?.lng ?? null;

        console.log(`[坐标] ${currentFileName} 坐标信息:`, { lat, lng, exifInfo });

        setImages((prevImages) => {
          const updatedImages = prevImages.map((image) =>
            image.name === currentFileName
              ? {
                name: info.file.response.data,
                lat,
                lng,
                loading: false,
              }
              : image,
          );
          const newIndex = updatedImages.findIndex(
            (image) => image.name === info.file.response.data,
          );
          setCurrentImageIndex(newIndex);
          setManualLat(lat?.toString() ?? '');
          setManualLng(lng?.toString() ?? '');
          return updatedImages;
        });

        // 清理已使用的 EXIF 缓存
        setFileExifMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.delete(currentFileName);
          return newMap;
        });

        if (lat && lng) {
          message.success(`${currentFileName} 上传成功，GPS坐标已读取`);
        } else {
          message.warning(`${currentFileName} 上传成功，但未找到GPS坐标，请手动输入或选点`);
        }
      } else if (info.file.status === 'error') {
        console.error(`[上传] ${info.file.name} 上传失败`, info.file.error);
        message.error(`${info.file.name} 上传失败，请重试`);
        setImages((prevImages) =>
          prevImages.filter((image) => image.name !== info.file.name),
        );
        // 清理 EXIF 缓存
        setFileExifMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.delete(info.file.name);
          return newMap;
        });
      }
    },
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setImages(updatedImages);
    if (currentPreviewIndex === images.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    }
    if (
      currentImageIndex !== null &&
      currentImageIndex >= updatedImages.length
    ) {
      setCurrentImageIndex(updatedImages.length - 1);
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
    <NormalPage
      title={`发布${type === 'challenge' ? '网络迷踪' : '互动题目'}`}
      desc={
        type === 'challenge'
          ? '暂时只支持白名单的用户(解题数>=5 自动加入)发布迷踪，发布以后无法自行删除'
          : '现已支持多图题目发布'
      }
    >
      <div style={{ margin: '1rem 0' }}>
        <Input
          placeholder="输入标题 - 必填"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />

        <Dragger
          {...props}
          style={{
            display: type !== 'challenge' || images.length === 0 ? '' : 'none',
          }}
          showUploadList={false}
          height={100}
        >
          点击此处 / 拖动图片 至此上传
        </Dragger>
        <Divider />
        <p>
          乱标位置会被封禁；禁止上传涉军、涉政、涉黄、涉恐、侵犯他人隐私的图片。
        </p>
        <p>发布前请确认位置准确性，避免出现偏移。</p>
        {type === 'challenge' && (
          <>
            <p>
              请勿发布抄袭、雷同、低质网络迷踪。请勿将网络迷踪的位置标定在首都/首府等非实际位置。请勿发布不可解的题目。具体规则见
              <a
                href="https://www.yuque.com/chaofun/qixun/rules#pjSUv"
                target="_blank"
                rel="noreferrer"
              >
                网络迷踪内容管理规定（暂行）
              </a>
              。
            </p>
          </>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            margin: '0.5rem 0',
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                margin: '0.5rem',
                padding: '0.5rem',
                border: '1px solid #ccc',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {image.loading ? (
                <Spin tip="加载中..." />
              ) : (
                <>
                  <img
                    src={`https://b68v.daai.fun/${image.name}?x-oss-process=image/resize,h_120 `}
                    alt={`Preview of image ${index + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '100px' }}
                  />
                  <div
                    style={{ color: image.lat && image.lng ? 'white' : 'red' }}
                  >
                    经纬度：
                    {image.lat && image.lng
                      ? `${image.lng?.toFixed(6)}, ${image.lat?.toFixed(6)}`
                      : '未填'}
                  </div>
                  <Button
                    onClick={() => {
                      setManualConfirmMapPoint(true);
                      setMapVisible(true);
                      setCurrentImageIndex(index);
                    }}
                    style={{ margin: '0.25rem' }}
                  >
                    <EnvironmentOutlined />
                    选点
                  </Button>
                  <Button
                    onClick={() => {
                      setCoordinatingVisible(true);
                      setCurrentImageIndex(index);
                    }}
                    style={{ margin: '0.25rem' }}
                  >
                    <BookOutlined />
                    输入
                  </Button>

                  <Button
                    onClick={() => removeImage(index)}
                    type="text"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <CloseOutlined />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        {type === 'challenge' && (
          <div style={{ marginBottom: '1rem' }}>
            挑战成功条件：
            <Radio.Group
              onChange={(v) => setDistance(v.target.value)}
              value={distance}
            >
              <Radio value={100}>100m</Radio>
              <Radio value={300}>300m</Radio>
              <Radio value={1000}>1000m</Radio>
              <Radio value={3000}>3000m</Radio>
              <Radio value={10000}>10000m</Radio>
            </Radio.Group>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button
            disabled={!checkCanPublish || isPublishing}
            onClick={() => {
              if (!manualConfirmMapPoint) {
                message.warning('需要点击“选点”按钮在地图上确认位置！');
                return;
              }
              setIsPublishing(true);
              const items = images.map((image) => ({
                type: 'image',
                path: image.name,
                lat: image.lat,
                lng: image.lng,
              }));

              if (type === 'challenge') {
                postChallenge({
                  title: title,
                  content: JSON.stringify({
                    type: 'image',
                    items: items,
                    distance: distance,
                  }),
                })
                  .then(() => {
                    message.success('发布成功');
                    navigator('/interact/challenge');
                  })
                  .finally(() => setIsPublishing(false));
              } else {
                postQuestion({
                  title: title,
                  content: JSON.stringify({ type: 'image', items: items }),
                })
                  .then(() => {
                    message.success('发布成功');
                    history.push('/interact');
                  })
                  .finally(() => setIsPublishing(false));
              }
            }}
            className={styles.publish}
            type="primary"
          >
            发布
          </Button>
        </div>

        {type === 'challenge' && (
          <div
            style={{
              color: 'grey',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '8px',
            }}
          >
            *发布网络迷踪代表你同意
            <a
              href="https://www.yuque.com/chaofun/qixun/rules#pjSUv"
              target="_blank"
              rel="noreferrer"
            >
              网络迷踪内容管理规定（暂行）
            </a>
          </div>
        )}
      </div>

      <Modal
        title="手动输入"
        open={coordinatingVisible}
        onCancel={() => setCoordinatingVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCoordinatingVisible(false)}>
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={() => {
              if (manualLat && manualLng && currentImageIndex !== null) {
                const newImages = [...images];
                newImages[currentImageIndex] = {
                  ...newImages[currentImageIndex],
                  lat: parseFloat(manualLat),
                  lng: parseFloat(manualLng),
                };
                setImages(newImages);
                message.success('图片经纬度已保存');
                setCoordinatingVisible(false);
              } else message.error('请输入有效的坐标');
            }}
            disabled={!manualLat || !manualLng}
          >
            保存
          </Button>,
        ]}
      >
        <p>如果GPS坐标无法获取，可在下方手动输入坐标；乱标位置会被封禁。</p>
        <Space direction="vertical" style={{ width: '100%' }}>
          {currentImageIndex !== null && images[currentImageIndex] && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={`https://b68v.daai.fun/${images[currentImageIndex].name}?x-oss-process=image/resize,h_120 `}
                alt={`Preview of image ${currentImageIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '200px' }}
              />
            </div>
          )}
          <Input
            addonBefore="快捷输入"
            placeholder="经度, 纬度 / 地图链接 等"
            value={lngLatQuickInput}
            onChange={(e) => setLngLatQuickInput(e.target.value)}
          />
          <div className={createStyle.lngLatInputControls}>
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
        </Space>
      </Modal>

      <Modal
        title="地图选点"
        open={mapVisible}
        onCancel={() => setMapVisible(false)}
        footer={[
          <Button key="back" onClick={() => setMapVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              setMapVisible(false);
              if (currentImageIndex !== null) {
                setManualLat(images[currentImageIndex]?.lat?.toString() ?? '');
                setManualLng(images[currentImageIndex]?.lng?.toString() ?? '');
                message.success(
                  `选定的坐标: 经度 ${images[currentImageIndex]?.lng?.toFixed(
                    6,
                  )}, 纬度 ${images[currentImageIndex]?.lat?.toFixed(6)}`,
                );
              }
            }}
          >
            确定
          </Button>,
        ]}
      >
        <div style={{ height: '50vh', maxWidth: '100%' }}>
          <MapContainer
            cursor="crosshair"
            onClick={(e) => {
              if (currentImageIndex !== null) {
                const newImages = [...images];
                newImages[currentImageIndex] = {
                  ...newImages[currentImageIndex],
                  lat: e.lngLat.lat,
                  lng: e.lngLat.lng,
                };
                setImages(newImages);
              }
            }}
          >
            {currentImageIndex !== null &&
              images[currentImageIndex]?.lat &&
              images[currentImageIndex]?.lng && (
                <Marker
                  key={currentImageIndex}
                  latitude={images[currentImageIndex].lat!}
                  longitude={images[currentImageIndex].lng!}
                />
              )}
            {type === 'challenge' &&
              currentImageIndex !== null &&
              images[currentImageIndex]?.lat &&
              images[currentImageIndex]?.lng && (
                <Source
                  id="selected-location-circle"
                  type="geojson"
                  data={makeCircle(
                    images[currentImageIndex].lng,
                    images[currentImageIndex].lat,
                    distance / 1000,
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
      </Modal>

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
    </NormalPage>
  );
};

export default InteractCreate;
