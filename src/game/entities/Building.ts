
import Phaser from 'phaser';
import { UIManager } from '../ui/UIManager';
import { GameConfig } from '../config/GameConfig';

export class Building extends Phaser.GameObjects.Container {
    private baseHealth: number = GameConfig.INITIAL_BASE_HEALTH;
    private currentHealth: number;
    private maxHealth: number;
    private goldReward: number = 1;

    private bodySprite!: Phaser.GameObjects.Rectangle;
    private uiManager: UIManager;
    private getClickDamage: () => number;

    private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, uiManager: UIManager, getClickDamage: () => number) {
        super(scene, x, y);
        this.uiManager = uiManager;
        this.getClickDamage = getClickDamage;

        // Initialize stats
        this.maxHealth = this.baseHealth;
        this.currentHealth = this.maxHealth;

        // Create visual representation (Larger 180x180)
        this.bodySprite = scene.add.rectangle(0, 0, 180, 180, 0xff0000);
        this.add(this.bodySprite);

        // Physics
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);

        // Interactive
        this.bodySprite.setInteractive();
        this.bodySprite.on('pointerdown', this.onClick, this);

        // Particles
        this.particleEmitter = scene.add.particles(0, 0, 'particle', {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 200,
            emitting: false
        });

        scene.add.existing(this);

        // Initial spawn animation
        this.spawn(1, false);
    }

    private onClick() {
        this.damage(this.getClickDamage());
    }

    public damage(amount: number) {
        if (this.currentHealth <= 0) return;

        this.currentHealth -= amount;
        this.uiManager.updateHealth(this.currentHealth, this.maxHealth);

        const healthRatio = this.currentHealth / this.maxHealth;
        this.updateVisualState(healthRatio);

        const isCriticalState = healthRatio < 0.3;
        const shakeIntensity = isCriticalState ? 10 : 5;

        // Visual feedback: Shake
        this.scene.tweens.add({
            targets: this,
            x: this.x + Phaser.Math.Between(-shakeIntensity, shakeIntensity),
            y: this.y + Phaser.Math.Between(-shakeIntensity, shakeIntensity),
            duration: 50,
            yoyo: true,
            onComplete: () => {
                this.x = this.scene.scale.width / 2; // Reset X
            }
        });

        // Visual feedback: Scale punch
        this.scene.tweens.add({
            targets: this.bodySprite,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 50,
            yoyo: true
        });

        // Particle effect on hit
        this.spawnHitParticles();

        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    private updateVisualState(ratio: number) {
        if (ratio < 0.3) {
            // Critical
            this.bodySprite.setFillStyle(0xff4444);
        } else if (ratio < 0.7) {
            // Damaged
            this.bodySprite.setFillStyle(0xffaa00);
        } else {
            // Normal
            this.bodySprite.setFillStyle(0xff0000);
        }
    }

    private spawnHitParticles() {
        this.particleEmitter.setPosition(this.x, this.y);
        this.particleEmitter.explode(10);
    }

    public resetToNormal(stage: number) {
        this.spawn(stage, false);
    }

    private die() {
        this.bodySprite.disableInteractive();

        // Death animation
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.5,
            duration: 200,
            onComplete: () => {
                this.emit('enemy-died', this.goldReward);
                this.setVisible(false);
                this.y = -500;
            }
        });
    }

    public updateStats(isBoss: boolean) {
        if (isBoss) {
            this.bodySprite.setFillStyle(0x880000);
            this.bodySprite.setScale(1.5);
        } else {
            this.bodySprite.setFillStyle(0xff0000);
            this.bodySprite.setScale(1);
        }
    }

    public spawn(stage: number = 1, isBoss: boolean = false) {
        const baseHP = Math.floor(this.baseHealth * Math.pow(GameConfig.HEALTH_GROWTH_RATE, stage - 1));
        this.maxHealth = isBoss ? baseHP * 10 : baseHP;
        this.goldReward = Math.ceil(stage * 1.5 * (isBoss ? 10 : 1));

        this.currentHealth = this.maxHealth;
        this.uiManager.updateHealth(this.currentHealth, this.maxHealth);

        // Reset state
        this.setVisible(true);
        this.setAlpha(1);
        this.setScale(1);
        this.bodySprite.setInteractive();

        // Visuals
        this.updateVisualState(1);
        this.updateStats(isBoss);

        // Fall from top animation
        this.y = -200;
        this.scene.tweens.add({
            targets: this,
            y: this.scene.scale.height * 0.20, // 20% Height
            duration: 600,
            ease: 'Bounce.Out'
        });
    }
}
