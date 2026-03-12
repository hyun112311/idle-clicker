
import Phaser from 'phaser';
import { UIManager } from '../ui/UIManager';
import { GameConfig } from '../config/GameConfig';

export class Building extends Phaser.GameObjects.Container {
    private baseHealth: number = GameConfig.INITIAL_BASE_HEALTH;
    private currentHealth: number;
    private maxHealth: number;
    private goldReward: number = 1;

    private bodySprite!: Phaser.GameObjects.Sprite;
    private uiManager: UIManager;
    private getClickDamage: () => number;

    private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    private landingY: number;

    constructor(scene: Phaser.Scene, x: number, y: number, uiManager: UIManager, getClickDamage: () => number) {
        super(scene, x, y);
        this.uiManager = uiManager;
        this.getClickDamage = getClickDamage;
        this.landingY = y; // Store initial Y as landing target

        // Initialize stats
        this.maxHealth = this.baseHealth;
        this.currentHealth = this.maxHealth;

        // Create visual representation (Larger 180x180)
        this.bodySprite = scene.add.sprite(0, 0, 'building');
        this.bodySprite.setDisplaySize(180, 180);
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

    public updateLayoutPosition(y: number, scale: number) {
        this.landingY = y;
        this.scene.tweens.add({
            targets: this,
            y: y,
            scale: scale, // Zoom effect
            duration: 400,
            ease: 'Power2'
        });
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
            x: this.scene.scale.width / 2 + Phaser.Math.Between(-shakeIntensity, shakeIntensity), // Keep X centered
            y: this.landingY + Phaser.Math.Between(-shakeIntensity, shakeIntensity), // Shake around landingY
            duration: 50,
            yoyo: true,
            onComplete: () => {
                this.x = this.scene.scale.width / 2; // Reset X
                this.y = this.landingY; // Reset Y
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
            this.bodySprite.setTint(0xff4444);
        } else if (ratio < 0.7) {
            // Damaged
            this.bodySprite.setTint(0xffaa00);
        } else {
            // Normal
            this.bodySprite.clearTint();
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
            this.bodySprite.setTint(0xff0000);
            this.bodySprite.setScale(1.5);
        } else {
            this.bodySprite.clearTint();
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
            y: this.landingY, // Use stored landing position
            duration: 600,
            ease: 'Bounce.Out'
        });
    }
}
