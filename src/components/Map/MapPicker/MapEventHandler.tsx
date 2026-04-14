import { Throttler, DedupDetector, REPLAY_CONFIG, roundToPrecision } from '@/utils/replayOptimizer';
import { ReplayDataManager } from '@/utils/replayDataManager';

type EventListenerMap = {
  moveend: () => void;
  zoom: (event: any) => void;
  click: (event: any) => void;
  resize: () => void;
};

export class MapEventHandler {
  private map: any;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  // 数据管理器
  private dataManager: ReplayDataManager;

  // 优化工具
  private throttler: Throttler;
  private dedupDetector: DedupDetector;

  constructor() {
    this.dataManager = new ReplayDataManager('qixun_MAPEVENTS');
    this.throttler = new Throttler();
    this.dedupDetector = new DedupDetector();
  }

  setTarget(map: any) {
    this.map = map;
    if (!this.map) {
      console.error('Map object is not provided');
      return;
    }
  }

  // 初始化新一轮的数据
  initRound(round: number, gameId?: any) {
    // 清空去重检测器和节流器，避免上一轮残留状态影响新轮次
    this.dedupDetector.clear();
    this.throttler.clear();
    this.dataManager.initRound(round, gameId);
  }

  private startAutoSave() {
    this.dataManager.startAutoSave();
  }

  public stopAutoSave() {
    this.dataManager.stopAutoSave();
  }

  addListeners() {
    this.startAutoSave();

    // 地图移动：节流 + 精度控制 + 去重
    const moveendListener = () => {
      this.throttler.throttle('MapView', () => {
        const bounds = this.map.getBounds();
        const mapCenter = bounds.getCenter();
        const lat = roundToPrecision(mapCenter.lat, REPLAY_CONFIG.precision.coordinate);
        const lng = roundToPrecision(mapCenter.lng, REPLAY_CONFIG.precision.coordinate);
        const data = [lat, lng];

        if (this.dedupDetector.shouldRecord('MapView', data)) {
          this.recordEvent('MapView', data);
        }
      }, REPLAY_CONFIG.throttle.MapView);
    };
    this.map.on('moveend', moveendListener);
    this.listeners.set('moveend', moveendListener);

    // 地图缩放：节流 + 精度控制 + 去重
    const zoomListener = () => {
      this.throttler.throttle('MapZoom', () => {
        const zoomLevel = this.map.getZoom();
        const bounds = this.map.getBounds();
        const mapCenter = bounds.getCenter();
        const lat = roundToPrecision(mapCenter.lat, REPLAY_CONFIG.precision.coordinate);
        const lng = roundToPrecision(mapCenter.lng, REPLAY_CONFIG.precision.coordinate);
        const zoom = roundToPrecision(zoomLevel, REPLAY_CONFIG.precision.zoom);
        const data = [lat, lng, zoom];

        if (this.dedupDetector.shouldRecord('MapZoom', data)) {
          this.recordEvent('MapZoom', data);
        }
      }, REPLAY_CONFIG.throttle.MapZoom);
    };
    this.map.on('zoom', zoomListener);
    this.listeners.set('zoom', zoomListener);

    // 点击事件：精度控制
    const clickListener = (event: any) => {
      const { lngLat } = event;
      const lat = roundToPrecision(lngLat.lat, REPLAY_CONFIG.precision.coordinate);
      const lng = roundToPrecision(lngLat.lng, REPLAY_CONFIG.precision.coordinate);
      this.recordEvent('Pin', [lat, lng]);
    };
    this.map.on('click', clickListener);
    this.listeners.set('click', clickListener);
  }

  removeListener(eventType: keyof EventListenerMap) {
    const listener = this.listeners.get(eventType);
    if (listener) {
      this.map.off(eventType, listener);
      this.listeners.delete(eventType);
    }
  }

  public recordEvent(action: string, data: any): void {
    const time = Date.now();
    const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);

    const recordItem: API.RecordItem = {
      action: action,
      type: Array.isArray(data) ? 'Array' : typeof data,
      time: time,
      data: dataToStore,
    };

    this.dataManager.recordEvent(recordItem);
  }

  public async uploadData(round: number, gameId: any) {
    await this.dataManager.uploadData(round, gameId);
  }

  public getReplayData(round?: number): Array<{
    action: string;
    time: number;
    type: string;
    data: any;
  }> {
    return this.dataManager.getReplayData(round);
  }

  public hasRecords(round?: number): boolean {
    return this.dataManager.hasRecords(round);
  }

  removeAllListeners() {
    this.listeners.forEach((listener, eventType) => {
      this.map.off(eventType, listener);
    });
    this.listeners.clear();
    this.throttler.clear();
    this.dedupDetector.clear();
  }

  clearEvents(round?: number) {
    this.dataManager.clearEvents(round);
    this.dedupDetector.clear();
  }
}
