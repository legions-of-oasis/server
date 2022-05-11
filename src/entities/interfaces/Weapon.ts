

export interface Weapon extends Phaser.Physics.Arcade.Sprite {
    attack: (enemies: Phaser.Physics.Arcade.Sprite[], angle: number) => void
}