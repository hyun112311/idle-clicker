
import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class UIManager {
    private scene: Phaser.Scene;

    // UI Containers
    private uiContainer!: Phaser.GameObjects.Container; // The sliding drawer

    // Top HUD
    private healthBarContainer!: Phaser.GameObjects.Container;
    private healthBarBg!: Phaser.GameObjects.Rectangle;
    private healthBarFill!: Phaser.GameObjects.Rectangle;

    // Text Elements
    private goldText!: Phaser.GameObjects.Text;
    private stocksText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private buffText!: Phaser.GameObjects.Text;
    private bossTimerText!: Phaser.GameObjects.Text;

    // HR Operational Text
    private workSpeedText: Phaser.GameObjects.Text | null = null;

    // Stats Buttons (Grid Items)
    private clickUpgradeBtn!: Phaser.GameObjects.Container;
    private autoUpgradeBtn!: Phaser.GameObjects.Container;
    private critUpgradeBtn!: Phaser.GameObjects.Container;
    private goldUpgradeBtn!: Phaser.GameObjects.Container;

    private clickUpgradeText!: Phaser.GameObjects.Text;
    private autoUpgradeText!: Phaser.GameObjects.Text;
    private critUpgradeText!: Phaser.GameObjects.Text;
    private goldUpgradeText!: Phaser.GameObjects.Text;

    // Artifact Buttons (Grid Items)
    private artifactCardBtn!: Phaser.GameObjects.Container;
    private artifactEspressoBtn!: Phaser.GameObjects.Container;
    private artifactCardText!: Phaser.GameObjects.Text;
    private artifactEspressoText!: Phaser.GameObjects.Text;

    // Skill & Prestige (Grid Items)
    private skillBtn!: Phaser.GameObjects.Container;
    private skillText!: Phaser.GameObjects.Text;
    private skillOverlay!: Phaser.GameObjects.Rectangle;
    private skillTimerText!: Phaser.GameObjects.Text;

    private prestigeBtn!: Phaser.GameObjects.Container;
    private prestigeText!: Phaser.GameObjects.Text;

    // Bean Shop
    private beanGoldBtn!: Phaser.GameObjects.Container;
    private beanDamageBtn!: Phaser.GameObjects.Container;
    private beanSpeedBtn!: Phaser.GameObjects.Container;
    private beanGoldText!: Phaser.GameObjects.Text;
    private beanDamageText!: Phaser.GameObjects.Text;
    private beanSpeedText!: Phaser.GameObjects.Text;

    // State
    private isExpanded: boolean = true;
    private uiHeight: number = 0;
    private expandedY: number = 0;
    private collapsedY: number = 0;

    // Button Fills
    private buttonFills: Map<string, Phaser.GameObjects.Rectangle> = new Map();

    // Scroll State
    private scrollY: number = 0;
    private isDragging: boolean = false;
    private lastPointerY: number = 0;
    private contentMask!: Phaser.Display.Masks.GeometryMask;
    private contentHeight: number = 0;
    private visibleHeight: number = 0;

    // UI Elements
    private drawerBg!: Phaser.GameObjects.Rectangle;
    private collapseBtn!: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // 1. Calculate Layout Dimensions (50% Game, 50% UI for Focus Mode)
        const uiRatio = 0.5;
        this.uiHeight = height * uiRatio;
        this.expandedY = height - this.uiHeight;
        this.collapsedY = height - 60; // Keep tabs visible

        // --- Top Zone (Gameplay HUD) ---
        // These stay static at the top

        // Level/Stage Text (Top 5%)
        this.levelText = this.scene.add.text(width / 2, height * 0.05, 'Stage 1 - 0/10', {
            fontFamily: 'Arial', fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        // Health Bar (Top 10%)
        this.healthBarContainer = this.scene.add.container(width / 2, height * 0.10).setDepth(10);
        this.healthBarBg = this.scene.add.rectangle(0, 0, 200, 30, 0x333333).setStrokeStyle(2, 0x000000);
        this.healthBarFill = this.scene.add.rectangle(0, 0, 196, 26, 0xff0000);
        this.healthBarFill.setOrigin(0, 0.5);
        this.healthBarFill.x = -98;
        this.healthBarContainer.add([this.healthBarBg, this.healthBarFill]);

        // Boss Timer
        this.bossTimerText = this.scene.add.text(width / 2, height * 0.14, '', {
            fontFamily: 'Arial', fontSize: '22px', color: '#ff0000', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        // Buff Indicator
        this.buffText = this.scene.add.text(width / 2, height * 0.18, 'BUFF ACTIVE!', { // Moved up slightly
            fontFamily: 'Arial', fontSize: '20px', color: '#00ff00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setVisible(false).setDepth(10);

        // --- Anti-Company UI Structure ---
        // 1. Tab Bar (Static at Bottom)
        // 2. Drawer Content (Sliding from Bottom, behind/above tabs)

        const tabCount = 5;
        const bottomTabH = 60; // Taller for better touch target
        this.visibleHeight = this.uiHeight - bottomTabH - 35; // Content Area Height (reserved top bar space)

        // Define Sliding Positions
        this.expandedY = height - this.uiHeight;
        this.collapsedY = height - bottomTabH; // Start of Tab Bar

        // 1. Drawer Container (Content)
        // High Depth to overlap Game
        this.uiContainer = this.scene.add.container(0, this.expandedY).setDepth(100);

        // Drawer Background (Solid Opaque)
        this.drawerBg = this.scene.add.rectangle(width / 2, (this.uiHeight - bottomTabH) / 2, width, this.uiHeight - bottomTabH, 0x1a1a1a, 1) // Explicit Alpha 1
            .setStrokeStyle(1, 0x333333)
            .setInteractive(); // Blocks clicks to game world

        // Top Border Accent
        const drawerTopBorder = this.scene.add.rectangle(width / 2, 0, width, 4, 0x00aaff).setOrigin(0.5, 0);

        // Info Bar (Gold/Stocks) attached to top of drawer
        const infoBarH = 40;
        const infoBarY = 20;

        // Info Bar Background (Blocker)
        // Blocks clicks so buttons sliding underneath don't get clicked
        const infoBarBlocker = this.scene.add.rectangle(width / 2, infoBarY, width, infoBarH, 0x1a1a1a, 0)
            .setInteractive();

        this.goldText = this.scene.add.text(width * 0.25, infoBarY, 'Gold: 0', {
            fontFamily: 'Arial', fontSize: '16px', color: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        this.stocksText = this.scene.add.text(width * 0.75, infoBarY, 'Stocks: 0', {
            fontFamily: 'Arial', fontSize: '16px', color: '#00ff00', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        // Close/Collapse Button (Top Right of Drawer)
        this.collapseBtn = this.scene.add.container(width - 25, 15);
        const collapseBg = this.scene.add.circle(0, 0, 12, 0x333333).setStrokeStyle(1, 0xaaaaaa).setInteractive({ useHandCursor: true });
        const collapseIcon = this.scene.add.text(0, 0, '▼', { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
        this.collapseBtn.add([collapseBg, collapseIcon]);
        collapseBg.on('pointerdown', () => this.setDrawerExpanded(false));

        // Scrollable Content Container
        const contentOffsetY = 40;
        this.drawerContentContainer = this.scene.add.container(0, contentOffsetY);

        // Masking logic
        // Draw mask at (0,0) relative to its position, with proper size
        const maskShape = this.scene.make.graphics({});
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, 0, width, this.visibleHeight);
        this.contentMask = new Phaser.Display.Masks.GeometryMask(this.scene, maskShape);
        this.drawerContentContainer.setMask(this.contentMask);

        // Initial Mask Position check
        // We will update this in setDrawerExpanded
        const initialMaskY = this.expandedY + contentOffsetY;
        maskShape.y = initialMaskY;

        this.uiContainer.add([
            this.drawerBg,
            drawerTopBorder,
            infoBarBlocker,
            this.goldText,
            this.stocksText,
            this.collapseBtn,
            this.drawerContentContainer
        ]);

        // Scroll Logic
        this.setupScrolling(this.drawerBg);

        // 2. Tab Bar Container (Static)
        const tabBarContainer = this.scene.add.container(0, height - bottomTabH).setDepth(110);
        const tabBarBg = this.scene.add.rectangle(width / 2, bottomTabH / 2, width, bottomTabH, 0x111111);
        tabBarContainer.add(tabBarBg);

        const tabW = width / tabCount;

        // Create Tabs (Updated Names from Config)
        this.createBottomTab(tabBarContainer, 0, 0, tabW, bottomTabH, GameConfig.DEPARTMENTS.HR, 'personnel');
        this.createBottomTab(tabBarContainer, tabW, 0, tabW, bottomTabH, GameConfig.DEPARTMENTS.STRATEGY, 'strategy');
        this.createBottomTab(tabBarContainer, tabW * 2, 0, tabW, bottomTabH, GameConfig.DEPARTMENTS.WELFARE, 'welfare');
        this.createBottomTab(tabBarContainer, tabW * 3, 0, tabW, bottomTabH, GameConfig.DEPARTMENTS.RND, 'rnd');
        this.createBottomTab(tabBarContainer, tabW * 4, 0, tabW, bottomTabH, GameConfig.DEPARTMENTS.GLOBAL, 'global');

        // Initialize Content
        this.renderTabContent();
        this.switchDrawerTab('strategy');

        // --- Menu Button ---
        const menuBtnSize = 40;
        const menuBtn = this.scene.add.container(width - 30, 30);
        const menuBg = this.scene.add.rectangle(0, 0, menuBtnSize, menuBtnSize, 0x222222)
            .setStrokeStyle(1, 0x888888)
            .setInteractive({ useHandCursor: true });
        const menuIcon = this.scene.add.text(0, 0, '☰', { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
        const menuLabel = this.scene.add.text(width - 35, 60, '관리팀', {
            fontFamily: '"Noto Sans KR", Arial', fontSize: '11px', color: '#aaaaaa', align: 'right'
        }).setOrigin(1, 0.5);

        menuBg.on('pointerdown', () => this.toggleMenu(true));
        menuBtn.add([menuBg, menuIcon]);
        this.scene.add.existing(menuLabel);
        menuBtn.setDepth(100);
        menuLabel.setDepth(100);

        this.createMenuModal();
    }

    private setupScrolling(interactiveArea: Phaser.GameObjects.Rectangle) {
        interactiveArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.lastPointerY = pointer.y;
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging && this.isExpanded) {
                const deltaY = pointer.y - this.lastPointerY;
                this.scrollY += deltaY;
                this.lastPointerY = pointer.y;
                this.updateScrollPosition();
            }
        });

        this.scene.input.on('pointerup', () => {
            this.isDragging = false;
        });
    }

    private updateScrollPosition() {
        // Clamp Scroll
        const minScroll = Math.min(0, -(this.contentHeight - this.visibleHeight));
        this.scrollY = Phaser.Math.Clamp(this.scrollY, minScroll, 0);
        this.drawerContentContainer.y = 40 + this.scrollY; // 40 is base offset
    }

    private drawerContentContainer!: Phaser.GameObjects.Container;
    private currentDrawerTab: string = 'strategy';
    private bottomTabs: Map<string, Phaser.GameObjects.Container> = new Map();
    private equipmentPlaceholder!: Phaser.GameObjects.Text;

    private createBottomTab(parent: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, text: string, id: string) {
        const container = this.scene.add.container(x, y);

        // Bg
        const bg = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x111111).setInteractive({ useHandCursor: true });
        // Separator
        const border = this.scene.add.rectangle(w, h / 2, 1, h * 0.6, 0x333333);

        // Text
        const txt = this.scene.add.text(w / 2, h / 2, text, {
            fontFamily: '"Noto Sans KR", Arial', fontSize: '10px', color: '#666666', align: 'center', fontStyle: 'bold' // Slightly smaller font for longer names
        }).setOrigin(0.5);

        // Active Indicator Line (Top of tab)
        const indicator = this.scene.add.rectangle(w / 2, 2, w * 0.8, 2, 0x00aaff).setVisible(false);

        bg.on('pointerdown', () => this.handleTabClick(id));

        container.add([bg, border, txt, indicator]);
        container.setData('bg', bg);
        container.setData('txt', txt);
        container.setData('indicator', indicator);

        parent.add(container);
        this.bottomTabs.set(id, container);
    }

    private handleTabClick(tab: string) {
        // Toggle Logic:
        // 1. If Collapsed -> Expand & Show Tab
        // 2. If Expanded AND Same Tab -> Collapse
        // 3. If Expanded AND Diff Tab -> Switch Tab

        if (!this.isExpanded) {
            // Case 1: Expand
            this.switchDrawerTab(tab);
            this.setDrawerExpanded(true);
        } else {
            if (this.currentDrawerTab === tab) {
                // If clicking same tab, do nothing or collapse? 
                // User said "Clicking a tab when... Collapsed -> Slide UP"
                // "Clicking the SAME active tab when... Expanded -> Slide DOWN"
                this.setDrawerExpanded(false);
            } else {
                // Case 3: Switch
                this.switchDrawerTab(tab);
            }
        }
    }

    private setDrawerExpanded(expanded: boolean) {
        this.isExpanded = expanded;
        const targetY = this.isExpanded ? this.expandedY : this.collapsedY;

        this.scene.tweens.add({
            targets: this.uiContainer,
            y: targetY,
            duration: 400,
            ease: 'Power2',
            onUpdate: () => {
                // Update mask position logic
                // Mask is a Graphics object in World Space (by default for GeometryMask).
                // We drew it at (0,0) with size (W, H).
                // We need to move it to (0, uiContainer.y + 40) explicitly.
                const mask = this.contentMask.geometryMask;
                if (mask) {
                    mask.y = this.uiContainer.y + 40;
                }
            }
        });

        // Calculate visual targets for Game Scene
        // If Expanded (Focus Mode): Game area is top 50%. Center is Y=25% of screen. Scale 0.6.
        // If Collapsed: Game area is mainly full. Center is ~45% of screen. Scale 1.0.

        const scale = this.isExpanded ? 0.6 : 1.0;
        const newCenterY = this.isExpanded ? this.scene.scale.height * 0.25 : (this.collapsedY * 0.5);

        this.scene.events.emit('ui-toggled', { y: newCenterY, scale: scale });
    }

    private switchDrawerTab(tab: string) {
        this.currentDrawerTab = tab;
        this.scrollY = 0; // Reset scroll on tab switch
        this.updateScrollPosition();

        // Visual Update for Tabs
        this.bottomTabs.forEach((container, id) => {
            // const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
            const txt = container.getData('txt') as Phaser.GameObjects.Text;
            const indicator = container.getData('indicator') as Phaser.GameObjects.Rectangle;

            if (id === tab) {
                txt.setColor('#ffffff');
                indicator.setVisible(true);
            } else {
                txt.setColor('#666666');
                indicator.setVisible(false);
            }
        });

        this.updateDrawerContent();
    }
    private onUpgradeClick!: () => void;
    private onCritClick!: () => void;
    private onGoldClick!: () => void;
    private onSkillClick!: () => void;
    private onPrestigeClick!: () => void;
    private onCardClick!: () => void;
    private onEspressoClick!: () => void;

    private lastUpgradeManager: any; // visual update reference

    public bindUpgradeCallbacks(
        onClick: () => void,
        onCrit: () => void,
        onGold: () => void,
        onSkill: () => void,
        onPrestige: () => void
    ) {
        this.onUpgradeClick = onClick;
        this.onCritClick = onCrit;
        this.onGoldClick = onGold;
        this.onSkillClick = onSkill;
        this.onPrestigeClick = onPrestige;
    }

    public bindArtifactCallbacks(onCard: () => void, onEspresso: () => void) {
        this.onCardClick = onCard;
        this.onEspressoClick = onEspresso;
    }

    private onCoworkerHireClick!: (id: string) => void;
    public bindCoworkerCallback(onHire: (id: string) => void) {
        this.onCoworkerHireClick = onHire;
    }

    private onBeanGoldClick!: () => void;
    private onBeanDamageClick!: () => void;
    private onBeanSpeedClick!: () => void;

    public bindBeanUpgradeCallbacks(onGold: () => void, onDamage: () => void, onSpeed: () => void) {
        this.onBeanGoldClick = onGold;
        this.onBeanDamageClick = onDamage;
        this.onBeanSpeedClick = onSpeed;
    }

    private renderTabContent() {
        // CRITICAL: Clean up previous elements
        this.drawerContentContainer.removeAll(true);

        // Reset references to null to prevent stale updates
        // (Optional, but good practice. Typescript might complain if strictly typed, but we'll manage.)

        const width = this.scene.scale.width;
        // Grid Params
        const margin = 10;
        const gridW = (width - (margin * 3)) / 2;
        const gridH = 60;

        let activeItems: Phaser.GameObjects.Container[] = [];
        this.coworkerCards.clear();

        if (this.currentDrawerTab === 'personnel') {
            let currentY = 0;
            const cardHeight = 70;
            const cardWidth = width - margin * 2;

            // Add Badge Button at the top
            const badgeBtnY = currentY + 20;
            const badgeBtnBg = this.scene.add.rectangle(margin + cardWidth / 2, badgeBtnY, cardWidth, 40, 0x333333).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xaaaaaa);
            const badgeBtnText = this.scene.add.text(margin + cardWidth / 2, badgeBtnY, '[사내 포상 (Badges)]', { fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
            badgeBtnBg.on('pointerdown', () => this.toggleBadgeModal(true));
            this.drawerContentContainer.add([badgeBtnBg, badgeBtnText]);

            currentY += 50 + margin;

            // Attack Speed Header
            const speedHeaderY = currentY + 10;
            const speedBg = this.scene.add.rectangle(margin + cardWidth / 2, speedHeaderY, cardWidth, 30, 0x111111).setStrokeStyle(1, 0x444444);
            const speedIcon = this.scene.add.text(margin + 10, speedHeaderY, '⚡', { fontSize: '14px' }).setOrigin(0, 0.5);
            const speedText = this.scene.add.text(margin + 35, speedHeaderY, 'Company Work Speed: 1.00s', { fontSize: '14px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0, 0.5);

            this.drawerContentContainer.add([speedBg, speedIcon, speedText]);
            this.workSpeedText = speedText; // Store ref for dynamic updates

            currentY += 40 + margin;

            // Add Bulk Hire Buttons
            const bulkBtnY = currentY + 15;
            const bulkBtnW = (cardWidth - (margin * 4)) / 5;
            const bulkModes = ['1', '10', '100', 'max', 'next'];
            const bulkLabels = ['x1', 'x10', 'x100', 'MAX', 'NEXT'];

            bulkModes.forEach((mode, i) => {
                const btnX = margin + (bulkBtnW / 2) + i * (bulkBtnW + margin);
                const bg = this.scene.add.rectangle(btnX, bulkBtnY, bulkBtnW, 30, 0x222222).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x666666);
                const txt = this.scene.add.text(btnX, bulkBtnY, bulkLabels[i], { fontSize: '12px', color: '#aaaaaa', fontStyle: 'bold' }).setOrigin(0.5);

                bg.on('pointerdown', () => {
                    if (this.lastUpgradeManager) {
                        this.lastUpgradeManager.buyMode = mode as any;
                        this.updateBulkHireButtons(mode);
                        this.updateCoworkerDisplay(this.lastUpgradeManager);
                    }
                });

                this.bulkHireButtons.set(mode, { bg, txt });
                this.drawerContentContainer.add([bg, txt]);
            });

            currentY += 40 + margin;


            GameConfig.COWORKER_DATA.forEach((data) => {
                const card = this.createCoworkerCard(margin + cardWidth / 2, currentY + margin + cardHeight / 2, cardWidth, cardHeight, data.id, data.name);
                this.drawerContentContainer.add(card);

                // Hide initially unless evaluating immediately
                card.setVisible(false);

                currentY += cardHeight + margin;
                this.coworkerCards.set(data.id, card);
            });
            this.contentHeight = currentY + margin;
            this.updateScrollPosition();

            if (this.lastUpgradeManager) {
                this.updateBulkHireButtons(this.lastUpgradeManager.buyMode);
                this.updateCoworkerDisplay(this.lastUpgradeManager);
            }
            return;
        }
        else if (this.currentDrawerTab === 'strategy') {
            this.clickUpgradeBtn = this.createCompactButton(0, 0, gridW, gridH, 'Click Dmg', '#444444', 'click');
            this.critUpgradeBtn = this.createCompactButton(0, 0, gridW, gridH, 'Crit Rate', '#444444', 'crit');
            this.goldUpgradeBtn = this.createCompactButton(0, 0, gridW, gridH, 'Gold Drop', '#444444', 'gold');
            this.skillBtn = this.createCompactButton(0, 0, gridW, gridH, 'Coffee Rush', '#004488', 'skill');

            this.setupButtonInteraction(this.clickUpgradeBtn, this.onUpgradeClick);
            this.setupButtonInteraction(this.critUpgradeBtn, this.onCritClick);
            this.setupButtonInteraction(this.goldUpgradeBtn, this.onGoldClick);
            this.setupButtonInteraction(this.skillBtn, this.onSkillClick);

            this.clickUpgradeText = this.clickUpgradeBtn.getAt(3) as Phaser.GameObjects.Text;
            this.critUpgradeText = this.critUpgradeBtn.getAt(3) as Phaser.GameObjects.Text;
            this.goldUpgradeText = this.goldUpgradeBtn.getAt(3) as Phaser.GameObjects.Text;
            this.skillText = this.skillBtn.getAt(3) as Phaser.GameObjects.Text;

            // Skill Overlay specific setup
            this.skillOverlay = this.scene.add.rectangle(0, 0, gridW, gridH, 0x000000, 0.7).setOrigin(0.5).setVisible(false);
            this.skillTimerText = this.scene.add.text(0, 0, '', { fontSize: '16px', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setVisible(false);
            this.skillBtn.add([this.skillOverlay, this.skillTimerText]);

            activeItems.push(this.clickUpgradeBtn, this.critUpgradeBtn, this.goldUpgradeBtn, this.skillBtn);
        }
        else if (this.currentDrawerTab === 'welfare') {
            this.artifactCardBtn = this.createCompactButton(0, 0, gridW, gridH, 'Golden Card', '#664400', 'card');
            this.artifactEspressoBtn = this.createCompactButton(0, 0, gridW, gridH, 'Espresso', '#664400', 'espresso');

            this.setupButtonInteraction(this.artifactCardBtn, this.onCardClick);
            this.setupButtonInteraction(this.artifactEspressoBtn, this.onEspressoClick);

            this.artifactCardText = this.artifactCardBtn.getAt(3) as Phaser.GameObjects.Text;
            this.artifactEspressoText = this.artifactEspressoBtn.getAt(3) as Phaser.GameObjects.Text;

            activeItems.push(this.artifactCardBtn, this.artifactEspressoBtn);
        }
        else if (this.currentDrawerTab === 'rnd') {
            this.equipmentPlaceholder = this.scene.add.text(width / 2, 200 / 2, "신무기 및 스킬 트리 개발 중...\n(Coming Soon)", {
                fontFamily: '"Noto Sans KR", Arial', fontSize: '18px', color: '#666666', align: 'center'
            }).setOrigin(0.5);
            this.drawerContentContainer.add(this.equipmentPlaceholder);
            this.contentHeight = 200;
            this.updateScrollPosition();
            return;
        }
        else if (this.currentDrawerTab === 'global') {
            this.prestigeBtn = this.createCompactButton(0, 0, gridW, gridH, 'REBIRTH', '#550055', 'prestige');
            this.setupButtonInteraction(this.prestigeBtn, this.onPrestigeClick);
            this.prestigeText = this.prestigeBtn.getAt(3) as Phaser.GameObjects.Text;

            this.beanGoldBtn = this.createCompactButton(0, 0, gridW, gridH, 'Start Gold', '#226622', 'beanGold');
            this.setupButtonInteraction(this.beanGoldBtn, this.onBeanGoldClick);
            this.beanGoldText = this.beanGoldBtn.getAt(3) as Phaser.GameObjects.Text;

            this.beanDamageBtn = this.createCompactButton(0, 0, gridW, gridH, 'Global Dmg', '#662222', 'beanDamage');
            this.setupButtonInteraction(this.beanDamageBtn, this.onBeanDamageClick);
            this.beanDamageText = this.beanDamageBtn.getAt(3) as Phaser.GameObjects.Text;

            this.beanSpeedBtn = this.createCompactButton(0, 0, gridW, gridH, 'Auto Speed', '#222266', 'beanSpeed');
            this.setupButtonInteraction(this.beanSpeedBtn, this.onBeanSpeedClick);
            this.beanSpeedText = this.beanSpeedBtn.getAt(3) as Phaser.GameObjects.Text;

            activeItems.push(this.prestigeBtn, this.beanGoldBtn, this.beanDamageBtn, this.beanSpeedBtn);
        }

        // Layout
        if (activeItems.length > 0) {
            this.contentHeight = this.layoutItemsInGrid(activeItems);
            activeItems.forEach(item => this.drawerContentContainer.add(item));
        } else {
            this.contentHeight = 0;
        }

        this.updateScrollPosition();

        // Immediate Update
        if (this.lastUpgradeManager) {
            this.updateStatsDisplay(this.lastUpgradeManager);
            this.updateButtonAvailability(this.lastUpgradeManager);
            this.updateArtifactDisplay(this.lastUpgradeManager);
            this.updateArtifactAvailability(this.lastUpgradeManager);
            this.updatePrestigeDisplay(this.lastUpgradeManager);
            this.updateBeanShopDisplay(this.lastUpgradeManager);
        }
    }

    private setupButtonInteraction(btn: Phaser.GameObjects.Container, callback: () => void) {
        if (!callback) return;
        const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle;
        if (bg) {
            bg.removeInteractive();
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', callback);
        }
    }

    private updateDrawerContent() {
        this.renderTabContent();
    }

    private coworkerCards: Map<string, Phaser.GameObjects.Container> = new Map();

    private createCoworkerCard(x: number, y: number, w: number, h: number, id: string, nameText: string): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, w, h, 0x222222)
            .setStrokeStyle(2, 0x444444);

        const titleText = this.scene.add.text(-w / 2 + 15, -h / 2 + 15, `${nameText} Lv.0`, {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const dpsText = this.scene.add.text(-w / 2 + 15, h / 2 - 25, `DPS: 0`, {
            fontSize: '14px', color: '#aaaaaa'
        }).setOrigin(0, 0.5);

        const synergyText = this.scene.add.text(-w / 2 + 15, h / 2 - 8, `Synergy: +0%`, {
            fontSize: '12px', color: '#00ffff'
        }).setOrigin(0, 0.5);

        const btnW = 80;
        const btnH = 40;
        const btnX = w / 2 - btnW / 2 - 10;
        const btnY = 0;

        const btnBg = this.scene.add.rectangle(btnX, btnY, btnW, btnH, 0x008800)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x000000);

        const btnLayerFill = this.scene.add.rectangle(btnX - btnW / 2, btnY, 0, btnH, 0xffffff, 0.2).setOrigin(0, 0.5);

        const btnText = this.scene.add.text(btnX, btnY, `Hire x1\n$0`, {
            fontSize: '12px', color: '#ffffff', align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            if (this.onCoworkerHireClick) this.onCoworkerHireClick(id);
        });

        container.add([bg, titleText, dpsText, synergyText, btnBg, btnLayerFill, btnText]);
        container.setData('titleText', titleText);
        container.setData('dpsText', dpsText);
        container.setData('synergyText', synergyText);
        container.setData('btnText', btnText);
        container.setData('btnBg', btnBg);
        container.setData('btnLayerFill', btnLayerFill);
        container.setData('nameText', nameText);

        return container;
    }

    private layoutItemsInGrid(items: Phaser.GameObjects.Container[]): number {
        const width = this.scene.scale.width;
        const margin = 10;
        const cols = 2; // Fixed 2 columns
        const btnH = 60;
        const btnW = (width - (margin * 3)) / cols;

        // let currentY = margin + btnH / 2; // Unused

        items.forEach((item, index) => {
            const colIndex = index % cols;
            const rowIndex = Math.floor(index / cols);

            const x = margin + btnW / 2 + colIndex * (btnW + margin);
            const y = margin + btnH / 2 + rowIndex * (btnH + margin);

            item.setVisible(true);
            item.setPosition(x, y);

            // Re-size button background if needed? 
            // Our createCompactButton creates them with specific width. 
            // If we want dynamic width, we might need to recreate or resize.
            // For now, let's assume createUpgradeButtons initializes them with potentially generic width 
            // OR we resize them here.
            // Let's resize the background and hit area to fit specifically.
            const bg = item.getData('bg') as Phaser.GameObjects.Rectangle;
            if (bg) {
                // Resize container content?
                // This is tricky with Containers. Better to create them with the right width initially 
                // OR assuming a standard width.
                // Let's assume standard width derived from cols=2 in createUpgradeButtons.
            }
        });

        const rowCount = Math.ceil(items.length / cols);
        return rowCount * (btnH + margin) + margin; // Total Height
    }

    private menuModal!: Phaser.GameObjects.Container;
    private menuContentContainer!: Phaser.GameObjects.Container;
    // private currentMenuTab: string = 'help'; // Unused
    private tabButtons: Map<string, Phaser.GameObjects.Rectangle> = new Map();

    private createMenuModal() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        this.menuModal = this.scene.add.container(width / 2, height / 2).setDepth(3000).setVisible(false);

        // Backdrop
        const backend = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setInteractive(); // Blocks input

        // Modal Window
        const modalW = width * 0.9;
        const modalH = height * 0.7;
        const bg = this.scene.add.rectangle(0, 0, modalW, modalH, 0x222222, 1)
            .setStrokeStyle(4, 0x00aaff);

        // Close Button (Top-Right of Modal)
        const closeBtn = this.scene.add.text(modalW / 2 - 20, -modalH / 2 + 20, 'X', {
            fontSize: '28px', fontStyle: 'bold', color: '#ff4444'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.toggleMenu(false));
        backend.on('pointerdown', () => this.toggleMenu(false));

        // --- Tabs ---
        const tabY = -modalH / 2 + 40;
        const tabW = modalW / 3;
        const tabH = 40;

        this.createTabButton(-tabW, tabY, tabW, tabH, '도움말 (Help)', 'help');
        this.createTabButton(0, tabY, tabW, tabH, '설정 (Set)', 'settings');
        this.createTabButton(tabW, tabY, tabW, tabH, '로그인 (Login)', 'login');

        // --- Content Area ---
        this.menuContentContainer = this.scene.add.container(0, 20); // Below tabs

        this.menuModal.add([backend, bg, closeBtn, this.menuContentContainer]);

        // --- Badge Modal Setup ---
        this.createBadgeModal();
    }

    private badgeModal!: Phaser.GameObjects.Container;
    private badgeContentContainer!: Phaser.GameObjects.Container;

    private createBadgeModal() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        this.badgeModal = this.scene.add.container(width / 2, height / 2).setDepth(3000).setVisible(false);

        const backend = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
        const modalW = width * 0.9;
        const modalH = height * 0.7;
        const bg = this.scene.add.rectangle(0, 0, modalW, modalH, 0x222222, 1).setStrokeStyle(4, 0xffd700);

        const closeBtn = this.scene.add.text(modalW / 2 - 20, -modalH / 2 + 20, 'X', {
            fontSize: '28px', fontStyle: 'bold', color: '#ff4444'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.toggleBadgeModal(false));
        backend.on('pointerdown', () => this.toggleBadgeModal(false));

        const titleText = this.scene.add.text(0, -modalH / 2 + 30, '사내 포상 도감 (Milestone Badges)', {
            fontFamily: '"Noto Sans KR", Arial', fontSize: '20px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5);

        const rulesText = this.scene.add.text(0, -modalH / 2 + 70, '25명: x2 | 50명: x3 | 100명: x5 | 200명: x10', {
            fontFamily: '"Noto Sans KR", Arial', fontSize: '14px', color: '#ffffff'
        }).setOrigin(0.5);

        this.badgeContentContainer = this.scene.add.container(0, -modalH / 2 + 110);
        this.badgeModal.add([backend, bg, closeBtn, titleText, rulesText, this.badgeContentContainer]);
    }

    private toggleBadgeModal(show: boolean) {
        if (show) {
            this.updateBadgeModalContent();
            this.badgeModal.setVisible(true);
            this.badgeModal.setScale(0.8);
            this.badgeModal.setAlpha(0);
            this.scene.tweens.add({ targets: this.badgeModal, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        } else {
            this.scene.tweens.add({ targets: this.badgeModal, scale: 0.8, alpha: 0, duration: 200, onComplete: () => this.badgeModal.setVisible(false) });
        }
    }

    private updateBadgeModalContent() {
        this.badgeContentContainer.removeAll(true);
        if (!this.lastUpgradeManager) return;

        let currentY = 0;
        GameConfig.COWORKER_DATA.forEach(c => {
            const level = this.lastUpgradeManager.coworkerLevels[c.id] || 0;
            const badgeInfo = this.lastUpgradeManager.getBadgeInfo(level);

            let badgeText = badgeInfo.text;
            let color = badgeInfo.color;

            if (level < 25) {
                const nextGoal = 25;
                badgeText = `[배지 없음 (${nextGoal}명 필요)]`;
                color = '#aaaaaa';
            }

            const rowText = this.scene.add.text(0, currentY, `${c.name}: ${badgeText}`, {
                fontFamily: '"Noto Sans KR", Arial', fontSize: '16px', color: color
            }).setOrigin(0.5);

            this.badgeContentContainer.add(rowText);
            currentY += 30;
        });
    }

    private createTabButton(x: number, y: number, w: number, h: number, text: string, id: string) {
        const bg = this.scene.add.rectangle(x, y, w, h, 0x333333).setStrokeStyle(1, 0x000000)
            .setInteractive({ useHandCursor: true });

        const txt = this.scene.add.text(x, y, text, {
            fontFamily: '"Noto Sans KR", Arial', fontSize: '16px', color: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerdown', () => this.switchMenuTab(id));

        this.menuModal.add([bg, txt]);
        this.tabButtons.set(id, bg);
    }

    public toggleMenu(show: boolean) {
        if (show) {
            this.switchMenuTab('help'); // Default to help
            this.menuModal.setVisible(true);
            this.menuModal.setScale(0.8);
            this.menuModal.setAlpha(0);
            this.scene.tweens.add({
                targets: this.menuModal,
                scale: 1,
                alpha: 1,
                duration: 200,
                ease: 'Back.Out'
            });
        } else {
            this.scene.tweens.add({
                targets: this.menuModal,
                scale: 0.8,
                alpha: 0,
                duration: 200,
                onComplete: () => this.menuModal.setVisible(false)
            });
        }
    }

    private switchMenuTab(tab: string) {
        // this.currentMenuTab = tab;
        this.menuContentContainer.removeAll(true); // Clear previous content

        // Update Tab Visuals
        this.tabButtons.forEach((bg, id) => {
            bg.setFillStyle(id === tab ? 0x00aaff : 0x333333);
        });

        const width = this.scene.scale.width;

        if (tab === 'help') {
            const contentText = [
                "1. 기본 규칙 (Basics)",
                "- 클릭/자동 공격으로 적을 처치하세요 (10킬 -> 보스).",
                "",
                "2. 보스전 (Boss)",
                "- 보스는 30초 제한! 실패 시 일반 스테이지로 복귀.",
                "",
                "3. 재화 (Currency)",
                "- 골드: 기본 데미지 강화.",
                "- 주식: 특수 유물/아티팩트 구매.",
                "",
                "4. 환생 (Prestige)",
                "- 10단계 해금. 환생 시 콩(Beans) 획득 (+2% 데미지)."
            ];

            const info = this.scene.add.text(0, -30, contentText, {
                fontFamily: '"Noto Sans KR", Arial', fontSize: '18px', color: '#ffffff', align: 'left',
                lineSpacing: 8, wordWrap: { width: width * 0.8 }
            }).setOrigin(0.5);
            this.menuContentContainer.add(info);

        } else if (tab === 'settings') {
            // Sound Toggle (Mock)
            const soundTxt = this.scene.add.text(0, -50, '사운드 (Sound): ON', {
                fontFamily: '"Noto Sans KR", Arial', fontSize: '24px', color: '#ffffff'
            }).setOrigin(0.5);

            // Reset Data
            const resetBtn = this.scene.add.container(0, 50);
            const resetBg = this.scene.add.rectangle(0, 0, 160, 50, 0xaa0000).setInteractive({ useHandCursor: true });
            const resetTxt = this.scene.add.text(0, 0, '데이터 초기화', {
                fontFamily: '"Noto Sans KR", Arial', fontSize: '20px', fontStyle: 'bold'
            }).setOrigin(0.5);
            resetBtn.add([resetBg, resetTxt]);

            resetBg.on('pointerdown', () => {
                const confirm = window.confirm("정말 초기화 하시겠습니까?");
                if (confirm) {
                    localStorage.clear();
                    window.location.reload();
                }
            });

            this.menuContentContainer.add([soundTxt, resetBtn]);

        } else if (tab === 'login') {
            const msg = this.scene.add.text(0, -30, '로그인 기능 준비 중입니다.\n(Login Coming Soon)', {
                fontFamily: '"Noto Sans KR", Arial', fontSize: '20px', color: '#aaaaaa', align: 'center'
            }).setOrigin(0.5);

            const loginBtn = this.scene.add.rectangle(0, 50, 200, 50, 0x555555);
            const loginTxt = this.scene.add.text(0, 50, 'GOOGLE LOGIN', {
                fontSize: '20px', fontStyle: 'bold', color: '#888888'
            }).setOrigin(0.5);

            this.menuContentContainer.add([msg, loginBtn, loginTxt]);
        }
    }

    private createCompactButton(x: number, y: number, w: number, h: number, text: string, color: string, id: string): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);

        // Background
        const bg = this.scene.add.rectangle(0, 0, w, h, Phaser.Display.Color.HexStringToColor(color).color)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x000000);

        // Fill
        const fill = this.scene.add.rectangle(-w / 2, 0, 0, h, 0xffffff, 0.2).setOrigin(0, 0.5);
        this.buttonFills.set(id, fill);

        // Glow
        const glow = this.scene.add.rectangle(0, 0, w + 4, h + 4, 0x000000, 0).setStrokeStyle(3, 0xffd700).setVisible(false);
        container.setData('glow', glow);

        // Text (Smaller font)
        const txt = this.scene.add.text(0, 0, text, {
            fontSize: '11px', color: '#fff', align: 'center', stroke: '#000', strokeThickness: 2,
            wordWrap: { width: w - 4 }
        }).setOrigin(0.5);

        container.add([bg, fill, glow, txt]);
        container.setData('bg', bg);
        return container;
    }

    // --- Bindings & Events ---

    public setupListeners(upgradeManager: any) {
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

        // Coworkers
        upgradeManager.on('coworkers-changed', (mgr: any) => {
            this.updateCoworkerDisplay(mgr);
            this.updateButtonAvailability(mgr);
        });

        // Beans
        upgradeManager.on('beans-changed', () => {
            this.updatePrestigeDisplay(upgradeManager);
            this.updateBeanShopDisplay(upgradeManager);
        });

        // Offline Gold
        upgradeManager.on('offline-gold', (amount: number, seconds: number) => {
            this.showOfflinePopup(amount, seconds);
        });

        // Initial Update
        this.updateStatsDisplay(upgradeManager);
        this.updateArtifactDisplay(upgradeManager);
        this.updateButtonAvailability(upgradeManager);
        this.updatePrestigeDisplay(upgradeManager);
        this.updateBeanShopDisplay(upgradeManager);
        this.updateCoworkerDisplay(upgradeManager);
        this.goldText.setText(`Gold: ${Math.floor(upgradeManager.gold)}`);
        this.stocksText.setText(`Stocks: ${upgradeManager.stocks}`);
        this.updateStageInfo(upgradeManager.stage, upgradeManager.enemiesKilled, GameConfig.ENEMIES_PER_STAGE);
    }

    private updateArtifactDisplay(mgr: any) {
        // Simplified text for compact mode
        if (this.artifactCardText && this.artifactCardText.active)
            this.artifactCardText.setText(`Card\n$${5} Stk\n(${mgr.artifactGoldenCard})`);

        if (this.artifactEspressoText && this.artifactEspressoText.active)
            this.artifactEspressoText.setText(`Espresso\n$${10} Stk\n(${mgr.artifactEspresso})`);
    }

    // Old bindings removed in favor of stored callbacks


    private updatePrestigeDisplay(mgr: any) {
        if (!this.prestigeBtn || !this.prestigeBtn.active) return;

        const potentialBeans = mgr.getPotentialBeans();
        // Compact Text
        if (mgr.maxStage >= 10 || mgr.beans > 0) {
            this.prestigeBtn.setVisible(true);
            this.prestigeBtn.setAlpha(potentialBeans > 0 ? 1 : 0.5);
            this.prestigeText.setText(`REBIRTH\n+${potentialBeans} Beans`);
        } else {
            // Placeholder text if locked? Or just hide content
            this.prestigeBtn.setVisible(true); // Keep grid structure? or fade it.
            this.prestigeBtn.setAlpha(0.3);
            this.prestigeText.setText("Locked\n(Stg 10)");
        }
    }

    private updateBeanShopDisplay(mgr: any) {
        if (!this.beanGoldBtn || !this.beanGoldBtn.active) return;

        this.beanGoldText.setText(`Start Gold (Lv.${mgr.beanStartingGoldLevel})\nCost: ${GameConfig.BEAN_UPGRADE_COST}`);
        this.updateButtonVisuals(this.beanGoldBtn, 'beanGold', mgr.beans, GameConfig.BEAN_UPGRADE_COST, false);

        this.beanDamageText.setText(`Global Dmg (Lv.${mgr.beanDamageLevel})\nCost: ${GameConfig.BEAN_UPGRADE_COST}`);
        this.updateButtonVisuals(this.beanDamageBtn, 'beanDamage', mgr.beans, GameConfig.BEAN_UPGRADE_COST, false);

        const speedMaxed = mgr.beanAutoSpeedLevel >= GameConfig.BEAN_MAX_SPEED_REDUCTION_LEVELS;
        this.beanSpeedText.setText(`Auto Speed (Lv.${mgr.beanAutoSpeedLevel})\nCost: ${GameConfig.BEAN_UPGRADE_COST}`);
        this.updateButtonVisuals(this.beanSpeedBtn, 'beanSpeed', mgr.beans, GameConfig.BEAN_UPGRADE_COST, speedMaxed);
    }

    private bulkHireButtons: Map<string, { bg: Phaser.GameObjects.Rectangle, txt: Phaser.GameObjects.Text }> = new Map();

    private updateBulkHireButtons(activeMode: string) {
        this.bulkHireButtons.forEach((btn, mode) => {
            if (mode === activeMode) {
                btn.bg.setFillStyle(0x00aaff).setStrokeStyle(2, 0xffffff);
                btn.txt.setColor('#ffffff');
            } else {
                btn.bg.setFillStyle(0x222222).setStrokeStyle(1, 0x666666);
                btn.txt.setColor('#aaaaaa');
            }
        });
    }

    public updateCoworkerDisplay(mgr: any) {
        let currentY = 0; // Requires full re-layout if visibility changes
        const margin = 10;
        const cardHeight = 70;

        // Account for top buttons height
        currentY = margin + 40 + margin + 50 + margin; // Badge Btn (40) + Bottom Margin (10) + Bulk Btn Container (50) + Margin (10)

        this.coworkerCards.forEach((card, id) => {
            const index = GameConfig.COWORKER_DATA.findIndex(c => c.id === id);
            const data = GameConfig.COWORKER_DATA[index];
            if (!data) return;

            const isUnlocked = mgr.isCoworkerUnlocked(index);
            const isTeased = mgr.isCoworkerTeased(index);

            // Visibility Logic
            if (!isUnlocked && !isTeased) {
                card.setVisible(false);
                return; // Hidden, do not increment Y or update contents
            }

            card.setVisible(true);
            card.y = currentY + cardHeight / 2; // Reposition dynamically based on visible cards
            currentY += cardHeight + margin;

            const titleText = card.getData('titleText') as Phaser.GameObjects.Text;
            const dpsText = card.getData('dpsText') as Phaser.GameObjects.Text;
            const synergyText = card.getData('synergyText') as Phaser.GameObjects.Text;
            const btnText = card.getData('btnText') as Phaser.GameObjects.Text;
            const btnBg = card.getData('btnBg') as Phaser.GameObjects.Rectangle;
            const btnLayerFill = card.getData('btnLayerFill') as Phaser.GameObjects.Rectangle; // Optional if tracked
            const nameText = card.getData('nameText') as string;

            if (isTeased) {
                const prevData = GameConfig.COWORKER_DATA[index - 1];
                const threshold = mgr.getUnlockThreshold(index);

                titleText.setText(`[???] (잠김)`);
                titleText.setColor('#666666');
                dpsText.setText(`요구 조건: ${prevData.name} Lv.${threshold} 달성`);
                dpsText.setColor('#ff4444');
                synergyText.setVisible(false);

                btnText.setVisible(false);
                btnBg.setVisible(false);
                if (btnLayerFill) btnLayerFill.setVisible(false);
            } else {
                // Fully Unlocked state
                titleText.setColor('#ffffff');
                btnText.setVisible(true);
                btnBg.setVisible(true);
                if (btnLayerFill) btnLayerFill.setVisible(true);

                const level = mgr.coworkerLevels[id] || 0;
                const { targetCount, totalCost } = mgr.getBulkHireInfo(id);
                const badgeInfo = mgr.getBadgeInfo(level);

                const synergyPct = mgr.getSynergyBonus(index) * 100;
                synergyText.setText(`Synergy: +${synergyPct}%`);
                synergyText.setVisible(true);

                const dps = (data.baseDPS * level) * badgeInfo.multiplier * (1 + (synergyPct / 100));

                titleText.setText(`${nameText} Lv.${level}`);
                dpsText.setText(`DPS: ${dps}`);

                // Re-style DPS text based on badge
                if (badgeInfo.multiplier > 1) {
                    // Create inline badge text format matching the modal UI style
                    let inlineBadgeStr = " [BONUS!]";
                    if (badgeInfo.multiplier === 10) inlineBadgeStr = " [x10 BONUS!]";
                    if (badgeInfo.multiplier === 5) inlineBadgeStr = " [x5 BONUS!]";
                    if (badgeInfo.multiplier === 3) inlineBadgeStr = " [x3 BONUS!]";
                    if (badgeInfo.multiplier === 2) inlineBadgeStr = " [x2 BONUS!]";

                    dpsText.setText(`DPS: ${dps}${inlineBadgeStr}`);
                    dpsText.setColor(badgeInfo.color);
                } else {
                    dpsText.setColor('#aaaaaa');
                }

                if (targetCount === 0 && mgr.buyMode === 'next') {
                    btnText.setText(`MAX\nBADGE`);
                    btnBg.setFillStyle(0x444444);
                    btnBg.disableInteractive();
                } else {
                    btnText.setText(`Hire x${targetCount}\n$${totalCost}`);
                    const canAfford = targetCount > 0 && mgr.gold >= totalCost;
                    btnBg.setFillStyle(canAfford ? 0x008800 : 0x444444);
                    if (canAfford) {
                        btnBg.setInteractive({ useHandCursor: true });
                    } else {
                        btnBg.disableInteractive();
                    }
                }
            }
        });

        if (this.workSpeedText) {
            const delayInSec = (mgr.getAutoAttackDelay() / 1000).toFixed(2);
            this.workSpeedText.setText(`Company Work Speed: ${delayInSec}s`);
        }

        // Update total scroll height based on visible cards
        if (this.currentDrawerTab === 'personnel') {
            this.contentHeight = currentY;
            // Important: we don't automatically call updateScrollPosition() here if the user is 
            // actively dragging, but we should ensure boundaries are respected.
            // A clean way is just let the update naturally clamp on the next frame or manually:
            const minScroll = Math.min(0, -(this.contentHeight - this.visibleHeight));
            if (this.scrollY < minScroll) {
                this.scrollY = minScroll;
                this.drawerContentContainer.y = 40 + this.scrollY;
            }
        }

        // Update badge modal if open
        if (this.badgeModal && this.badgeModal.visible) {
            this.updateBadgeModalContent();
        }
    }

    private updateButtonAvailability(mgr: any) {
        if (this.clickUpgradeBtn && this.clickUpgradeBtn.active)
            this.updateButtonVisuals(this.clickUpgradeBtn, 'click', mgr.gold, mgr.clickUpgradeCost);

        if (this.autoUpgradeBtn && this.autoUpgradeBtn.active)
            this.updateButtonVisuals(this.autoUpgradeBtn, 'auto', mgr.gold, mgr.autoUpgradeCost);

        if (this.critUpgradeBtn && this.critUpgradeBtn.active)
            this.updateButtonVisuals(this.critUpgradeBtn, 'crit', mgr.gold, mgr.critUpgradeCost, mgr.critRate >= 0.5);

        if (this.goldUpgradeBtn && this.goldUpgradeBtn.active)
            this.updateButtonVisuals(this.goldUpgradeBtn, 'gold', mgr.gold, mgr.goldUpgradeCost);
    }

    private updateArtifactAvailability(mgr: any) {
        if (this.artifactCardBtn && this.artifactCardBtn.active)
            this.updateButtonVisuals(this.artifactCardBtn, 'card', mgr.stocks, 5, false);

        if (this.artifactEspressoBtn && this.artifactEspressoBtn.active)
            this.updateButtonVisuals(this.artifactEspressoBtn, 'espresso', mgr.stocks, 10, false);
    }

    private updateButtonVisuals(btn: Phaser.GameObjects.Container, id: string, current: number, cost: number, isMaxed: boolean = false) {
        if (!btn || !btn.active) return;

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

        if (glow) glow.setVisible(canAfford);

        if (fill) {
            const ratio = Phaser.Math.Clamp(current / cost, 0, 1);
            const width = bg.width; // Should be consistent
            fill.width = width * ratio;
        }
    }

    private updateStatsDisplay(mgr: any) {
        this.lastUpgradeManager = mgr; // Store for re-render

        // Compact Strings
        if (this.clickUpgradeText && this.clickUpgradeText.active)
            this.clickUpgradeText.setText(`Click\n$${mgr.clickUpgradeCost}\nLVL ${mgr.clickUpgradeLevel || '?'}`);

        if (this.autoUpgradeText && this.autoUpgradeText.active)
            this.autoUpgradeText.setText(`Auto\n$${mgr.autoUpgradeCost}\nLVL ${mgr.autoUpgradeLevel || '?'}`);

        const critPercent = Math.round(mgr.critRate * 100);
        if (this.critUpgradeText && this.critUpgradeText.active)
            this.critUpgradeText.setText(mgr.critRate >= 0.5 ? `Crit\nMAX` : `Crit\n$${mgr.critUpgradeCost}\n${critPercent}%`);

        const goldPercent = Math.round((mgr.goldMultiplier - 1) * 100);
        if (this.goldUpgradeText && this.goldUpgradeText.active)
            this.goldUpgradeText.setText(`Gold\n$${mgr.goldUpgradeCost}\n+${goldPercent}%`);

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
        if (!this.skillText || !this.skillText.active) return;

        if (isActive) {
            this.buffText.setVisible(true);
            this.skillText.setText("ACTIVE!");
            if (this.skillOverlay) this.skillOverlay.setVisible(false);
            if (this.skillTimerText) this.skillTimerText.setVisible(false);
        } else if (cooldownRemaining > 0) {
            this.buffText.setVisible(false);
            this.skillText.setText("Skill");
            if (this.skillOverlay) this.skillOverlay.setVisible(true);
            if (this.skillTimerText) this.skillTimerText.setVisible(true).setText((cooldownRemaining / 1000).toFixed(0)); // Compact: 1 digit
        } else {
            this.buffText.setVisible(false);
            this.skillText.setText("Skill");
            if (this.skillOverlay) this.skillOverlay.setVisible(false);
            if (this.skillTimerText) this.skillTimerText.setVisible(false);
        }
    }

    public updateStageInfo(stage: number, kills: number, required: number, bossTime?: number) {
        if (bossTime !== undefined) {
            this.levelText.setText(`BOSS! Stage ${stage}`);
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
        this.scene.tweens.add({ targets: this.goldText, scale: 1.2, duration: 100, yoyo: true });
    }

    // --- Offline Popup ---

    private offlinePopupContainer!: Phaser.GameObjects.Container;
    private offlinePopupText!: Phaser.GameObjects.Text;

    public showOfflinePopup(amount: number, seconds: number) {
        if (!this.offlinePopupContainer) {
            this.createOfflinePopup();
        }

        this.offlinePopupText.setText(`Welcome Back!\nGone: ${seconds}s\nEarned: $${Math.floor(amount)}`);
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

        this.offlinePopupContainer = this.scene.add.container(width / 2, height / 2).setDepth(2000);

        const bg = this.scene.add.rectangle(0, 0, width * 0.8, height * 0.3, 0x000000, 0.9)
            .setStrokeStyle(4, 0xffd700);

        const title = this.scene.add.text(0, -height * 0.1, 'OFFLINE', {
            fontFamily: 'Arial', fontSize: '28px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.offlinePopupText = this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        const btn = this.scene.add.container(0, height * 0.08);
        const btnBg = this.scene.add.rectangle(0, 0, 140, 40, 0x00aa00).setInteractive({ useHandCursor: true });
        const btnTxt = this.scene.add.text(0, 0, 'COLLECT', { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        btn.add([btnBg, btnTxt]);

        btnBg.on('pointerdown', () => {
            this.offlinePopupContainer.setVisible(false);
        });

        this.offlinePopupContainer.add([bg, title, this.offlinePopupText, btn]);
        this.offlinePopupContainer.setVisible(false);
    }
}
