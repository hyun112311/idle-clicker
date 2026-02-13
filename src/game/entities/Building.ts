
import Phaser from 'phaser';
import { UIManager } from '../ui/UIManager';

export class Building extends Phaser.GameObjects.Container {
    private baseHealth: number = 10;
    private currentHealth: number;
    private maxHealth: number;
    private goldReward: number = 1;
    private level: number = 1;

    private bodySprite: Phaser.GameObjects.Rectangle;
    private uiManager: UIManager;

    private getClickDamage: () => number;

    constructor(scene: Phaser.Scene, x: number, y: number, uiManager: UIManager, getClickDamage: () => number) {
        super(scene, x, y);
        this.uiManager = uiManager;
        this.getClickDamage = getClickDamage;

        // Initialize stats
        this.maxHealth = this.baseHealth;
        this.currentHealth = this.maxHealth;

        // Create visual representation (Square box)
        this.bodySprite = scene.add.rectangle(0, 0, 150, 150, 0xff0000);
        this.add(this.bodySprite);

        // Physics
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);

        // Interactive
        this.bodySprite.setInteractive();
        this.bodySprite.on('pointerdown', this.onClick, this);

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

        // Visual feedback: Shake
        this.scene.tweens.add({
            targets: this,
            x: this.x + Phaser.Math.Between(-5, 5),
            y: this.y + Phaser.Math.Between(-5, 5),
            duration: 50,
            yoyo: true,
            onComplete: () => {
                this.x = this.scene.scale.width / 2; // Reset X
                // Keep Y consistent if needed, or reset to original
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

        // Particle effect on hit (simple)
        this.spawnHitParticles();

        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    private spawnHitParticles() {
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 200,
            emitting: false
        });
        particles.explode(10);
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
                // Just emit. GameScene handles rewards and respawning.
                this.emit('enemy-died', this.goldReward);

                // Hide until respawned
                this.setVisible(false);
                this.y = -500;
            }
        });
    }

    public updateStats(stage: number, isBoss: boolean) {
        // Just update visuals based on state, don't change HP mid-fight unless needed
        if (isBoss) {
            this.bodySprite.setFillStyle(0x880000);
            this.bodySprite.setScale(1.5);
        } else {
            this.bodySprite.setFillStyle(0xff0000);
            this.bodySprite.setScale(1);
        }
    }

    public spawn(stage: number = 1, isBoss: boolean = false) {
        const baseHP = Math.floor(this.baseHealth * Math.pow(1.5, stage - 1));
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
        this.updateStats(stage, isBoss);

        // Fall from top animation
        this.y = -200;
        this.scene.tweens.add({
            targets: this,
            y: this.scene.scale.height * 0.25, // Target 25% height
            duration: 600,
            ease: 'Bounce.Out'
        });
    }
}
