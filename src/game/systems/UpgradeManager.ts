
export class UpgradeManager {
    // Stats
    public clickDamage: number = 1;
    public autoDamage: number = 0;
    public critRate: number = 0; // 0 to 0.5 (50%)
    public goldMultiplier: number = 1.0;

    // Progression
    public stage: number = 1;
    public enemiesKilled: number = 0;
    public readonly ENEMIES_PER_STAGE: number = 10;

    // Currency
    public stocks: number = 0;

    // Artifacts
    public artifactGoldenCard: number = 0;   // +50% Gold each
    public artifactEspresso: number = 0;     // -20% Cooldown each

    // Costs
    public clickUpgradeCost: number = 10;
    public autoUpgradeCost: number = 50;
    public critUpgradeCost: number = 100;
    public goldUpgradeCost: number = 200;

    private readonly COST_MULTIPLIER: number = 1.5;

    // Skill: Coffee Rush
    public readonly BASE_SKILL_DURATION: number = 10000;
    public readonly BASE_SKILL_COOLDOWN: number = 30000;
    private lastSkillUsedTime: number = -30000;

    constructor() { }

    public canAfford(gold: number, cost: number): boolean {
        return gold >= cost;
    }

    // --- Progression ---

    public addKill() {
        this.enemiesKilled++;
    }

    public isBossReady(): boolean {
        return this.enemiesKilled >= this.ENEMIES_PER_STAGE;
    }

    public advanceStage() {
        this.stage++;
        this.enemiesKilled = 0;
    }

    public failBoss() {
        this.enemiesKilled = 0; // Reset progress on failure
    }

    // --- Currency & Artifacts ---

    public addStocks(amount: number) {
        this.stocks += amount;
    }

    public purchaseArtifact(type: 'goldenCard' | 'espresso'): boolean {
        const cost = type === 'goldenCard' ? 5 : 10;

        if (this.stocks >= cost) {
            this.stocks -= cost;
            if (type === 'goldenCard') this.artifactGoldenCard++;
            if (type === 'espresso') this.artifactEspresso++;
            return true;
        }
        return false;
    }

    public getTotalGoldMultiplier(): number {
        // Base Multiplier * (1 + 0.5 * Artifact Count)
        return this.goldMultiplier * (1 + 0.5 * this.artifactGoldenCard);
    }

    public getSkillCooldown(): number {
        // Base - (20% * Artifact Count * Base)
        // Cap at some reasonable minimum? Requirement says "-20%". 
        // 5 Espresso Machines = 0 cooldown? Let's assume multiplicative reduction or simple subtraction.
        // "Reduces ... by 20%" usually implies 0.8 multiplier.
        // Let's go with 0.8^count for diminishing returns, OR flat 20% of BASE?
        // Requirement: "Reduces active skill cooldown by 20%". Let's assume multiplicative for safety (0.8x), or simple subtraction.
        // Simple subtraction of 20% base (6000ms) would mean 5 items = 0 cooldown.
        // Let's use Multiplicative: Current = Base * (0.8 ^ count).
        return this.BASE_SKILL_COOLDOWN * Math.pow(0.8, this.artifactEspresso);
    }

    // --- Upgrades ---

    public purchaseClickUpgrade(currentGold: number): { success: boolean, cost: number, newDamage: number } {
        if (!this.canAfford(currentGold, this.clickUpgradeCost)) {
            return { success: false, cost: 0, newDamage: this.clickDamage };
        }
        const cost = this.clickUpgradeCost;
        this.clickDamage++;
        this.clickUpgradeCost = Math.ceil(this.clickUpgradeCost * this.COST_MULTIPLIER);
        return { success: true, cost, newDamage: this.clickDamage };
    }

    public purchaseAutoUpgrade(currentGold: number): { success: boolean, cost: number, newDamage: number } {
        if (!this.canAfford(currentGold, this.autoUpgradeCost)) {
            return { success: false, cost: 0, newDamage: this.autoDamage };
        }
        const cost = this.autoUpgradeCost;
        this.autoDamage++;
        this.autoUpgradeCost = Math.ceil(this.autoUpgradeCost * this.COST_MULTIPLIER);
        return { success: true, cost, newDamage: this.autoDamage };
    }

    public purchaseCritUpgrade(currentGold: number): { success: boolean, cost: number, newRate: number } {
        if (this.critRate >= 0.5) return { success: false, cost: 0, newRate: this.critRate };

        if (!this.canAfford(currentGold, this.critUpgradeCost)) {
            return { success: false, cost: 0, newRate: this.critRate };
        }
        const cost = this.critUpgradeCost;
        this.critRate = Math.min(0.5, this.critRate + 0.05);
        this.critUpgradeCost = Math.ceil(this.critUpgradeCost * this.COST_MULTIPLIER);
        return { success: true, cost, newRate: this.critRate };
    }

    public purchaseGoldUpgrade(currentGold: number): { success: boolean, cost: number, newMult: number } {
        if (!this.canAfford(currentGold, this.goldUpgradeCost)) {
            return { success: false, cost: 0, newMult: this.goldMultiplier };
        }
        const cost = this.goldUpgradeCost;
        this.goldMultiplier += 0.1;
        this.goldUpgradeCost = Math.ceil(this.goldUpgradeCost * this.COST_MULTIPLIER);
        return { success: true, cost, newMult: this.goldMultiplier };
    }

    // --- Skills ---

    public activateSkill(currentTime: number): boolean {
        if (this.isSkillReady(currentTime)) {
            this.lastSkillUsedTime = currentTime;
            return true;
        }
        return false;
    }

    public isSkillActive(currentTime: number): boolean {
        return (currentTime - this.lastSkillUsedTime) < this.BASE_SKILL_DURATION;
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
