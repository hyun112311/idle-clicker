
import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class UIManager {
    private scene: Phaser.Scene;

    // UI Containers
    private healthBarContainer!: Phaser.GameObjects.Container;
    private healthBarBg!: Phaser.GameObjects.Rectangle;
    private healthBarFill!: Phaser.GameObjects.Rectangle;

    // Text Elements
    private goldText!: Phaser.GameObjects.Text;
    private stocksText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private buffText!: Phaser.GameObjects.Text;
    private bossTimerText!: Phaser.GameObjects.Text;

    // Stats Buttons
    private clickUpgradeBtn!: Phaser.GameObjects.Container;
    private autoUpgradeBtn!: Phaser.GameObjects.Container;
    private critUpgradeBtn!: Phaser.GameObjects.Container;
    private goldUpgradeBtn!: Phaser.GameObjects.Container;

    private clickUpgradeText!: Phaser.GameObjects.Text;
    private autoUpgradeText!: Phaser.GameObjects.Text;
    private critUpgradeText!: Phaser.GameObjects.Text;
    private goldUpgradeText!: Phaser.GameObjects.Text;

    // Artifact Buttons
    private artifactCardBtn!: Phaser.GameObjects.Container;
    private artifactEspressoBtn!: Phaser.GameObjects.Container;
    private artifactCardText!: Phaser.GameObjects.Text;
    private artifactEspressoText!: Phaser.GameObjects.Text;

    // Skill Button
    private skillBtn!: Phaser.GameObjects.Container;
    private skillText!: Phaser.GameObjects.Text;
    private skillOverlay!: Phaser.GameObjects.Rectangle;
    private skillTimerText!: Phaser.GameObjects.Text;

    // Layout Constants
    private readonly TOP_ZONE_HEIGHT_RATIO = 0.55;
    private readonly HUD_BAR_HEIGHT = 60;

    // Prestige
    private prestigeBtn!: Phaser.GameObjects.Container;
    private prestigeText!: Phaser.GameObjects.Text;

    // Button Fills (Map key to rectangle)
    private buttonFills: Map<string, Phaser.GameObjects.Rectangle> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const topZoneH = height * this.TOP_ZONE_HEIGHT_RATIO;

        // --- Top Zone (Gameplay) ---

        // Level/Stage Text (Top 5% - With Stroke)
        this.levelText = this.scene.add.text(width / 2, height * 0.05, 'Stage 1 - 0/10', {
            fontFamily: 'Arial', fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        // Health Bar (Top 10%)
        this.healthBarContainer = this.scene.add.container(width / 2, height * 0.10);
        this.healthBarBg = this.scene.add.rectangle(0, 0, 200, 30, 0x333333).setStrokeStyle(2, 0x000000);
        this.healthBarFill = this.scene.add.rectangle(0, 0, 196, 26, 0xff0000);
        this.healthBarFill.setOrigin(0, 0.5);
        this.healthBarFill.x = -98;
        this.healthBarContainer.add([this.healthBarBg, this.healthBarFill]);

        // Boss Timer (Just below Health Bar)
        this.bossTimerText = this.scene.add.text(width / 2, height * 0.14, '', {
            fontFamily: 'Arial', fontSize: '22px', color: '#ff0000', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        // Buff Indicator (Top 25%)
        this.buffText = this.scene.add.text(width / 2, height * 0.25, 'BUFF ACTIVE!', {
            fontFamily: 'Arial', fontSize: '22px', color: '#00ff00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setVisible(false);


        // --- HUD Bar (Bottom of Top Zone) ---
        // consolidated bar for Gold & Stocks
        const hudY = topZoneH - 30;
        const hudBg = this.scene.add.rectangle(width / 2, hudY, width * 0.95, this.HUD_BAR_HEIGHT, 0x000000, 0.5)
            .setStrokeStyle(2, 0xffd700);

        this.goldText = this.scene.add.text(width * 0.3, hudY, 'Gold: 0', {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffd700', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.stocksText = this.scene.add.text(width * 0.7, hudY, 'Stocks: 0', {
            fontFamily: 'Arial', fontSize: '24px', color: '#00ff00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);


        // --- Bottom Zone (UI) ---

        const startY = topZoneH + 40;
        const btnHeight = 50;
        const gap = 15;

        // Row 1: Click & Auto
        this.clickUpgradeBtn = this.createButton(width * 0.25, startY, width * 0.45, btnHeight, 'Click Dmg', '#444444', 'click');
        this.autoUpgradeBtn = this.createButton(width * 0.75, startY, width * 0.45, btnHeight, 'Auto Dmg', '#444444', 'auto');

        // Row 2: Crit & Gold
        this.critUpgradeBtn = this.createButton(width * 0.25, startY + btnHeight + gap, width * 0.45, btnHeight, 'Crit Rate', '#444444', 'crit');
        this.goldUpgradeBtn = this.createButton(width * 0.75, startY + btnHeight + gap, width * 0.45, btnHeight, 'Gold Drop', '#444444', 'gold');

        // --- Artifact Section ---
        const artifactY = startY + (btnHeight + gap) * 2 + 20;

        this.artifactCardBtn = this.createButton(width * 0.25, artifactY, width * 0.45, btnHeight, 'Gold Card', '#664400', 'card');
        this.artifactEspressoBtn = this.createButton(width * 0.75, artifactY, width * 0.45, btnHeight, 'Espresso', '#664400', 'espresso');

        // Text References (Index 3 is text because of bg and fill added in createButton)
        this.clickUpgradeText = this.clickUpgradeBtn.getAt(3) as Phaser.GameObjects.Text;
        this.autoUpgradeText = this.autoUpgradeBtn.getAt(3) as Phaser.GameObjects.Text;
        this.critUpgradeText = this.critUpgradeBtn.getAt(3) as Phaser.GameObjects.Text;
        this.goldUpgradeText = this.goldUpgradeBtn.getAt(3) as Phaser.GameObjects.Text;
        this.artifactCardText = this.artifactCardBtn.getAt(3) as Phaser.GameObjects.Text;
        this.artifactEspressoText = this.artifactEspressoBtn.getAt(3) as Phaser.GameObjects.Text;

        // --- Prestige Button ---
        const prestigeY = artifactY + btnHeight + gap + 10;
        this.prestigeBtn = this.createButton(width / 2, prestigeY, width * 0.9, 40, 'REBIRTH (Stage 10+)', '#550055', 'prestige');
        this.prestigeText = this.prestigeBtn.getAt(3) as Phaser.GameObjects.Text;
        this.prestigeBtn.setVisible(false); // Hide initially

        // --- Skills Section ---
        const skillY = height - 50;
        this.skillBtn = this.createButton(width / 2, skillY, width * 0.9, 50, 'Coffee Rush (Active)', '#004488', 'skill');
        this.skillText = this.skillBtn.getAt(3) as Phaser.GameObjects.Text;

        // Cooldown Overlay
        this.skillOverlay = this.scene.add.rectangle(0, 0, width * 0.9, 50, 0x000000, 0.7).setOrigin(0.5).setVisible(false);
        this.skillTimerText = this.scene.add.text(0, 0, '', { fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setVisible(false);
        this.skillBtn.add([this.skillOverlay, this.skillTimerText]);
    }

    private createButton(x: number, y: number, w: number, h: number, text: string, color: string, id: string): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);

        // Background (Base)
        const bg = this.scene.add.rectangle(0, 0, w, h, Phaser.Display.Color.HexStringToColor(color).color)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x000000);

        // Progress Fill (Empty initially)
        const fill = this.scene.add.rectangle(-w / 2, 0, 0, h, 0xffffff, 0.2).setOrigin(0, 0.5);
        this.buttonFills.set(id, fill);

        // Glow Border (Hidden)
        const glow = this.scene.add.rectangle(0, 0, w + 4, h + 4, 0x000000, 0).setStrokeStyle(4, 0xffd700).setVisible(false);
        container.setData('glow', glow);

        const txt = this.scene.add.text(0, 0, text, {
            fontSize: '14px', color: '#fff', align: 'center', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        container.add([bg, fill, glow, txt]);
        container.setData('bg', bg);
        return container;
    }


    // --- Bindings & Events ---

    public setupListeners(upgradeManager: any) { // Use 'any' or specific Type if available but circular dep might be issue.
        // Actually specific type is fine if we import it as type only or careful with imports.
        // Let's assume passed object has the events.

        // Gold
        upgradeManager.on('gold-changed', (gold: number) => {
            this.goldText.setText(`Gold: ${Math.floor(gold)}`);
            this.updateButtonAvailability(upgradeManager);
        });

        // Stocks
        upgradeManager.on('stocks-changed', (stocks: number) => {
            this.stocksText.setText(`Stocks: ${stocks}`);
            this.updateArtifactAvailability(upgradeManager);
        });

        // Stats (Costs/Values)
        upgradeManager.on('stats-changed', (mgr: any) => {
            this.updateStatsDisplay(mgr);
            this.updateButtonAvailability(mgr);
        });

        // Progression
        upgradeManager.on('progression-changed', (kills: number, stage: number) => {
            this.updateStageInfo(stage, kills, GameConfig.ENEMIES_PER_STAGE);
        });

        // Artifacts
        upgradeManager.on('artifacts-changed', (mgr: any) => {
            this.updateArtifactDisplay(mgr);
        });

        // Offline Gold
        upgradeManager.on('offline-gold', (amount: number, seconds: number) => {
            this.showOfflinePopup(amount, seconds);
        });

        // Initial Update
        this.updateStatsDisplay(upgradeManager);
        this.updateArtifactDisplay(upgradeManager);
        this.updateButtonAvailability(upgradeManager);
        this.goldText.setText(`Gold: ${Math.floor(upgradeManager.gold)}`);
        this.stocksText.setText(`Stocks: ${upgradeManager.stocks}`);
        this.updateStageInfo(upgradeManager.stage, upgradeManager.enemiesKilled, GameConfig.ENEMIES_PER_STAGE);
    }

    private updateArtifactDisplay(mgr: any) {
        // Cards
        const cardCost = 5;
        this.artifactCardText.setText(`Gold Card\nPrice: ${cardCost} Stocks\n(Owned: ${mgr.artifactGoldenCard})`);

        // Espresso
        const espressoCost = 10;
        this.artifactEspressoText.setText(`Espresso\nPrice: ${espressoCost} Stocks\n(Owned: ${mgr.artifactEspresso})`);
    }

    public bindUpgradeCallbacks(
        onClick: () => void,
        onAuto: () => void,
        onCrit: () => void,
        onGold: () => void,
        onSkill: () => void,
        onPrestige: () => void
    ) {
        (this.clickUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onClick);
        (this.autoUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onAuto);
        (this.critUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onCrit);
        (this.goldUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onGold);
        (this.skillBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onSkill);
        (this.prestigeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onPrestige);
    }

    // ... Artifact Bindings ...

    // --- Visual Updates ---

    private updatePrestigeDisplay(mgr: any) {
        const potentialBeans = mgr.getPotentialBeans();

        // Show button if reached unlock stage OR already have beans (meaning already prestiged)
        if (mgr.maxStage >= 10 || mgr.beans > 0) {
            this.prestigeBtn.setVisible(true);
            this.prestigeText.setText(`REBIRTH\n(+${potentialBeans} Beans)`);

            // Rebirth needs at least 1 bean to be worth it
            this.prestigeBtn.setAlpha(potentialBeans > 0 ? 1 : 0.5);
        } else {
            this.prestigeBtn.setVisible(false);
        }
    }

    private updateButtonAvailability(mgr: any) {
        const gold = mgr.gold;

        this.updateButtonVisuals(this.clickUpgradeBtn, 'click', gold, mgr.clickUpgradeCost);
        this.updateButtonVisuals(this.autoUpgradeBtn, 'auto', gold, mgr.autoUpgradeCost);
        this.updateButtonVisuals(this.critUpgradeBtn, 'crit', gold, mgr.critUpgradeCost, mgr.critRate >= 0.5);
        this.updateButtonVisuals(this.goldUpgradeBtn, 'gold', gold, mgr.goldUpgradeCost);
    }

    private updateArtifactAvailability(mgr: any) {
        const stocks = mgr.stocks;
        this.updateButtonVisuals(this.artifactCardBtn, 'card', stocks, 5, false, true); // Cost 5
        this.updateButtonVisuals(this.artifactEspressoBtn, 'espresso', stocks, 10, false, true); // Cost 10
    }

    private updateButtonVisuals(btn: Phaser.GameObjects.Container, id: string, current: number, cost: number, isMaxed: boolean = false, isStock: boolean = false) {
        const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle;
        const glow = btn.getData('glow') as Phaser.GameObjects.Rectangle;
        const fill = this.buttonFills.get(id);

        if (isMaxed) {
            btn.setAlpha(0.5);
            if (glow) glow.setVisible(false);
            if (fill) fill.width = 0;
            return;
        }

        const canAfford = current >= cost;
        btn.setAlpha(canAfford ? 1 : 0.8);

        // Glow
        if (glow) glow.setVisible(canAfford);

        // Progress Bar
        if (fill) {
            const ratio = Phaser.Math.Clamp(current / cost, 0, 1);
            // width of button is... we need to store it or get it from bg
            const width = bg.width;
            fill.width = width * ratio;
        }
    }

    // ... setupListeners mod ...
    private updateStatsDisplay(mgr: any) {
        // ... existing updates ...
        this.clickUpgradeText.setText(`Click (+1)\n$${mgr.clickUpgradeCost}`);
        this.autoUpgradeText.setText(`Auto (+1)\n$${mgr.autoUpgradeCost}`);

        const critPercent = Math.round(mgr.critRate * 100);
        this.critUpgradeText.setText(mgr.critRate >= 0.5 ? `Crit (Max)\n-` : `Crit (+5%)\n$${mgr.critUpgradeCost}\n(${critPercent}%)`);

        const goldPercent = Math.round((mgr.goldMultiplier - 1) * 100);
        this.goldUpgradeText.setText(`Gold (+10%)\n$${mgr.goldUpgradeCost}\n(+${goldPercent}%)`);

        this.updatePrestigeDisplay(mgr);
    }

    // --- Popups ---

    public showPrestigeConfirmation(beans: number, onConfirm: () => void) {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        const container = this.scene.add.container(width / 2, height / 2).setDepth(2000);

        const bg = this.scene.add.rectangle(0, 0, width * 0.8, 300, 0x220022, 0.95).setStrokeStyle(4, 0xff00ff);
        const title = this.scene.add.text(0, -100, 'PRESTIGE?', { fontSize: '32px', color: '#f0f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        const info = this.scene.add.text(0, -20, `Reset progress to gain:\n${beans} BEANS\n\n(+${beans * 2}% Global Damage)`, { align: 'center', fontSize: '20px', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);

        // Confirm Btn
        const yesBtn = this.scene.add.container(-80, 80);
        const yesBg = this.scene.add.rectangle(0, 0, 120, 50, 0x00aa00).setInteractive({ useHandCursor: true });
        const yesTxt = this.scene.add.text(0, 0, 'DO IT!', { fontSize: '20px', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
        yesBtn.add([yesBg, yesTxt]);

        // Cancel Btn
        const noBtn = this.scene.add.container(80, 80);
        const noBg = this.scene.add.rectangle(0, 0, 120, 50, 0xaa0000).setInteractive({ useHandCursor: true });
        const noTxt = this.scene.add.text(0, 0, 'CANCEL', { fontSize: '20px', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
        noBtn.add([noBg, noTxt]);

        container.add([bg, title, info, yesBtn, noBtn]);

        // Logic
        yesBg.on('pointerdown', () => {
            onConfirm();
            container.destroy();
        });

        noBg.on('pointerdown', () => {
            container.destroy();
        });

        // Pop in
        container.setScale(0);
        this.scene.tweens.add({ targets: container, scale: 1, duration: 300, ease: 'Back.Out' });
    }

    public bindArtifactCallbacks(onCard: () => void, onEspresso: () => void) {
        (this.artifactCardBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onCard);
        (this.artifactEspressoBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onEspresso);
    }

    // --- Updates ---

    public updateHealth(current: number, max: number) {
        const percent = Phaser.Math.Clamp(current / max, 0, 1);
        this.scene.tweens.add({
            targets: this.healthBarFill,
            scaleX: percent,
            duration: 100,
            ease: 'Linear'
        });
    }

    public updateSkillButton(cooldownRemaining: number, isActive: boolean) {
        if (isActive) {
            this.buffText.setVisible(true);
            this.skillText.setText("ACTIVE!");
            this.skillOverlay.setVisible(false);
            this.skillTimerText.setVisible(false);
            this.skillBtn.setAlpha(1);
        } else if (cooldownRemaining > 0) {
            this.buffText.setVisible(false);
            this.skillText.setText("Coffee Rush");
            this.skillOverlay.setVisible(true);
            this.skillTimerText.setVisible(true).setText((cooldownRemaining / 1000).toFixed(1));
            this.skillBtn.setAlpha(1);
        } else {
            this.buffText.setVisible(false);
            this.skillText.setText("Coffee Rush");
            this.skillOverlay.setVisible(false);
            this.skillTimerText.setVisible(false);
            this.skillBtn.setAlpha(1);
        }
    }

    public updateStageInfo(stage: number, kills: number, required: number, bossTime?: number) {
        if (bossTime !== undefined) {
            this.levelText.setText(`BOSS FIGHT! Stage ${stage}`);
            this.levelText.setColor('#ff0000');
            this.bossTimerText.setVisible(true).setText(`${(bossTime / 1000).toFixed(1)}s`);
            this.bossTimerText.setDepth(100);
        } else {
            this.levelText.setText(`Stage ${stage} - ${kills}/${required}`);
            this.levelText.setColor('#ffffff');
            this.bossTimerText.setVisible(false);
        }
    }

    public addGold() {
        // Just visual pop needed? Text update handled by event.
        // Animate gold text
        this.scene.tweens.add({ targets: this.goldText, scale: 1.2, duration: 100, yoyo: true });
    }

    // --- Offline Popup ---

    private offlinePopupContainer!: Phaser.GameObjects.Container;
    private offlinePopupText!: Phaser.GameObjects.Text;

    public showOfflinePopup(amount: number, seconds: number) {
        if (!this.offlinePopupContainer) {
            this.createOfflinePopup();
        }

        this.offlinePopupText.setText(`Welcome Back!\n\nYou were gone for ${seconds} seconds.\n\nOffline Earnings:\n$${Math.floor(amount)}`);
        this.offlinePopupContainer.setVisible(true);
        this.offlinePopupContainer.setAlpha(0);

        this.scene.tweens.add({
            targets: this.offlinePopupContainer,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    private createOfflinePopup() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        this.offlinePopupContainer = this.scene.add.container(width / 2, height / 2).setDepth(1000);

        // Backdrop
        const bg = this.scene.add.rectangle(0, 0, width * 0.8, height * 0.4, 0x000000, 0.9)
            .setStrokeStyle(4, 0xffd700);

        // Title
        const title = this.scene.add.text(0, -height * 0.15, 'OFFLINE PROGRESS', {
            fontFamily: 'Arial', fontSize: '28px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Info Text
        this.offlinePopupText = this.scene.add.text(0, -20, '', {
            fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        // Collect Button
        const btnY = height * 0.12;
        const btn = this.scene.add.container(0, btnY);
        const btnBg = this.scene.add.rectangle(0, 0, 160, 50, 0x00aa00).setInteractive({ useHandCursor: true });
        const btnTxt = this.scene.add.text(0, 0, 'COLLECT', { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            this.scene.tweens.add({
                targets: this.offlinePopupContainer,
                alpha: 0,
                duration: 300,
                onComplete: () => this.offlinePopupContainer.setVisible(false)
            });
        });

        btn.add([btnBg, btnTxt]);
        this.offlinePopupContainer.add([bg, title, this.offlinePopupText, btn]);
        this.offlinePopupContainer.setVisible(false);
    }
}
