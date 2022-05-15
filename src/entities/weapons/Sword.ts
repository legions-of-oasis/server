import { Types } from '@geckos.io/snapshot-interpolation'
import { InterpolatedSnapshot } from '@geckos.io/snapshot-interpolation/lib/types'
import Phaser from 'phaser'
import { collisionDetection } from '../../utils.js'
import BaseEntity from '../characters/BaseEntity.js'
import Enemy from '../interfaces/Enemy.js'
import { Weapon } from '../interfaces/Weapon.js'

interface ISwordParams {
    scene: Phaser.Scene,
    player: BaseEntity,
}

export default class Sword extends Phaser.Physics.Arcade.Sprite implements Weapon {
    player: BaseEntity
    damage: number
    knockback: number
    
    constructor(params: ISwordParams) {
        super(params.scene, params.player.x, params.player.y, '')

        //init properties
        this.player = params.player
        this.damage = 20
        this.knockback = 2

        //add to scene
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        this.setSize(20, 20)
    }

    attack(snapshot: InterpolatedSnapshot, enemies: Map<string, Enemy>, angle: number, x: number, y: number) {
        const newPos = Phaser.Math.RotateTo({x, y: y + 6}, x, y + 6, angle, 15)
        this.setPosition(newPos.x, newPos.y)
        const isLeftHalf = angle < -90 || angle > 90
        this.setAngle(isLeftHalf ? angle + 135 : angle + 45)
        snapshot.state.forEach((enemy: any) => {
            const enemyObject = enemies.get(enemy.id)
            if (!enemyObject) return
            const hit = collisionDetection(
                { x: enemy.x, y: enemy.y, width: enemyObject.width, height: enemyObject.height},
                { x, y, width: this.player.width, height: this.player.height }
            )
            if (hit) enemyObject.hit(this.player, this.damage, this.knockback)
        })
    }
}