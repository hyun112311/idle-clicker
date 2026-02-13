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

    // Artifacts
    ARTIFACT_CARD_COST: 5,
    ARTIFACT_ESPRESSO_COST: 10,

    // Skills
    SKILL_DURATION: 10000,
    SKILL_COOLDOWN: 30000,

    // Save System
    SAVE_KEY: 'idle_clicker_save',
    AUTO_SAVE_INTERVAL: 30000, // 30s

    // Prestige
    PRESTIGE_UNLOCK_STAGE: 10, // Unlock at Stage 10 for testing
    PRESTIGE_BEAN_BONUS: 0.02, // +2% per bean

    // Balancing
    INITIAL_BASE_HEALTH: 10,
    HEALTH_GROWTH_RATE: 1.5,
};
