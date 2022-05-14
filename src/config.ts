import "@geckos.io/phaser-on-nodejs"
import Phaser from "phaser"
import DungeonScene from "./scenes/dungeonScene.js"

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.HEADLESS,
    width: 480,
    height: 320,
    banner: false,
    audio: {
        noAudio: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    }
}

export default config