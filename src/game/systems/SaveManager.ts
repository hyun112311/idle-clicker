import { UpgradeManager } from './UpgradeManager';
import type { GameSaveData } from './UpgradeManager';
import { GameConfig } from '../config/GameConfig';

export class SaveManager {
    private upgradeManager: UpgradeManager;
    private saveKey: string;

    constructor(upgradeManager: UpgradeManager) {
        this.upgradeManager = upgradeManager;
        this.saveKey = GameConfig.SAVE_KEY;

        // Auto-save on window close
        window.onbeforeunload = () => {
            this.save();
        };
    }

    public save() {
        const data = this.upgradeManager.toObject();
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            console.log('Game Saved');
        } catch (e) {
            console.error('Failed to save game', e);
        }
    }

    public load(): boolean {
        try {
            const json = localStorage.getItem(this.saveKey);
            if (!json) return false;

            const data = JSON.parse(json) as GameSaveData;
            this.upgradeManager.fromObject(data);

            // Check offline progress
            this.checkOfflineProgress(data.lastSaveTime);
            return true;
        } catch (e) {
            console.error('Failed to load game', e);
            return false;
        }
    }

    private checkOfflineProgress(lastTime: number) {
        const now = Date.now();
        const diffMS = now - lastTime;
        const diffSeconds = Math.floor(diffMS / 1000);

        if (diffSeconds > 60) { // Only count if away for more than 1 minute
            // Apply gold multiplier to offline damage? Usually auto-damage yields gold per kill, but let's approximate.
            // If AutoDamage is DPS, then we get Gold per second roughly equal to DPS * GoldMultiplier (assuming 1 HP = 1 Gold ratio roughly, or strict reward).
            // Actually, gold comes from kills.
            // Approximation: Offline Gold = (AutoDamage / AverageEnemyHP) * GoldPerkill * Seconds.
            // Simpler: Offline Gold = AutoDamage * Seconds * GoldMultiplier * 0.5 (Conservative estimate).

            // Let's keep it simple: Raw Gold = AutoDamage * Seconds.
            // If AutoDamage is 0, no offline progress.
            if (this.upgradeManager.autoDamage > 0) {
                const earnedGold = this.upgradeManager.autoDamage * diffSeconds * this.upgradeManager.getTotalGoldMultiplier();
                this.upgradeManager.addGold(earnedGold);

                // Show Popup (We need a way to tell GameScene or UIManager)
                // We can emit an event from UpgradeManager?
                this.upgradeManager.emit('offline-gold', earnedGold, diffSeconds);
            }
        }
    }
}
