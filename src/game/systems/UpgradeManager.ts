import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export interface GameSaveData {
    gold: number; // Stored in UIManager usually, but UpgradeManager should probably track it or we save from both? 
    // actually UIManager handles gold currently. We should potentially move gold to UpgradeManager or SaveManager.
    // For now, let's pass gold to save/load or keep it in UpgradeManager.
    // The Plan said "Store Gold... in localStorage". 
    // If UIManager has `currentGold`, we need to save it. 
    // Refactoring: Let's move Gold state to UpgradeManager to centralize game state?
    // Or just accept it in toObject.
    // Let's Move Gold to UpgradeManager to make it the "State Manager".
    clickDamage: number;
    autoDamage: number;
    critRate: number;
    goldMultiplier: number;
    stage: number;
    enemiesKilled: number;
    stocks: number;
    artifactGoldenCard: number;
    artifactEspresso: number;
    clickUpgradeCost: number;
    autoUpgradeCost: number;
    critUpgradeCost: number;
    goldUpgradeCost: number;
    lastSaveTime: number;
}

export class UpgradeManager extends Phaser.Events.EventEmitter {
    // Stats
    public clickDamage: number = 1;
    public autoDamage: number = 0;
    public critRate: number = 0; // 0 to 0.5 (50%)
    public goldMultiplier: number = 1.0;

    // Progression
    public stage: number = 1;
    public enemiesKilled: number = 0;

    // Currency (Moved here from UIManager for centralization)
    public gold: number = 0;
    public stocks: number = 0;

    // Artifacts
    public artifactGoldenCard: number = 0;   // +50% Gold each
    public artifactEspresso: number = 0;     // -20% Cooldown each

    // Costs
    public clickUpgradeCost: number = GameConfig.INITIAL_CLICK_COST;
    public autoUpgradeCost: number = GameConfig.INITIAL_AUTO_COST;
    public critUpgradeCost: number = GameConfig.INITIAL_CRIT_COST;
    public goldUpgradeCost: number = GameConfig.INITIAL_GOLD_COST;

    // Skill: Coffee Rush
    private lastSkillUsedTime: number = -GameConfig.SKILL_COOLDOWN; // Ready at start

    constructor() {
        super();
    }

    // --- Serialization ---
    public toObject(): GameSaveData {
        return {
            gold: this.gold,
            clickDamage: this.clickDamage,
            autoDamage: this.autoDamage,
            critRate: this.critRate,
            goldMultiplier: this.goldMultiplier,
            stage: this.stage,
            enemiesKilled: this.enemiesKilled,
            stocks: this.stocks,
            artifactGoldenCard: this.artifactGoldenCard,
            artifactEspresso: this.artifactEspresso,
            clickUpgradeCost: this.clickUpgradeCost,
            autoUpgradeCost: this.autoUpgradeCost,
            critUpgradeCost: this.critUpgradeCost,
            goldUpgradeCost: this.goldUpgradeCost,
            lastSaveTime: Date.now()
        };
    }

    public fromObject(data: GameSaveData) {
        this.gold = data.gold;
        this.clickDamage = data.clickDamage;
        this.autoDamage = data.autoDamage;
        this.critRate = data.critRate;
        this.goldMultiplier = data.goldMultiplier;
        this.stage = data.stage;
        this.enemiesKilled = data.enemiesKilled;
        this.stocks = data.stocks;
        this.artifactGoldenCard = data.artifactGoldenCard;
        this.artifactEspresso = data.artifactEspresso;
        this.clickUpgradeCost = data.clickUpgradeCost;
        this.autoUpgradeCost = data.autoUpgradeCost;
        this.critUpgradeCost = data.critUpgradeCost;
        this.goldUpgradeCost = data.goldUpgradeCost;

        this.emitDetails();
    }

    public emitDetails() {
        this.emit('state-changed', this);
    }

    // --- Currency Helpers ---
    public addGold(amount: number) {
        this.gold += amount;
        this.emit('gold-changed', this.gold);
    }

    public spendGold(amount: number) {
        this.gold -= amount;
        this.emit('gold-changed', this.gold);
    }

    public canAfford(cost: number): boolean {
        return this.gold >= cost;
    }

    // --- Progression ---

    public addKill() {
        this.enemiesKilled++;
        this.emit('progression-changed', this.enemiesKilled, this.stage);
    }

    public isBossReady(): boolean {
        return this.enemiesKilled >= GameConfig.ENEMIES_PER_STAGE;
    }

    public advanceStage() {
        this.stage++;
        this.enemiesKilled = 0;
        this.emit('progression-changed', this.enemiesKilled, this.stage);
    }

    public failBoss() {
        this.enemiesKilled = 0; // Reset progress on failure
        this.emit('progression-changed', this.enemiesKilled, this.stage);
    }

    // --- Currency & Artifacts ---

    public addStocks(amount: number) {
        this.stocks += amount;
        this.emit('stocks-changed', this.stocks);
    }

    public purchaseArtifact(type: 'goldenCard' | 'espresso'): boolean {
        const cost = type === 'goldenCard' ? GameConfig.ARTIFACT_CARD_COST : GameConfig.ARTIFACT_ESPRESSO_COST;

        if (this.stocks >= cost) {
            this.stocks -= cost;
            if (type === 'goldenCard') this.artifactGoldenCard++;
            if (type === 'espresso') this.artifactEspresso++;

            this.emit('stocks-changed', this.stocks);
            this.emit('artifacts-changed', this);
            return true;
        }
        return false;
    }

    public getTotalGoldMultiplier(): number {
        // Base Multiplier * (1 + 0.5 * Artifact Count)
        return this.goldMultiplier * (1 + 0.5 * this.artifactGoldenCard);
    }

    public getSkillCooldown(): number {
        // Base * (0.8 ^ count)
        return GameConfig.SKILL_COOLDOWN * Math.pow(0.8, this.artifactEspresso);
    }

    // --- Upgrades ---

    public purchaseClickUpgrade(): boolean {
        if (!this.canAfford(this.clickUpgradeCost)) return false;

        this.spendGold(this.clickUpgradeCost);
        this.clickDamage++;
        this.clickUpgradeCost = Math.ceil(this.clickUpgradeCost * GameConfig.COST_MULTIPLIER);

        this.emit('stats-changed', this);
        return true;
    }

    public purchaseAutoUpgrade(): boolean {
        if (!this.canAfford(this.autoUpgradeCost)) return false;

        this.spendGold(this.autoUpgradeCost);
        this.autoDamage++;
        this.autoUpgradeCost = Math.ceil(this.autoUpgradeCost * GameConfig.COST_MULTIPLIER);

        this.emit('stats-changed', this);
        return true;
    }

    public purchaseCritUpgrade(): boolean {
        if (this.critRate >= 0.5) return false;
        if (!this.canAfford(this.critUpgradeCost)) return false;

        this.spendGold(this.critUpgradeCost);
        this.critRate = Math.min(0.5, this.critRate + 0.05);
        this.critUpgradeCost = Math.ceil(this.critUpgradeCost * GameConfig.COST_MULTIPLIER);

        this.emit('stats-changed', this);
        return true;
    }

    public purchaseGoldUpgrade(): boolean {
        if (!this.canAfford(this.goldUpgradeCost)) return false;

        this.spendGold(this.goldUpgradeCost);
        this.goldMultiplier += 0.1;
        this.goldUpgradeCost = Math.ceil(this.goldUpgradeCost * GameConfig.COST_MULTIPLIER);

        this.emit('stats-changed', this);
        return true;
    }

    // --- Skills ---

    public activateSkill(currentTime: number): boolean {
        if (this.isSkillReady(currentTime)) {
            this.lastSkillUsedTime = currentTime;
            this.emit('skill-activated', this.lastSkillUsedTime);
            return true;
        }
        return false;
    }

    public isSkillActive(currentTime: number): boolean {
        return (currentTime - this.lastSkillUsedTime) < GameConfig.SKILL_DURATION;
    }

    public isSkillReady(currentTime: number): boolean {
        return (currentTime - this.lastSkillUsedTime) >= this.getSkillCooldown();
    }

    public getSkillCooldownRemaining(currentTime: number): number {
        const cooldown = this.getSkillCooldown();
        const elapsed = currentTime - this.lastSkillUsedTime;
        if (elapsed >= cooldown) return 0;
        return cooldown - elapsed;
    }
}
