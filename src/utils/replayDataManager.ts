import { addRecords } from '@/services/api';

// 轮次数据结构
interface RoundData {
    round: number;
    gameId?: any;
    records: Array<API.RecordItem>;
    seenRecords: Set<string>;  // 防止完全相同的事件重复记录
}

/**
 * 回放数据管理器：按轮次管理事件记录，处理上传和缓存
 */
export class ReplayDataManager {
    private storageKey: string;
    private roundDataMap: Map<number, RoundData> = new Map();
    private currentRound: number | null = null;
    private uploadedRounds: Set<number> = new Set();
    private saveInterval: NodeJS.Timeout | null = null;

    constructor(storageKey: string) {
        this.storageKey = storageKey;
        this.checkCache();
    }

    // 初始化新轮次
    initRound(round: number, gameId?: any): void {
        if (this.roundDataMap.has(round)) {
            const existingData = this.roundDataMap.get(round);
            if (existingData && existingData.records.length > 0) {
                console.warn(`[ReplayDataManager] Round ${round} already exists with ${existingData.records.length} records, keeping existing data`);
            }
            this.currentRound = round;
            return;
        }

        this.roundDataMap.set(round, {
            round,
            gameId,
            records: [],
            seenRecords: new Set(),
        });

        this.currentRound = round;
        //console.log(`[ReplayDataManager] Initialized round ${round}`);
    }

    private getCurrentRoundData(): RoundData | undefined {
        if (this.currentRound === null) return undefined;
        return this.roundDataMap.get(this.currentRound);
    }

    // 记录事件（防止时间戳+动作完全相同的重复事件）
    recordEvent(recordItem: API.RecordItem): boolean {
        const roundData = this.getCurrentRoundData();
        if (!roundData) {
            //console.warn('[ReplayDataManager] No active round');
            return false;
        }

        const recordKey = `${recordItem.time}_${recordItem.action}`;
        if (roundData.seenRecords.has(recordKey)) {
            return false;
        }

        roundData.records.push(recordItem);
        roundData.seenRecords.add(recordKey);
        return true;
    }

    // 获取回放数据
    getReplayData(round?: number): Array<API.RecordItem> {
        if (round !== undefined) {
            return this.roundDataMap.get(round)?.records || [];
        }
        return this.getCurrentRoundData()?.records || [];
    }

    // 检查是否有记录
    hasRecords(round?: number): boolean {
        if (round !== undefined) {
            return (this.roundDataMap.get(round)?.records.length || 0) > 0;
        }
        return (this.getCurrentRoundData()?.records.length || 0) > 0;
    }

    // 清空事件数据
    clearEvents(round?: number): void {
        if (round !== undefined) {
            this.roundDataMap.delete(round);
        } else {
            this.roundDataMap.clear();
            this.currentRound = null;
        }
    }

    getCurrentRound(): number | null {
        return this.currentRound;
    }

    // 启动自动保存
    startAutoSave(): void {
        if (!this.saveInterval) {
            this.saveInterval = setInterval(() => {
                this.saveToCache();
            }, 3000);
        }
    }

    // 停止自动保存
    stopAutoSave(): void {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }

    // 保存到 localStorage（带错误恢复）
    private saveToCache(): void {
        try {
            const dataToCache: any[] = [];

            this.roundDataMap.forEach((roundData, round) => {
                if (!this.uploadedRounds.has(round) && roundData.records.length > 0) {
                    dataToCache.push({
                        gameId: roundData.gameId,
                        round: roundData.round,
                        records: roundData.records,
                    });
                }
            });

            if (dataToCache.length > 0) {
                localStorage.setItem(this.storageKey, JSON.stringify(dataToCache));
            } else {
                localStorage.removeItem(this.storageKey);
            }
        } catch (e) {
            console.error('[ReplayDataManager] Error saving to cache:', e);
            // 尝试清理旧缓存后重试
            try {
                this.clearOldCache();
                // 重试保存
                const dataToCache: any[] = [];
                this.roundDataMap.forEach((roundData, round) => {
                    if (!this.uploadedRounds.has(round) && roundData.records.length > 0) {
                        dataToCache.push({
                            gameId: roundData.gameId,
                            round: roundData.round,
                            records: roundData.records,
                        });
                    }
                });
                if (dataToCache.length > 0) {
                    localStorage.setItem(this.storageKey, JSON.stringify(dataToCache));
                }
            } catch (retryError) {
                console.error('[ReplayDataManager] Cache retry failed:', retryError);
            }
        }
    }

    // 清理旧缓存
    private clearOldCache(): void {
        try {
            const cached = localStorage.getItem(this.storageKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 5) {
                    // 只保留最近5轮数据
                    localStorage.setItem(this.storageKey, JSON.stringify(data.slice(-5)));
                }
            }
        } catch (e) {
            console.error('[ReplayDataManager] Clear old cache failed:', e);
        }
    }

    // 检查并上传缓存数据
    private async checkCache(): Promise<void> {
        const cachedData = localStorage.getItem(this.storageKey);
        if (!cachedData) return;

        try {
            const parsedData = JSON.parse(cachedData);
            const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

            for (const data of dataArray) {
                if (data?.round) {
                    try {
                        await addRecords(data);
                        //console.log(`[ReplayDataManager] Uploaded cached round ${data.round}`);
                    } catch (error) {
                        console.error(`[ReplayDataManager] Failed to upload cached round ${data.round}`, error);
                    }
                }
            }

            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.error('[ReplayDataManager] Error uploading cache', e);
        }
    }

    // 上报数据（防重复 + 重试2次 + 超时控制）
    async uploadData(round: number, gameId: any): Promise<void> {
        if (!round || !gameId) {
            //console.warn('[ReplayDataManager] Missing round or gameId');
            return;
        }

        if (this.uploadedRounds.has(round)) {
            return;
        }

        const roundData = this.roundDataMap.get(round);
        if (!roundData || roundData.records.length === 0) {
            return;
        }

        const replayData = {
            gameId,
            round: roundData.round,
            records: roundData.records,
        };

        // 超时Promise封装
        const uploadWithTimeout = (data: API.GameReplay, timeout: number = 10000) => {
            return Promise.race([
                addRecords(data),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Upload timeout')), timeout)
                )
            ]);
        };

        // 重试2次
        for (let i = 0; i < 2; i++) {
            try {
                await uploadWithTimeout(replayData as API.GameReplay);
                this.uploadedRounds.add(round);
                this.roundDataMap.delete(round);
                //console.log(`[ReplayDataManager] Uploaded round ${round} (${roundData.records.length} records)`);
                return;
            } catch (error) {
                console.error(`[ReplayDataManager] Upload failed (${i + 1}/2)`, error);
                if (i === 0) {
                    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
                }
            }
        }

        // 失败后保存到本地缓存
        console.error(`[ReplayDataManager] Round ${round} upload failed, saved to cache`);
        this.saveToCache();
    }

    // 清理所有数据和定时器
    destroy(): void {
        this.stopAutoSave();
        this.roundDataMap.clear();
        this.uploadedRounds.clear();
        this.currentRound = null;
    }
}

