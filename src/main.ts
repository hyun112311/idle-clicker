
import './style.css';
import Phaser from 'phaser';
import { PhaserGameConfig } from './game/GameConfig';
import { GameScene } from './game/scenes/GameScene';

// Add scene to config
const config = {
  ...PhaserGameConfig,
  scene: [GameScene],
};

new Phaser.Game(config);
