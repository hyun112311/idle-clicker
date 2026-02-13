import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { UIManager } from '../ui/UIManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { SaveManager } from '../systems/SaveManager';
import { GameConfig } from '../config/GameConfig';

export class GameScene extends Phaser.Scene {
    private building!: Building;
    private uiManager!: UIManager;
    private upgradeManager!: UpgradeManager;
    private saveManager!: SaveManager;

    // Boss State
    private isBossFight: boolean = false;
    private bossTimerEvent: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('GameScene');
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 8, 8);
        graphics.generateTexture('particle', 8, 8);
    }

    create() {
        this.upgradeManager = new UpgradeManager();
        this.uiManager = new UIManager(this);
        this.saveManager = new SaveManager(this.upgradeManager);

        // Load Game Data
        this.saveManager.load();

        // Setup UI Events
        this.uiManager.setupListeners(this.upgradeManager);

        this.uiManager.bindUpgradeCallbacks(
            () => this.upgradeManager.purchaseClickUpgrade(),
            () => this.upgradeManager.purchaseAutoUpgrade(),
            () => this.upgradeManager.purchaseCritUpgrade(),
            () => this.upgradeManager.purchaseGoldUpgrade(),
            () => this.onActivateSkill()
        );

        this.uiManager.bindArtifactCallbacks(
            () => this.upgradeManager.purchaseArtifact('goldenCard'),
            () => this.upgradeManager.purchaseArtifact('espresso')
        );

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height * 0.25;

        // Pass a callback to get damage so we can use current stats
        this.building = new Building(this, centerX, centerY, this.uiManager, () => this.calculateClickDamage());

        // Restore Stage Visuals
        this.building.updateStats(false);

        // Listen for enemy death
        this.building.on('enemy-died', (baseGold: number) => {
            this.handleEnemyDeath(baseGold);
        });

        this.time.addEvent({
            delay: 1000,
            callback: this.onAutoAttack,
            callbackScope: this,
            loop: true
        });

        // Auto Save
        this.time.addEvent({
            delay: GameConfig.AUTO_SAVE_INTERVAL,
            callback: () => this.saveManager.save(),
            loop: true
        });
    }

    private handleEnemyDeath(baseGold: number) {
        // 1. Give Gold (Apply Multipliers)
        const totalGold = baseGold * this.upgradeManager.getTotalGoldMultiplier();
        this.upgradeManager.addGold(totalGold); // Emits event

        // 2. Progression Logic
        if (this.isBossFight) {
            // Boss Defeated!
            this.upgradeManager.advanceStage(); // Emits event
            this.isBossFight = false;

            // Drop Stocks
            const stocks = Phaser.Math.Between(1, 3);
            this.upgradeManager.addStocks(stocks); // Emits event

            // Cleanup Timer
            if (this.bossTimerEvent) {
                this.bossTimerEvent.remove();
                this.bossTimerEvent = null;
            }

            // Big Explosion for Boss
            this.cameras.main.shake(500, 0.02);
        } else {
            // Normal Enemy Defeated
            this.upgradeManager.addKill(); // Emits event
        }

        // 3. Determine Next State & Spawn
        if (!this.isBossFight && this.upgradeManager.isBossReady()) {
            this.isBossFight = true;
            this.startBossFight();
        }

        // Spawn next enemy after a short delay
        this.time.delayedCall(500, () => {
            this.spawnNextEnemy();
        });
    }

    private spawnNextEnemy() {
        this.building.spawn(this.upgradeManager.stage, this.isBossFight);
    }

    private startBossFight() {
        // Set Timer
        this.bossTimerEvent = this.time.addEvent({
            delay: GameConfig.BOSS_TIME_LIMIT,
            callback: this.failBossFight,
            callbackScope: this
        });
    }

    private failBossFight() {
        if (!this.isBossFight) return;

        // Reset Logic
        this.isBossFight = false;
        this.upgradeManager.failBoss(); // Emits event

        // Reset Building
        this.building.resetToNormal(this.upgradeManager.stage);

        this.cameras.main.shake(200, 0.01);
    }

    private calculateClickDamage(): number {
        let damage = this.upgradeManager.clickDamage;

        // Skill Multiplier
        if (this.upgradeManager.isSkillActive(this.time.now)) {
            damage *= 2;
        }

        // Crit Logic
        const isCrit = Math.random() < this.upgradeManager.critRate;
        if (isCrit) {
            damage *= 2;
            this.showCritText(damage);
            this.cameras.main.shake(100, 0.01); // Crit Shake
        }

        return damage;
    }

    private showCritText(amount: number) {
        const x = this.scale.width / 2 + Phaser.Math.Between(-50, 50);
        const y = this.scale.height / 2 - 50;

        const text = this.add.text(x, y, `CRIT! ${amount}`, {
            fontFamily: 'Arial', fontSize: '32px', color: '#ff0000', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    // Callbacks provided directly in create now, except skill which needs time

    private onActivateSkill() {
        if (this.upgradeManager.activateSkill(this.time.now)) {
            // UI updated by event
        }
    }

    private onAutoAttack() {
        let damage = this.upgradeManager.autoDamage;
        if (damage <= 0) return;

        // Skill Multiplier for Auto
        if (this.upgradeManager.isSkillActive(this.time.now)) {
            damage *= 2;
        }

        // Crit Logic for Auto
        const isCrit = Math.random() < this.upgradeManager.critRate;
        if (isCrit) {
            damage *= 2;
            this.showCritText(damage);
        }

        if (this.building) {
            this.building.damage(damage);
        }
        // Gold/UI updated via death event
    }

    update(time: number) {
        // Skill Timer
        const cooldown = this.upgradeManager.getSkillCooldownRemaining(time);
        const isActive = this.upgradeManager.isSkillActive(time);
        this.uiManager.updateSkillButton(cooldown, isActive);

        // Boss Timer (Continuous Update)
        if (this.isBossFight && this.bossTimerEvent) {
            const remaining = this.bossTimerEvent.getRemaining();
            this.uiManager.updateStageInfo(
                this.upgradeManager.stage,
                this.upgradeManager.enemiesKilled,
                GameConfig.ENEMIES_PER_STAGE,
                remaining
            );
        }
    }
}
