/**
 * 回放事件记录优化工具（简化版）
 * 只做最关键的优化：节流 + 精度控制 + 增量去重
 */

// 优化配置
export const REPLAY_CONFIG = {
  // 事件节流时间（毫秒）- 保守配置
  throttle: {
    PanoPov: 50,       // 视角变化：50ms（每秒最多20次）
    PanoZoom: 80,     // 缩放：80ms（每秒最多12次）
    MapView: 100,      // 地图视图：100ms（每秒最多10次）
    MapZoom: 100,      // 地图缩放：100ms（每秒最多10次）
  },

  // 数据精度 - 与原版保持一致
  precision: {
    coordinate: 5,     // 坐标：5位小数（与原版一致，约1米精度）
    angle: 3,          // 角度：3位小数（与原版一致）
    zoom: 2,           // 缩放：2位小数（略微优化）
  },

  // 增量去重配置
  deduplication: {
    enabled: true,     // 启用去重
  },
};

/**
 * 节流器（简化版）
 */
export class Throttler {
  private timers: Map<string, number> = new Map();

  throttle(key: string, callback: () => void, delay: number): void {
    const lastTime = this.timers.get(key) || 0;
    const now = Date.now();

    if (now - lastTime >= delay) {
      this.timers.set(key, now);
      callback();
    }
  }

  clear() {
    this.timers.clear();
  }
}

/**
 * 精度控制
 */
export const roundToPrecision = (value: number, precision: number): number => {
  return parseFloat(value.toFixed(precision));
};

/**
 * 增量去重器 - 过滤重复值
 */
export class DedupDetector {
  private lastValues: Map<string, string> = new Map();

  /**
   * 检查是否应该记录（值是否有变化）
   */
  shouldRecord(action: string, data: any): boolean {
    if (!REPLAY_CONFIG.deduplication.enabled) {
      return true;
    }

    // 序列化数据用于比较
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const lastValue = this.lastValues.get(action);

    // 如果值没有变化，跳过记录
    if (lastValue === dataStr) {
      return false;
    }

    // 更新最后的值
    this.lastValues.set(action, dataStr);
    return true;
  }

  clear() {
    this.lastValues.clear();
  }
}
