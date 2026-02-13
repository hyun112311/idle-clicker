
import './style.css';
import Phaser from 'phaser';
import { GameConfig } from './game/GameConfig';
import { GameScene } from './game/scenes/GameScene';

// Add scene to config
const config = {
  ...GameConfig,
  scene: [GameScene],
};

new Phaser.Game(config);
