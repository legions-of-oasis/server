import Phaser from 'phaser'
import { Weapon } from '../interfaces/Weapon'

interface ISwordParams {
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
}

export default class Sword extends Phaser.Physics.Arcade.Sprite implements Weapon {
    player: Phaser.Physics.Arcade.Sprite
    damage = 20
    
    constructor(params: ISwordParams) {
        super(params.scene, params.player.x, params.player.y, '')

        //init properties
        this.player = params.player

        //add to scene
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        this.setSize(20, 20)
    }

    attack(enemies: Phaser.Physics.Arcade.Sprite[], angle: number) {
        const newPos = Phaser.Math.RotateTo({x: this.player.x, y: this.player.y + 6}, this.player.x, this.player.y + 6, angle, 15)
        this.setPosition(newPos.x, newPos.y)
        const isLeftHalf = angle < -90 || angle > 90
        this.setAngle(isLeftHalf ? angle + 135 : angle + 45)
        this.scene.physics.overlap(enemies, this, (enemy: any) => {
           enemy.hit(this.damage, 2, this.player)
        })
    }
}