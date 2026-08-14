import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { UIManager } from '../ui/UIManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { SaveManager } from '../systems/SaveManager';
import { SoundManager } from '../systems/SoundManager';
import { GameConfig } from '../config/GameConfig';

export class GameScene extends Phaser.Scene {
    private building!: Building;
    private uiManager!: UIManager;
    private upgradeManager!: UpgradeManager;
    private saveManager!: SaveManager;
    private soundManager!: SoundManager;
    private mouseClickEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    private isBossFight: boolean = false;
    private bossTimerEvent: Phaser.Time.TimerEvent | null = null;
    private autoAttackAccumulator: number = 0;

    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('building', 'assets/building.png');
        this.load.image('bg', 'assets/background.png');
        this.load.image('particle', 'assets/particle.png');

        // Audio
        this.load.audio('click', 'assets/audio/click.wav');
        this.load.audio('crit', 'assets/audio/crit.wav');
        this.load.audio('buy', 'assets/audio/buy.wav');
        this.load.audio('boss_spawn', 'assets/audio/boss_spawn.wav');
        this.load.audio('boss_defeat', 'assets/audio/boss_defeat.wav');
    }

    create() {
        // Add background
        const bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        this.soundManager = new SoundManager(this);
        this.upgradeManager = new UpgradeManager();
        this.uiManager = new UIManager(this);
        this.saveManager = new SaveManager(this.upgradeManager);

        // Setup UI Events (Must be before load to catch offline-gold event)
        this.uiManager.setupListeners(this.upgradeManager);

        // Load Game Data
        this.saveManager.load();

        // Mouse Click Particles Emitter
        this.mouseClickEmitter = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            lifespan: 200,
            emitting: false,
            quantity: 5
        });

        // Bind UI Events
        this.uiManager.bindUpgradeCallbacks(
            () => this.handleUpgrade('click'),
            () => this.handleUpgrade('crit'),
            () => this.handleUpgrade('gold'),
            () => this.handleSkill(),
            () => this.handlePrestigeRequest()
        );

        this.uiManager.bindCoworkerCallback((id: string) => {
            if (this.upgradeManager.hireCoworker(id)) {
                this.soundManager.play('buy');
                this.saveManager.save();
            }
        });

        this.uiManager.bindArtifactCallbacks(
            () => this.handleArtifact('goldenCard'),
            () => this.handleArtifact('espresso')
        );

        this.uiManager.bindBeanUpgradeCallbacks(
            () => this.handleBeanUpgrade('startingGold'),
            () => this.handleBeanUpgrade('damage'),
            () => this.handleBeanUpgrade('autoSpeed')
        );

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.spawnClickParticles(pointer.x, pointer.y);
        });

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height * 0.375; // Initial center of 75% zone

        // Pass a callback to get damage so we can use current stats
        this.building = new Building(this, centerX, centerY, this.uiManager, () => this.calculateClickDamage());

        // Restore Stage Visuals
        this.building.updateStats(false);

        // Listen for Layout Changes
        this.events.on('ui-toggled', (data: { y: number, scale: number } | number) => {
            if (this.building) {
                // Backward compatibility just in case
                if (typeof data === 'number') {
                    this.building.updateLayoutPosition(data, 1);
                } else {
                    this.building.updateLayoutPosition(data.y, data.scale);
                }
            }
        });

        // Listen for enemy death
        this.building.on('enemy-died', (baseGold: number) => {
            this.handleEnemyDeath(baseGold);
        });

        // Auto Save
        this.time.addEvent({
            delay: GameConfig.AUTO_SAVE_INTERVAL,
            callback: () => this.saveManager.save(),
            loop: true
        });
    }

    private spawnClickParticles(x: number, y: number) {
        this.soundManager.play('click');
        this.mouseClickEmitter.setPosition(x, y);
        this.mouseClickEmitter.explode();
    }

    private handleUpgrade(type: string) {
        let success = false;
        switch (type) {
            case 'click': success = this.upgradeManager.purchaseClickUpgrade(); break;
            case 'crit': success = this.upgradeManager.purchaseCritUpgrade(); break;
            case 'gold': success = this.upgradeManager.purchaseGoldUpgrade(); break;
        }
        if (success) this.soundManager.play('buy');
    }

    private handleSkill() {
        this.upgradeManager.activateSkill(this.time.now);
    }

    private handleArtifact(type: string) {
        if (type === 'goldenCard' || type === 'espresso') {
            if (this.upgradeManager.purchaseArtifact(type)) {
                this.soundManager.play('buy');
            }
        }
    }

    private handlePrestigeRequest() {
        // Check if unlocked or has beans
        if (this.upgradeManager.maxStage < GameConfig.PRESTIGE_UNLOCK_STAGE && this.upgradeManager.beans === 0) return;

        const potentialBeans = this.upgradeManager.getPotentialBeans();

        this.uiManager.showPrestigeConfirmation(potentialBeans, () => {
            this.upgradeManager.prestige();
            this.saveManager.save();
            // Force respawn to reset visuals
            this.building.spawn(1, false);
        });
    }

    private handleBeanUpgrade(type: 'startingGold' | 'damage' | 'autoSpeed') {
        if (this.upgradeManager.purchaseBeanUpgrade(type)) {
            this.soundManager.play('buy');
            this.saveManager.save();
        }
    }

    private handleEnemyDeath(baseGold: number) {
        // 1. Give Gold (Apply Multipliers)
        const totalGold = baseGold * this.upgradeManager.getTotalGoldMultiplier();
        this.upgradeManager.addGold(totalGold); // Emits event

        // 2. Progression Logic
        if (this.isBossFight) {
            // Boss Defeated!
            this.soundManager.play('boss_defeat');
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
        this.soundManager.play('boss_spawn');
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
        this.soundManager.play('crit');
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

    private onAutoAttack(baseDamage: number) {
        let damage = baseDamage;

        if (damage <= 0) return;

        // Global Multiplier (Beans)
        damage *= this.upgradeManager.getGlobalDamageMultiplier();

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

    update(time: number, delta: number) {
        // Auto DPS
        const totalDPS = this.upgradeManager.getTotalCoworkerDPS();
        if (totalDPS > 0) {
            this.autoAttackAccumulator += delta;
            // The delay can decrease below 1000 via Bean upgrades
            const delay = this.upgradeManager.getAutoAttackDelay();
            if (this.autoAttackAccumulator >= delay) {
                this.onAutoAttack(totalDPS);
                this.autoAttackAccumulator -= delay; // Keeps remainder for precision
            }
        } else {
            this.autoAttackAccumulator = 0;
        }

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
