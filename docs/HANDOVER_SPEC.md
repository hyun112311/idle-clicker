# Handover Specification & Migration Guide

## 1. Current Architecture
The project follows a **Component-Entity-System** hybrid pattern using Phaser 3 scenes.

-   **GameLoop**: Controlled by `GameScene.ts`. It manages the main update loop (timers, auto-attack).
-   **Managers (Singleton-like)**:
    -   `UpgradeManager.ts`: Handles all game logic, state, stats, and math. It extends `Phaser.Events.EventEmitter` to drive the UI.
    -   `UIManager.ts`: Strictly handles display logic. It subscribes to `UpgradeManager` events to update text/bars. **No game logic resides here.**
    -   `SaveManager.ts`: Handles `localStorage` persistence and offline time calculation.
-   **Configuration**: `src/game/config/GameConfig.ts` contains all balancing constants (Health growth, Prestige formulas, Unlock stages) to allow easy tuning without diving into logic code.

## 2. Implemented Features
-   **Responsive Layout**: Mobile-first design with a **55% Gameplay (Top) / 45% UI (Bottom)** split.
-   **Prestige System**:
    -   Unlocks at **Stage 10**.
    -   Currency: **Beans**.
    -   Formula: `Beans = floor((MaxStage / 10)^2)`.
    -   Effect: Each Bean grants **+2% Global Damage** (additive).
    -   **Rebirth**: Resets Stage, Gold, Upgrades, and Current Health. Retains Beans and Artifacts.
-   **Core Loop**:
    -   Click Damage & Auto Damage.
    -   Critical Hit System.
    -   **Boss Battles**: Timed encounters (30s). Fail = Reset to start of stage. Success = Drop Stocks + Advance.
-   **Offline Progress**: Calculates time away and awards Gold based on Auto-DPS.
-   **Artifacts**: 'Golden Card' and 'Espresso' implemented as permanent upgrades using 'Stocks'.

## 3. Technical Debt & Placeholders
-   **Visuals**: Building entities are currently **Phone-Geometry Rectangles** using Color Tints (Red=Normal, Orange=Damaged, Red-Flash=Crit) instead of sprites.
-   **Audio**: The sound system is **Logic-Only**. `SoundManager` exists/is planned but no audio files are loaded or played.
-   **Bean Shop**: The UI references a potential Bean Shop, but currently Beans only provide a passive global damage bonus. **Item logic for spending Beans is not yet implemented.**

## 4. Recent Critical Fixes
-   **Prestige Damage Bug**: Fixed a critical issue where **Auto-Damage** was ignoring the Prestige (Bean) Multiplier. It now correctly scales.
-   **Race Condition**: Fixed `Save/Load` sequence. `UIManager` listeners are now properly attached *before* `SaveManager.load()` to ensure "Offline Earnings" popups trigger correctly.
-   **Build Stability**: Fixed TypeScript errors in `Building.ts` (missing properties) and `GameScene.ts` (dead code).

## 5. MacBook Setup Instructions
The project is built with **Vite + TypeScript**.

1.  **Clone Repository**:
    ```bash
    git clone <repo-url>
    cd idle-clicker
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    -   Local: `http://localhost:5173`
4.  **Build for Production**:
    ```bash
    npm run build
    ```
    -   Output: `dist/` folder.
