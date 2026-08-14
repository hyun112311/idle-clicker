export const GameConfig = {
    // Costs
    INITIAL_CLICK_COST: 10,
    INITIAL_AUTO_COST: 50,
    INITIAL_CRIT_COST: 100,
    INITIAL_GOLD_COST: 200,
    COST_MULTIPLIER: 1.5,

    // Progression
    ENEMIES_PER_STAGE: 10,
    BOSS_TIME_LIMIT: 30000, // 30s

    // Coworkers (HR)
    COWORKER_DATA: [
        { id: 'intern', name: '인턴 (HR)', baseCost: 15, baseDPS: 2, costMultiplier: 1.15 },
        { id: 'assistant', name: '대리 (HR)', baseCost: 100, baseDPS: 10, costMultiplier: 1.15 },
        { id: 'asst_mgr', name: '주임', baseCost: 800, baseDPS: 60, costMultiplier: 1.15 },
        { id: 'manager', name: '과장', baseCost: 5000, baseDPS: 350, costMultiplier: 1.15 },
        { id: 'deputy_gm', name: '차장', baseCost: 40000, baseDPS: 2500, costMultiplier: 1.15 },
        { id: 'gm', name: '부장', baseCost: 300000, baseDPS: 15000, costMultiplier: 1.15 },
        { id: 'director', name: '이사', baseCost: 2500000, baseDPS: 100000, costMultiplier: 1.15 },
        { id: 'md', name: '상무', baseCost: 25000000, baseDPS: 800000, costMultiplier: 1.15 },
        { id: 'smd', name: '전무', baseCost: 300000000, baseDPS: 7500000, costMultiplier: 1.15 },
        { id: 'evp', name: '부사장', baseCost: 4000000000, baseDPS: 80000000, costMultiplier: 1.15 }
    ],

    // Artifacts
    ARTIFACT_CARD_COST: 5,
    ARTIFACT_ESPRESSO_COST: 10,

    // Skills
    SKILL_DURATION: 10000,
    SKILL_COOLDOWN: 30000,

    // Save System
    SAVE_KEY: 'idle_clicker_save',
    SAVE_VERSION: 1,
    AUTO_SAVE_INTERVAL: 30000, // 30s
    MAX_OFFLINE_REWARD_SECONDS: 60 * 60 * 8, // 8 hours

    // Prestige & Bean Shop
    PRESTIGE_UNLOCK_STAGE: 10, // Unlock at Stage 10 for testing
    PRESTIGE_BEAN_BONUS: 0.02, // +2% base global damage per unspent bean
    BEAN_STARTING_GOLD_BASE: 100, // +100 starting gold per level
    BEAN_DAMAGE_BONUS: 0.05, // +5% global damage multiplier per level
    BEAN_AUTO_SPEED_REDUCTION: 50, // -50ms auto-attack delay per level
    BEAN_MAX_SPEED_REDUCTION_LEVELS: 16, // Max 16 levels = 800ms reduction (min 200ms)
    BEAN_AUTO_SPEED_MIN: 200, // min 200ms
    BEAN_UPGRADE_COST: 1, // 1 bean per level (linear cost)

    // Balancing
    INITIAL_BASE_HEALTH: 10,
    HEALTH_GROWTH_RATE: 1.5,

    // UI / Branding
    DEPARTMENTS: {
        HR: '인사팀\n(HR)',
        STRATEGY: '전략팀\n(Strat)',
        WELFARE: '복지팀\n(Welf)',
        RND: '개발팀\n(Dev)',
        GLOBAL: '해외사업팀\n(Global)'
    }
};
