import Phaser from 'phaser';

export class SoundManager {
    private scene: Phaser.Scene;

    // Could add mute/volume controls here if needed in the future
    public isMuted: boolean = false;
    public volume: number = 0.5;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public play(key: string) {
        if (this.isMuted) return;

        // Simple fire-and-forget play method
        if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, { volume: this.volume });
        } else {
            console.warn(`Sound object missing: ${key}`);
        }
    }
}
