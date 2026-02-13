
import Phaser from 'phaser';

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

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Layout Constants
        const TOP_ZONE_HEIGHT = height * 0.4;
        // const UI_ZONE_HEIGHT = height * 0.6; // Not explicitly needed if we use offsets

        // --- Top Zone (Gameplay) ---

        // Level/Stage Text (Top 5%)
        this.levelText = this.scene.add.text(width / 2, height * 0.05, 'Stage 1 - 0/10', {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Health Bar (Top 10%)
        this.healthBarContainer = this.scene.add.container(width / 2, height * 0.10);
        this.healthBarBg = this.scene.add.rectangle(0, 0, 200, 30, 0x333333);
        this.healthBarFill = this.scene.add.rectangle(0, 0, 196, 26, 0xff0000);
        this.healthBarFill.setOrigin(0, 0.5);
        this.healthBarFill.x = -98;
        this.healthBarContainer.add([this.healthBarBg, this.healthBarFill]);

        // Boss Timer (Top 15%)
        this.bossTimerText = this.scene.add.text(width / 2, height * 0.15, '', {
            fontFamily: 'Arial', fontSize: '20px', color: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Buff Indicator (Top 35% - above Gold)
        this.buffText = this.scene.add.text(width / 2, height * 0.33, 'BUFF ACTIVE!', {
            fontFamily: 'Arial', fontSize: '20px', color: '#00ff00', fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Currencies (Bottom of Top Screen, ~38-42%)
        // Let's put them at the boundary.
        this.goldText = this.scene.add.text(width / 2 - 10, height * 0.38, 'Gold: 0', {
            fontFamily: 'Arial', fontSize: '28px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(1, 0.5); // Align right

        this.stocksText = this.scene.add.text(width / 2 + 10, height * 0.38, 'Stocks: 0', {
            fontFamily: 'Arial', fontSize: '28px', color: '#00ff00', fontStyle: 'bold'
        }).setOrigin(0, 0.5); // Align left


        // --- Bottom Zone (UI) ---

        const startY = height * 0.45; // Start buttons a bit lower
        const btnHeight = 40;
        const gap = 10;

        // Row 1: Click & Auto
        this.clickUpgradeBtn = this.createButton(width * 0.25, startY, width * 0.45, btnHeight, 'Click Dmg', '#444444');
        this.autoUpgradeBtn = this.createButton(width * 0.75, startY, width * 0.45, btnHeight, 'Auto Dmg', '#444444');

        // Row 2: Crit & Gold
        this.critUpgradeBtn = this.createButton(width * 0.25, startY + btnHeight + gap, width * 0.45, btnHeight, 'Crit Rate', '#444444');
        this.goldUpgradeBtn = this.createButton(width * 0.75, startY + btnHeight + gap, width * 0.45, btnHeight, 'Gold Drop', '#444444');

        // --- Artifact Section ---
        const artifactY = startY + (btnHeight + gap) * 2 + 30; // Extra gap

        // Label for Artifacts? Optional. Using buttons for now.
        this.artifactCardBtn = this.createButton(width * 0.25, artifactY, width * 0.45, btnHeight, 'Gold Card', '#664400');
        this.artifactEspressoBtn = this.createButton(width * 0.75, artifactY, width * 0.45, btnHeight, 'Espresso', '#664400');

        // Text References
        this.clickUpgradeText = this.clickUpgradeBtn.getAt(1) as Phaser.GameObjects.Text;
        this.autoUpgradeText = this.autoUpgradeBtn.getAt(1) as Phaser.GameObjects.Text;
        this.critUpgradeText = this.critUpgradeBtn.getAt(1) as Phaser.GameObjects.Text;
        this.goldUpgradeText = this.goldUpgradeBtn.getAt(1) as Phaser.GameObjects.Text;
        this.artifactCardText = this.artifactCardBtn.getAt(1) as Phaser.GameObjects.Text;
        this.artifactEspressoText = this.artifactEspressoBtn.getAt(1) as Phaser.GameObjects.Text;

        // --- Skills Section ---
        const skillY = height - 80;
        this.skillBtn = this.createButton(width / 2, skillY, width * 0.9, 60, 'Coffee Rush (Active)', '#004488');
        this.skillText = this.skillBtn.getAt(1) as Phaser.GameObjects.Text;

        // Cooldown Overlay
        this.skillOverlay = this.scene.add.rectangle(0, 0, width * 0.9, 60, 0x000000, 0.7).setOrigin(0.5).setVisible(false);
        this.skillTimerText = this.scene.add.text(0, 0, '', { fontSize: '24px', color: '#fff' }).setOrigin(0.5).setVisible(false);
        this.skillBtn.add([this.skillOverlay, this.skillTimerText]);
    }

    private createButton(x: number, y: number, w: number, h: number, text: string, color: string): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, w, h, Phaser.Display.Color.HexStringToColor(color).color)
            .setInteractive({ useHandCursor: true });
        const txt = this.scene.add.text(0, 0, text, { fontSize: '12px', color: '#fff', align: 'center' }).setOrigin(0.5);
        container.add([bg, txt]);
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
            this.updateStageInfo(stage, kills, 10); // 10 is hardcoded or pass const
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
        this.updateStageInfo(upgradeManager.stage, upgradeManager.enemiesKilled, 10);
    }

    private updateStatsDisplay(mgr: any) {
        this.clickUpgradeText.setText(`Click (+1)\n$${mgr.clickUpgradeCost}`);
        this.autoUpgradeText.setText(`Auto (+1)\n$${mgr.autoUpgradeCost}`);

        const critPercent = Math.round(mgr.critRate * 100);
        this.critUpgradeText.setText(mgr.critRate >= 0.5 ? `Crit (Max)\n-` : `Crit (+5%)\n$${mgr.critUpgradeCost}\n(${critPercent}%)`);

        const goldPercent = Math.round((mgr.goldMultiplier - 1) * 100);
        this.goldUpgradeText.setText(`Gold (+10%)\n$${mgr.goldUpgradeCost}\n(+${goldPercent}%)`);
    }

    private updateArtifactDisplay(mgr: any) {
        // Cards
        const cardCost = 5;
        this.artifactCardText.setText(`Gold Card\nPrice: ${cardCost} Stocks\n(Owned: ${mgr.artifactGoldenCard})`);

        // Espresso
        const espressoCost = 10;
        this.artifactEspressoText.setText(`Espresso\nPrice: ${espressoCost} Stocks\n(Owned: ${mgr.artifactEspresso})`);
    }

    private updateButtonAvailability(mgr: any) {
        const gold = mgr.gold;
        this.clickUpgradeBtn.setAlpha(gold >= mgr.clickUpgradeCost ? 1 : 0.5);
        this.autoUpgradeBtn.setAlpha(gold >= mgr.autoUpgradeCost ? 1 : 0.5);
        this.critUpgradeBtn.setAlpha(mgr.critRate < 0.5 && gold >= mgr.critUpgradeCost ? 1 : 0.5);
        this.goldUpgradeBtn.setAlpha(gold >= mgr.goldUpgradeCost ? 1 : 0.5);
    }

    private updateArtifactAvailability(mgr: any) {
        const stocks = mgr.stocks;
        this.artifactCardBtn.setAlpha(stocks >= 5 ? 1 : 0.5);
        this.artifactEspressoBtn.setAlpha(stocks >= 10 ? 1 : 0.5);
    }

    public bindUpgradeCallbacks(
        onClick: () => void,
        onAuto: () => void,
        onCrit: () => void,
        onGold: () => void,
        onSkill: () => void
    ) {
        (this.clickUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onClick);
        (this.autoUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onAuto);
        (this.critUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onCrit);
        (this.goldUpgradeBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onGold);
        (this.skillBtn.getData('bg') as Phaser.GameObjects.Rectangle).on('pointerdown', onSkill);
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

    public addGold(amount: number) {
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
