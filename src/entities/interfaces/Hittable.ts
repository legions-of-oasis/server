

export interface Hittable extends Phaser.Physics.Arcade.Sprite {
    hit: (damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite) => boolean
}