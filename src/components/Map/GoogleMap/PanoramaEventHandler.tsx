import { Throttler, DedupDetector, REPLAY_CONFIG, roundToPrecision } from '@/utils/replayOptimizer';
import { ReplayDataManager } from '@/utils/replayDataManager';

export class PanoramaEventHandler {
  private panorama: any;
  private listeners: Map<string, any> = new Map();

  // 数据管理器
  private dataManager: ReplayDataManager;

  // 优化工具
  private throttler: Throttler;
  private dedupDetector: DedupDetector;

  constructor() {
    this.dataManager = new ReplayDataManager('qixun_PANOEVENTS');
    this.throttler = new Throttler();
    this.dedupDetector = new DedupDetector();
  }

  setTarget(panorama: any) {
    this.panorama = panorama;
    if (!this.panorama) {
      console.error('Panorama object is not provided');
      return;
    }
  }

  // 初始化新一轮的数据
  initRound(round: number, gameId?: any) {
    // 清空去重检测器，确保新轮次的第一个事件不会被错误过滤
    this.dedupDetector.clear();
    // 清空节流器，避免上一轮残留的节流状态影响新轮次
    this.throttler.clear();
    this.dataManager.initRound(round, gameId);
  }

  private startAutoSave() {
    this.dataManager.startAutoSave();
  }

  public stopAutoSave() {
    this.dataManager.stopAutoSave();
  }

  private addListener(eventType: string, listener: () => void) {
    const listenerInstance = google.maps.event.addListener(this.panorama, eventType, listener);
    this.listeners.set(eventType, listenerInstance);
  }

  addListeners() {
    this.startAutoSave();

    // 位置变化
    this.addListener('position_changed', () => {
      const currentPanoId = this.panorama.getPano();
      this.recordEvent('PanoLocation', currentPanoId);
    });

    // 视角变化：节流 + 精度控制 + 去重
    this.addListener('pov_changed', () => {
      const replayData = this.dataManager.getReplayData();
      const isStartEvent = replayData.some(event => event.action === 'PanoLocation');
      if (!isStartEvent) return;

      this.throttler.throttle('PanoPov', () => {
        const pov = this.panorama.getPov();
        const heading = roundToPrecision(pov.heading, REPLAY_CONFIG.precision.angle);
        const pitch = roundToPrecision(pov.pitch, REPLAY_CONFIG.precision.angle);
        const data = [heading, pitch];

        if (this.dedupDetector.shouldRecord('PanoPov', data)) {
          this.recordEvent('PanoPov', data);
        }
      }, REPLAY_CONFIG.throttle.PanoPov);
    });

    // 缩放变化：节流 + 精度控制 + 去重
    this.addListener('zoom_changed', () => {
      const replayData = this.dataManager.getReplayData();
      const isStartEvent = replayData.some(event => event.action === 'PanoLocation');
      if (!isStartEvent) return;

      this.throttler.throttle('PanoZoom', () => {
        const currentZoom = this.panorama.getZoom();
        const zoom = roundToPrecision(currentZoom, REPLAY_CONFIG.precision.zoom);

        if (this.dedupDetector.shouldRecord('PanoZoom', zoom)) {
          this.recordEvent('PanoZoom', zoom);
        }
      }, REPLAY_CONFIG.throttle.PanoZoom);
    });
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

  // 上报数据
  public async uploadData(round: number, gameId: any) {
    await this.dataManager.uploadData(round, gameId);
  }

  public getReplayData(round?: number): Array<{ action: string; time: number; type: string; data: any }> {
    return this.dataManager.getReplayData(round);
  }

  public hasRecords(round?: number): boolean {
    return this.dataManager.hasRecords(round);
  }

  removeAllListeners() {
    if (!this.panorama) {
      return;
    }

    this.listeners.forEach((listener) => {
      google.maps.event.removeListener(listener);
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
