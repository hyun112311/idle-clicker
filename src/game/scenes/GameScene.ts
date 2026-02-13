
import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { UIManager } from '../ui/UIManager';
import { UpgradeManager } from '../systems/UpgradeManager';

export class GameScene extends Phaser.Scene {
    private building!: Building;
    private uiManager!: UIManager;
    private upgradeManager!: UpgradeManager;

    // Boss State
    private isBossFight: boolean = false;
    private bossTimerEvent: Phaser.Time.TimerEvent | null = null;
    private readonly BOSS_TIME_LIMIT: number = 30000;

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

        this.uiManager.bindUpgradeCallbacks(
            () => this.onBuyClickUpgrade(),
            () => this.onBuyAutoUpgrade(),
            () => this.onBuyCritUpgrade(),
            () => this.onBuyGoldUpgrade(),
            () => this.onActivateSkill()
        );

        this.uiManager.bindArtifactCallbacks(
            () => this.onBuyArtifactCard(),
            () => this.onBuyArtifactEspresso()
        );

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height * 0.25; // Top 25% (Matches Building target)

        // Pass a callback to get damage so we can use current stats
        this.building = new Building(this, centerX, centerY, this.uiManager, () => this.calculateClickDamage());

        // Update UI only AFTER building is created
        this.updateUI();

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
    }

    private handleEnemyDeath(baseGold: number) {
        // 1. Give Gold (Apply Multipliers)
        const totalGold = baseGold * this.upgradeManager.getTotalGoldMultiplier();
        this.uiManager.addGold(totalGold);

        // 2. Progression Logic
        if (this.isBossFight) {
            // Boss Defeated!
            this.upgradeManager.advanceStage();
            this.isBossFight = false;

            // Drop Stocks (1-3)
            const stocks = Phaser.Math.Between(1, 3);
            this.upgradeManager.addStocks(stocks);

            // Cleanup Timer
            if (this.bossTimerEvent) {
                this.bossTimerEvent.remove();
                this.bossTimerEvent = null;
            }

            // Big Explosion for Boss
            this.cameras.main.shake(500, 0.02);
        } else {
            // Normal Enemy Defeated
            this.upgradeManager.addKill();
        }

        this.updateUI();

        // 3. Determine Next State & Spawn
        // Check if next one should be a boss
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
        // Ensure timer is clear if we are spawning a normal enemy (e.g. after boss loss reset)
        // But startBossFight sets the timer. 
        // If we are here, we are about to spawn.
        this.building.spawn(this.upgradeManager.stage, this.isBossFight);
        this.updateUI();
    }

    private startBossFight() {
        // Set Timer
        this.bossTimerEvent = this.time.addEvent({
            delay: this.BOSS_TIME_LIMIT,
            callback: this.failBossFight,
            callbackScope: this
        });
    }

    private failBossFight() {
        if (!this.isBossFight) return;

        // Reset Logic
        this.isBossFight = false;
        this.upgradeManager.failBoss(); // Reset kills

        // Reset Building (Visuals handled by spawn, but we need to force respawn/heal if it wasn't dead?)
        // Actually, if timer runs out, the building is still alive but we need to "replace" it with normal enemy.
        // Or simply heal it and change stats?
        // Easiest is to force respawn logic in Building via a method, but Building spawns on death.
        // Let's call a method on Building to reset it.
        this.building.resetToNormal(this.upgradeManager.stage);

        this.cameras.main.shake(200, 0.01); // Small shake on fail
        this.updateUI();
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

    private onBuyClickUpgrade() {
        const result = this.upgradeManager.purchaseClickUpgrade(this.uiManager.getGold());
        if (result.success) {
            this.uiManager.spendGold(result.cost);
            this.updateUI();
        }
    }

    private onBuyAutoUpgrade() {
        const result = this.upgradeManager.purchaseAutoUpgrade(this.uiManager.getGold());
        if (result.success) {
            this.uiManager.spendGold(result.cost);
            this.updateUI();
        }
    }

    private onBuyCritUpgrade() {
        const result = this.upgradeManager.purchaseCritUpgrade(this.uiManager.getGold());
        if (result.success) {
            this.uiManager.spendGold(result.cost);
            this.updateUI();
        }
    }

    private onBuyGoldUpgrade() {
        const result = this.upgradeManager.purchaseGoldUpgrade(this.uiManager.getGold());
        if (result.success) {
            this.uiManager.spendGold(result.cost);
            this.updateUI();
        }
    }

    private onActivateSkill() {
        if (this.upgradeManager.activateSkill(this.time.now)) {
            this.updateUI();
        }
    }

    private onBuyArtifactCard() {
        if (this.upgradeManager.purchaseArtifact('goldenCard')) {
            this.updateUI();
        }
    }

    private onBuyArtifactEspresso() {
        if (this.upgradeManager.purchaseArtifact('espresso')) {
            this.updateUI();
        }
    }

    private updateUI() {
        this.uiManager.updateButtons(
            this.uiManager.getGold(),
            this.upgradeManager.clickUpgradeCost,
            this.upgradeManager.autoUpgradeCost,
            this.upgradeManager.critUpgradeCost,
            this.upgradeManager.goldUpgradeCost,
            this.upgradeManager.critRate,
            this.upgradeManager.goldMultiplier
        );

        this.uiManager.updateArtifacts(
            this.upgradeManager.stocks,
            this.upgradeManager.artifactGoldenCard,
            this.upgradeManager.artifactEspresso
        );

        const currentBossTimer = (this.isBossFight && this.bossTimerEvent)
            ? this.bossTimerEvent.getRemaining()
            : undefined;

        this.uiManager.updateStageInfo(
            this.upgradeManager.stage,
            this.upgradeManager.enemiesKilled,
            this.upgradeManager.ENEMIES_PER_STAGE,
            currentBossTimer
        );

        // Pass info to building for HP bar scaling?
        // Building needs to know Max HP based on Stage and Boss status.
        // We probably need to update Building stats whenever Stage changes or Boss starts.
        this.building.updateStats(this.upgradeManager.stage, this.isBossFight);
    }

    private onAutoAttack() {
        let damage = this.upgradeManager.autoDamage;
        if (damage <= 0) return;

        // Skill Multiplier for Auto
        if (this.upgradeManager.isSkillActive(this.time.now)) {
            damage *= 2;
        }

        // Crit Logic for Auto? (Requirement didn't specify, but "Doubles all damage" implies yes)
        // Let's allow crits on auto for fun/consistency
        const isCrit = Math.random() < this.upgradeManager.critRate;
        if (isCrit) {
            damage *= 2;
            this.showCritText(damage);
        }

        if (this.building) {
            this.building.damage(damage);
        }

        // UI update for gold is handled by death event now (or if we add incremental gold logic)
        this.updateUI();
    }

    update(time: number, delta: number) {
        // Continuous updates
        this.updateUI();

        // Skill Timer
        const cooldown = this.upgradeManager.getSkillCooldownRemaining(time);
        const isActive = this.upgradeManager.isSkillActive(time);
        this.uiManager.updateSkillButton(cooldown, isActive);
    }
}
