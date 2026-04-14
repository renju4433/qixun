import { getPanoInfo, reportErrorPano } from '@/services/api';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { request, useParams } from '@umijs/max';
import { Button, Flex, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styles from './style.less';

// 声明全局类型
declare global {
	interface Window {
		BMapGL: any;
		google: any;
		qixunJump: (url: string) => void;
	}
}

// 加载脚本的工具函数
const loadScript = (src: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		// 检查脚本是否已加载
		const existingScript = document.querySelector(`script[src="${src}"]`);
		if (existingScript) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = src;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
		document.head.appendChild(script);
	});
};

const BAIDU_CSS_URL = 'https://api.map.baidu.com/res/webgl/10/bmap.css';

const BaiduMaker = () => {
	const { mapId } = useParams<{ mapId: string }>();

	const viewerRef = useRef<any>(null);
	const mapRef = useRef<any>(null);
	const markerRef = useRef<any>(null);
	const markersRef = useRef<Record<string, any>>({});
	const tempMarkerRef = useRef<any>(null); // 当前未保留的临时标记
	const activePanoRef = useRef<string | null>(null); // 当前选中的 panoId
	const currentIconRef = useRef<any>(null);
	const savedIconRef = useRef<any>(null);

	const [panoId, setPanoId] = useState<string>();
	const [panoIds, setPanoIds] = useState<string[]>([]);
	const [headingMap, setHeadingMap] = useState<Record<string, number>>({});
	const [isMobile, setIsMobile] = useState<boolean>(false);

	// 预加载图片
	const preloadImage = (pano: string) => {
		const img = new Image();
		img.src = `https://map.chao-fan.com/bd/thumb/${pano}`;
	};

	// 获取自定义全景图瓦片 URL
	const getCustomPanoramaTileUrl = (
		pano: string,
		zoom: number,
		tileX: number,
		tileY: number,
	) => {
		const newZoom = zoom + 1;
		if (newZoom === 1) {
			return `https://map.chao-fan.com/bd/thumb/${pano}`;
		}
		return `https://mapsv1.bdimg.com/?qt=pdata&sid=${pano}&pos=${tileY}_${tileX}&z=${newZoom}`;
	};

	// 获取自定义全景图
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const getCustomPanorama = (pano: string, ..._args: any[]) => {
		console.log('getCustomPanorama');
		if (pano.length === 27) {
			return {
				location: { pano: pano },
				links: [],
				copyright: 'baidu',
				tiles: {
					tileSize: new window.google.maps.Size(512, 512),
					worldSize: new window.google.maps.Size(8192, 4096),
					centerHeading: headingMap[pano] ?? 0,
					getTileUrl: getCustomPanoramaTileUrl,
				},
			};
		}
		return null;
	};

	// 设置 Google Street View
	const setGoogle = (panoId: string) => {
		if (viewerRef.current) {
			viewerRef.current.setPano(panoId);
			viewerRef.current.setVisible(true);
			setTimeout(() => {
				viewerRef.current.setZoom(0);
			}, 50);
		}
	};

	// 获取全景图信息
	const getPanoInfoHandler = async (pano: string, set: boolean) => {
		setPanoId(pano);
		try {
			const res = await getPanoInfo({ pano });
			console.log(res);

			if (viewerRef.current && res.data) {
				viewerRef.current.setLinks(res.data.links || []);
				setHeadingMap((prev) => ({
					...prev,
					[res.data.pano]: res.data.centerHeading || 0,
				}));

				if (res.data.links) {
					res.data.links.forEach((item: any) => {
						preloadImage(item.pano);
						setHeadingMap((prev) => ({
							...prev,
							[item.pano]: item.centerHeading || 0,
						}));
					});
				}

				if (set) setGoogle(pano);

				const markerKey = res.data.pano;

				// 准备图标（选中更大/不同颜色；已保留较小）
				if (window.BMapGL && !currentIconRef.current) {
					// 使用SVG创建橙色圆形图标（当前选中）
					const orangeDotSvg =
						'data:image/svg+xml,' +
						encodeURIComponent(
							'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="#FF6B35" stroke="#fff" stroke-width="2"/></svg>',
						);
					currentIconRef.current = new window.BMapGL.Icon(
						orangeDotSvg,
						new window.BMapGL.Size(32, 32),
						{ anchor: new window.BMapGL.Size(16, 16) }, // 锚点设置为图标中心
					);
				}
				if (window.BMapGL && !savedIconRef.current) {
					// 使用SVG创建红色圆形图标（已保留）
					const redDotSvg =
						'data:image/svg+xml,' +
						encodeURIComponent(
							'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#FF4444" stroke="#fff" stroke-width="2"/></svg>',
						);
					savedIconRef.current = new window.BMapGL.Icon(
						redDotSvg,
						new window.BMapGL.Size(24, 24),
						{ anchor: new window.BMapGL.Size(12, 12) }, // 锚点设置为图标中心
					);
				}

				// 还原上一个选中点的图标或移除其临时标记
				if (activePanoRef.current && activePanoRef.current !== markerKey) {
					const prevKey = activePanoRef.current;
					if (markersRef.current[prevKey] && savedIconRef.current) {
						markersRef.current[prevKey].setIcon(savedIconRef.current);
					} else if (tempMarkerRef.current) {
						tempMarkerRef.current.remove();
						tempMarkerRef.current = null;
					}
				}

				// 为当前街景维护标记：已保留则复用，未保留则创建临时标记
				if (mapRef.current && res.data.bd09Lng && res.data.bd09Lat) {
					if (markersRef.current[markerKey]) {
						markerRef.current = markersRef.current[markerKey];
						// 确保已保留的marker有_panoId属性
						if (!markerRef.current._panoId) {
							markerRef.current._panoId = markerKey;
						}
						if (currentIconRef.current) {
							markerRef.current.setIcon(currentIconRef.current);
						}
					} else {
						// 清理旧的未保留临时标记
						if (tempMarkerRef.current) {
							tempMarkerRef.current.remove();
						}
						const marker = new window.BMapGL.Marker(
							new window.BMapGL.Point(res.data.bd09Lng, res.data.bd09Lat),
							{ icon: currentIconRef.current || undefined },
						);
						mapRef.current.addOverlay(marker);
						tempMarkerRef.current = marker;
						markerRef.current = marker;
					}
					activePanoRef.current = markerKey;
				}
			}
		} catch (error) {
			console.error('Failed to get pano info:', error);
		}
	};

	// 处理marker点击事件
	const handleMarkerClick = (panoId: string) => {
		getPanoInfoHandler(panoId, true);
	};

	// 获取全景图信息
	const getPano = async (x: number, y: number) => {
		try {
			const response = await fetch(
				`https://mapsv0.bdimg.com/?qt=qsdata&x=${x}&y=${y}&radius=1000`,
			);
			const data = await response.json();
			if (data.content?.id) {
				await getPanoInfoHandler(data.content.id, true);
			}
		} catch (error) {
			console.error('Failed to get pano:', error);
		}
	};

	// 初始化
	const init = async () => {
		// 加载百度地图
		try {
			await loadScript(
				'https://api.map.baidu.com/getscript?type=webgl&v=2.0&ak=C56Qdc560TQKtQaavS0NTPUYupsZHspI&services=20230613170744',
			);

			const map = new window.BMapGL.Map('map', { maxZoom: 21 });
			const point = new window.BMapGL.Point(116.40385, 39.913795);
			map.centerAndZoom(point, 10);
			map.enableScrollWheelZoom();

			map.addTileLayer(new window.BMapGL.PanoramaCoverageLayer());

			mapRef.current = map;
			map.addEventListener('click', (e: any) => {
				console.log(e);
				// 检查是否点击了marker
				if (e.overlay && e.overlay._panoId) {
					// 点击了marker，访问对应的街景
					handleMarkerClick(e.overlay._panoId);
					return;
				}
				// 点击了地图，获取该位置的街景
				getPano(e.point.lng, e.point.lat);
			});
		} catch (error) {
			console.error('Failed to load Baidu Map:', error);
		}

		// 加载 Google Street View
		try {
			await loadScript('https://b68v.daai.fun/st_v3/js_v32.js');

			const viewer = new window.google.maps.StreetViewPanorama(
				document.getElementById('viewer'),
				{
					fullscreenControl: false,
					panControl: true,
					addressControl: false,
					imageDateControl: false,
					motionTracking: false,
					motionTrackingControl: false,
					streetViewControl: false,
					showRoadLabels: false,
					scaleControl: false,
					zoomControl: false,
					panControlOptions: {
						position: window.google.maps.ControlPosition.BOTTOM_LEFT,
					},
				},
			);

			viewer.registerPanoProvider(getCustomPanorama, { cors: true });

			viewer.addListener('pano_changed', () => {
				console.log('pano_changed');
				if (viewer.getPano().length === 27) {
					getPanoInfoHandler(viewer.getPano(), false);
				}
			});

			viewer.addListener('status_changed', () => {
				console.log(viewer.getStatus());
				if (viewer.getStatus() && viewer.getStatus() !== 'OK') {
					reportErrorPano({
						panoId: viewer.getPano(),
						status: viewer.getStatus(),
						page: 'qixun_pano_filter',
					}).catch(console.error);
				}
			});

			viewerRef.current = viewer;
		} catch (error) {
			console.error('Failed to load Google Street View:', error);
		}
	};

	// 返回
	const goBack = () => {
		try {
			window.history.back();
		} catch (e) {
			if (window.qixunJump) {
				window.qixunJump('https://saiyuan.top/');
			}
		}
	};

	// 删除
	const remove = () => {
		if (!panoId) {
			message.warning('请先选择街景');
			return;
		}
		if (!panoIds.includes(panoId)) {
			message.warning('该街景未保留，无法删除');
			return;
		}
		// 从列表中移除
		setPanoIds((prev) => prev.filter((id) => id !== panoId));
		// 从地图上移除marker
		if (markersRef.current[panoId] && mapRef.current) {
			mapRef.current.removeOverlay(markersRef.current[panoId]);
			delete markersRef.current[panoId];
		}
		// 如果删除的是当前选中的，清理状态
		if (activePanoRef.current === panoId) {
			activePanoRef.current = null;
			markerRef.current = null;
			setPanoId(undefined);
		}
		message.success('已删除');
	};

	// 保留
	const keep = () => {
		const currentPanoId = activePanoRef.current || panoId;
		if (currentPanoId) {
			// 检查是否已存在
			if (panoIds.includes(currentPanoId)) {
				message.warning('该街景已保留，请勿重复添加');
				return;
			}
			setPanoIds((prev) => [...prev, currentPanoId]);
			if (markerRef.current) {
				// 将当前标记转为保留标记
				markersRef.current[currentPanoId] = markerRef.current;
				// 为marker添加panoId属性，用于点击识别
				markerRef.current._panoId = currentPanoId;
				if (savedIconRef.current) {
					markerRef.current.setIcon(savedIconRef.current);
				}
				// 保持当前选中仍使用高亮
				if (currentIconRef.current) {
					markerRef.current.setIcon(currentIconRef.current);
				}
				// 已保留后，移除临时引用
				if (tempMarkerRef.current === markerRef.current) {
					tempMarkerRef.current = null;
				}
			}
		} else {
			message.warning('请先选择街景');
			return;
		}
	};

	// 保存并返回
	const saveAndBack = async () => {
		if (panoIds.length === 0) {
			message.warning('你没有保留街景');
			return;
		}

		try {
			const res = await request<API.Result<null>>('/v0/qixun/maps/mapAddPano', {
				method: 'GET',
				params: {
					panoIds: panoIds.join(','),
					platform: 'baidu_pano',
					mapsId: mapId,
				},
			});

			if (res.success) {
				message.success('添加成功，清空选择');
				setPanoIds([]);
			}
		} catch (error) {
			console.error('Failed to save:', error);
			message.error('添加失败');
		}
	};

	// 初始化
	useEffect(() => {
		// 注入百度地图样式
		const existing = document.querySelector(`link[href="${BAIDU_CSS_URL}"]`);
		if (!existing) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = BAIDU_CSS_URL;
			document.head.appendChild(link);
		}

		// 监听窗口尺寸用于响应式样式（同时考虑宽高比，避免 iPad 竖屏被判定为左右布局）
		const handleResize = () => {
			const isPortrait = window.innerHeight > window.innerWidth;
			const isNarrow = window.innerWidth <= 900;
			setIsMobile(isPortrait || isNarrow);
		};
		handleResize();
		window.addEventListener('resize', handleResize);

		setTimeout(init, 1000);

		// 键盘事件
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.keyCode === 32) {
				// 空格键
				event.preventDefault();
				// 检查当前是否有选中的街景点
				if (activePanoRef.current || panoId) {
					keep();
				} else {
					message.warning('请先选择街景');
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// 更新 headingMap 依赖
	useEffect(() => {
		// 当 headingMap 更新时，需要重新注册 pano provider
		if (viewerRef.current) {
			viewerRef.current.registerPanoProvider(getCustomPanorama, { cors: true });
		}
	}, [headingMap]);

	const canGoBack = window.history.length > 1;

	return (
		<Flex className={`${styles.baiduMaker} ${isMobile ? styles.mobile : ''}`}>
			<Flex className={styles.toolbar} gap="small">
				{canGoBack && (
					<Button
						onClick={goBack}
						className={styles.btn}
						size={isMobile ? 'small' : 'middle'}
					>
						<ArrowLeftOutlined />
						返回
					</Button>
				)}
				<Button
					onClick={saveAndBack}
					className={styles.btn}
					size={isMobile ? 'small' : 'middle'}
				>
					添进题库({panoIds.length})
				</Button>
			</Flex>
			<div id="viewer" className={styles.viewer}>
				<Flex className={styles.viewerAction} gap="small">
					<Button
						onClick={remove}
						danger
						size={isMobile ? 'middle' : 'large'}
						disabled={!panoId || !panoIds.includes(panoId)}
					>
						删除
					</Button>
					<Button
						onClick={keep}
						type="primary"
						size={isMobile ? 'middle' : 'large'}
					>
						保留
					</Button>
				</Flex>
			</div>
			<div id="map" className={styles.map} />
		</Flex>
	);
};

export default BaiduMaker;
