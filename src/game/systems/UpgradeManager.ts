import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export interface GameSaveData {
    version: number;
    gold: number;
    clickDamage: number;
    autoDamage: number;
    critRate: number;
    goldMultiplier: number;
    stage: number;
    maxStage?: number;
    enemiesKilled: number;
    stocks: number;
    beans?: number;
    beanStartingGoldLevel?: number;
    beanDamageLevel?: number;
    beanAutoSpeedLevel?: number;
    coworkerLevels?: Record<string, number>;
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
    public beans: number = 0; // Prestige Currency
    public beanStartingGoldLevel: number = 0;
    public beanDamageLevel: number = 0;
    public beanAutoSpeedLevel: number = 0;

    // Coworkers
    public coworkerLevels: Record<string, number> = {};

    // Stats Tracking
    public maxStage: number = 1;

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

    // HR Derived Stats
    public cachedTotalCoworkers: number = 0;

    // Bulk Hiring Mode
    public buyMode: '1' | '10' | '100' | 'max' | 'next' = '1';

    constructor() {
        super();
        GameConfig.COWORKER_DATA.forEach(c => {
            this.coworkerLevels[c.id] = 0;
        });
    }

    // --- Serialization ---
    public toObject(): GameSaveData {
        return {
            version: GameConfig.SAVE_VERSION,
            gold: this.gold,
            clickDamage: this.clickDamage,
            autoDamage: this.autoDamage,
            critRate: this.critRate,
            goldMultiplier: this.goldMultiplier,
            stage: this.stage,
            maxStage: this.maxStage,
            enemiesKilled: this.enemiesKilled,
            stocks: this.stocks,
            beans: this.beans,
            beanStartingGoldLevel: this.beanStartingGoldLevel,
            beanDamageLevel: this.beanDamageLevel,
            beanAutoSpeedLevel: this.beanAutoSpeedLevel,
            coworkerLevels: this.coworkerLevels,
            artifactGoldenCard: this.artifactGoldenCard,
            artifactEspresso: this.artifactEspresso,
            clickUpgradeCost: this.clickUpgradeCost,
            autoUpgradeCost: this.autoUpgradeCost,
            critUpgradeCost: this.critUpgradeCost,
            goldUpgradeCost: this.goldUpgradeCost,
            lastSaveTime: Date.now()
        };
    }

    public fromObject(data: Partial<GameSaveData>) {
        this.gold = this.readNumber(data.gold, 0);
        this.clickDamage = this.readNumber(data.clickDamage, 1, 1);
        this.autoDamage = this.readNumber(data.autoDamage, 0);
        this.critRate = Phaser.Math.Clamp(this.readNumber(data.critRate, 0), 0, 0.5);
        this.goldMultiplier = this.readNumber(data.goldMultiplier, 1, 1);
        this.stage = this.readInteger(data.stage, 1, 1);
        this.maxStage = Math.max(this.stage, this.readInteger(data.maxStage, this.stage, 1));
        this.enemiesKilled = this.readInteger(data.enemiesKilled, 0);
        this.stocks = this.readInteger(data.stocks, 0);
        this.beans = this.readInteger(data.beans, 0);
        this.beanStartingGoldLevel = this.readInteger(data.beanStartingGoldLevel, 0);
        this.beanDamageLevel = this.readInteger(data.beanDamageLevel, 0);
        this.beanAutoSpeedLevel = this.readInteger(data.beanAutoSpeedLevel, 0);

        this.coworkerLevels = data.coworkerLevels && typeof data.coworkerLevels === 'object'
            ? { ...data.coworkerLevels }
            : {};
        GameConfig.COWORKER_DATA.forEach(c => {
            this.coworkerLevels[c.id] = this.readInteger(this.coworkerLevels[c.id], 0);
        });

        this.artifactGoldenCard = this.readInteger(data.artifactGoldenCard, 0);
        this.artifactEspresso = this.readInteger(data.artifactEspresso, 0);
        this.clickUpgradeCost = this.readNumber(data.clickUpgradeCost, GameConfig.INITIAL_CLICK_COST, 1);
        this.autoUpgradeCost = this.readNumber(data.autoUpgradeCost, GameConfig.INITIAL_AUTO_COST, 1);
        this.critUpgradeCost = this.readNumber(data.critUpgradeCost, GameConfig.INITIAL_CRIT_COST, 1);
        this.goldUpgradeCost = this.readNumber(data.goldUpgradeCost, GameConfig.INITIAL_GOLD_COST, 1);

        this.emitDetails();
    }

    private readNumber(value: unknown, fallback: number, minimum: number = 0): number {
        return typeof value === 'number' && Number.isFinite(value) && value >= minimum
            ? value
            : fallback;
    }

    private readInteger(value: unknown, fallback: number, minimum: number = 0): number {
        return Math.floor(this.readNumber(value, fallback, minimum));
    }

    public emitDetails() {
        this.emit('state-changed', this);
    }

    // --- Prestige ---

    public getPotentialBeans(): number {
        if (this.maxStage < GameConfig.PRESTIGE_UNLOCK_STAGE) return 0;
        // Formula: floor((maxStage / 10) ^ 2)
        return Math.floor(Math.pow(this.maxStage / 10, 2));
    }

    public prestige() {
        const beansToGain = this.getPotentialBeans();
        if (beansToGain <= 0) return;

        // Reset
        this.gold = this.beanStartingGoldLevel * GameConfig.BEAN_STARTING_GOLD_BASE;
        this.clickDamage = 1;
        this.autoDamage = 0;
        this.critRate = 0;
        this.goldMultiplier = 1.0;
        this.stage = 1;
        this.enemiesKilled = 0;
        this.stocks = 0; // Reset stocks too? Usually logic is soft reset. User said "Reset Gold and Upgrades (keep Artifacts)". Stocks are currency for artifacts? Usually stocks shouldn't display if artifacts kept? 
        // User: "Reset Gold and Upgrades (keep Artifacts) in exchange for 'Prestige Beans'".
        // Artifacts cost stocks. If we keep artifacts, we should probably keep stocks or reset them?
        // Let's reset stocks to make it challenging again, since artifacts are permanent.

        // Costs Reset
        this.clickUpgradeCost = GameConfig.INITIAL_CLICK_COST;
        this.autoUpgradeCost = GameConfig.INITIAL_AUTO_COST;
        this.critUpgradeCost = GameConfig.INITIAL_CRIT_COST;
        this.goldUpgradeCost = GameConfig.INITIAL_GOLD_COST;

        // Gain Beans
        this.beans += beansToGain;

        // Emit
        this.emit('gold-changed', this.gold);
        this.emit('stocks-changed', this.stocks);
        this.emit('state-changed', this);
        this.emit('progression-changed', this.enemiesKilled, this.stage);
    }

    public getGlobalDamageMultiplier(): number {
        const unspentBeanBonus = this.beans * GameConfig.PRESTIGE_BEAN_BONUS;
        const upgradeBonus = this.beanDamageLevel * GameConfig.BEAN_DAMAGE_BONUS;
        return 1 + unspentBeanBonus + upgradeBonus;
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
        if (this.stage > this.maxStage) {
            this.maxStage = this.stage;
        }
        this.enemiesKilled = 0;
        this.emit('progression-changed', this.enemiesKilled, this.stage);
    }

    public failBoss() {
        this.enemiesKilled = 0; // Reset progress on failure
        this.emit('progression-changed', this.enemiesKilled, this.stage);
    }

    // --- Bean Upgrades ---
    public getAutoAttackDelay(): number {
        return Math.max(1000 - (this.beanAutoSpeedLevel * GameConfig.BEAN_AUTO_SPEED_REDUCTION), GameConfig.BEAN_AUTO_SPEED_MIN || 200);
    }

    public purchaseBeanUpgrade(type: 'startingGold' | 'damage' | 'autoSpeed'): boolean {
        if (this.beans < GameConfig.BEAN_UPGRADE_COST) return false;

        if (type === 'startingGold') {
            this.beanStartingGoldLevel++;
        } else if (type === 'damage') {
            this.beanDamageLevel++;
        } else if (type === 'autoSpeed') {
            if (this.beanAutoSpeedLevel >= GameConfig.BEAN_MAX_SPEED_REDUCTION_LEVELS) return false;
            this.beanAutoSpeedLevel++;
        }

        this.beans -= GameConfig.BEAN_UPGRADE_COST;
        this.emit('beans-changed', this.beans);
        this.emit('stats-changed', this);
        return true;
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

    // --- Coworkers (HR) ---

    public getSynergyBonus(index: number): number {
        // Higher ranks (index > current) boost this rank's DPS by 1% per 10 levels.
        let bonusPct = 0;
        for (let i = index + 1; i < GameConfig.COWORKER_DATA.length; i++) {
            const higherRankId = GameConfig.COWORKER_DATA[i].id;
            const higherRankLevel = this.coworkerLevels[higherRankId] || 0;
            bonusPct += Math.floor(higherRankLevel / 10) * 0.01; // +1% per 10 levels
        }
        return bonusPct;
    }

    public getTotalCoworkerDPS(): number {
        let dps = 0;
        let totalCount = 0;

        GameConfig.COWORKER_DATA.forEach((c, index) => {
            const level = this.coworkerLevels[c.id] || 0;
            totalCount += level;

            if (level === 0) return;

            const { multiplier } = this.getBadgeInfo(level);
            const synergy = 1 + this.getSynergyBonus(index);

            dps += (level * c.baseDPS) * multiplier * synergy;
        });

        this.cachedTotalCoworkers = totalCount;
        return dps;
    }

    public getBadgeInfo(level: number): { multiplier: number, text: string, color: string } {
        if (level >= 200) return { multiplier: 10, text: '[x10 배지 획득!]', color: '#ffaa00' };
        if (level >= 100) return { multiplier: 5, text: '[x5 배지 획득!]', color: '#ff33ff' };
        if (level >= 50) return { multiplier: 3, text: '[x3 배지 획득!]', color: '#00aaff' };
        if (level >= 25) return { multiplier: 2, text: '[x2 배지 획득!]', color: '#00ff00' };
        return { multiplier: 1, text: '', color: '#aaaaaa' };
    }

    public getCoworkerCost(id: string): number {
        // Maintain backwards compatibility: Returns cost for exactly 1 hire.
        const data = GameConfig.COWORKER_DATA.find(c => c.id === id);
        if (!data) return 0;
        const level = this.coworkerLevels[id] || 0;
        return Math.floor(data.baseCost * Math.pow(data.costMultiplier, level));
    }

    public getBulkCost(id: string, count: number): number {
        if (count <= 0) return 0;
        const data = GameConfig.COWORKER_DATA.find(c => c.id === id);
        if (!data) return 0;
        const level = this.coworkerLevels[id] || 0;

        // Sum of geometric series: a * (1 - r^n) / (1 - r)
        // Where a = current cost, r = multiplier, n = count
        const a = data.baseCost * Math.pow(data.costMultiplier, level);
        const r = data.costMultiplier;

        if (r === 1) return a * count; // Edge case safeguard

        const totalCost = a * (1 - Math.pow(r, count)) / (1 - r);
        return Math.floor(totalCost);
    }

    public getAffordableCount(id: string, currentGold: number): number {
        const data = GameConfig.COWORKER_DATA.find(c => c.id === id);
        if (!data) return 0;
        const level = this.coworkerLevels[id] || 0;

        const a = data.baseCost * Math.pow(data.costMultiplier, level);
        const r = data.costMultiplier;

        if (currentGold < a) return 0;
        if (r === 1) return Math.floor(currentGold / a);

        // From formula: sum = a * (1 - r^n) / (1 - r)
        // solve for n: n = floor( log(1 - sum * (1 - r) / a) / log(r) )
        // Note: r > 1 so (1-r) is negative. 
        const arg = 1 - (currentGold * (1 - r) / a);
        if (arg <= 0) return 0; // Prevent log of negative, theoretically shouldn't happen if bounded
        const count = Math.floor(Math.log(arg) / Math.log(r));
        return Math.max(0, count);
    }

    public getNeededForNextBadge(level: number): number {
        if (level < 25) return 25 - level;
        if (level < 50) return 50 - level;
        if (level < 100) return 100 - level;
        if (level < 200) return 200 - level;
        return 0; // Max badge reached or no further badges
    }

    public getUnlockThreshold(index: number): number {
        return index * 10;
    }

    public isCoworkerUnlocked(index: number): boolean {
        if (index === 0) return true;
        const prevId = GameConfig.COWORKER_DATA[index - 1].id;
        const prevLevel = this.coworkerLevels[prevId] || 0;
        return prevLevel >= this.getUnlockThreshold(index);
    }

    public isCoworkerTeased(index: number): boolean {
        if (index === 0) return false;
        if (this.isCoworkerUnlocked(index)) return false;

        // Teased if the previous one IS unlocked, but hasn't reached the threshold yet.
        return this.isCoworkerUnlocked(index - 1);
    }

    public getBulkHireInfo(id: string): { targetCount: number, totalCost: number } {
        const level = this.coworkerLevels[id] || 0;
        let targetCount = 0;

        if (this.buyMode === '1') targetCount = 1;
        else if (this.buyMode === '10') targetCount = 10;
        else if (this.buyMode === '100') targetCount = 100;
        else if (this.buyMode === 'max') targetCount = this.getAffordableCount(id, this.gold);
        else if (this.buyMode === 'next') targetCount = this.getNeededForNextBadge(level);

        if (targetCount <= 0) return { targetCount: 0, totalCost: 0 };
        return { targetCount, totalCost: this.getBulkCost(id, targetCount) };
    }

    public hireCoworker(id: string): boolean {
        const { targetCount, totalCost } = this.getBulkHireInfo(id);

        if (targetCount <= 0 || !this.canAfford(totalCost)) return false;

        this.spendGold(totalCost);
        this.coworkerLevels[id] = (this.coworkerLevels[id] || 0) + targetCount;
        this.emit('stats-changed', this);
        this.emit('coworkers-changed', this);
        return true;
    }
}
