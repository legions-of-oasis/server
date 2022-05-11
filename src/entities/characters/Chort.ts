import BaseEntity, { IBaseEntityParams } from "./BaseEntity.js";
import { Hittable } from "../interfaces/Hittable";
import { ServerChannel } from '@geckos.io/server'

export default class Chort extends BaseEntity implements Hittable {
    target?: Hittable
    collider?: Phaser.Physics.Arcade.Collider
    chasing = false
    lastHit = 0
    hitCooldown = 300
    knockbackCooldown = 1000
    timeOfDeath = 0
    channel: ServerChannel

    constructor(params: IBaseEntityParams, channel: ServerChannel, target?: Hittable ) {
        super(params)

        if (target) this.setTarget(target)

        this.setDrag(50)
        this.setSize(10, 16)
        this.channel = channel
        this.setName(params.id)

        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)
    }

    update() {
        if (this.alive) super.update()
        if (!this.target) {
            return
        }
        if (!this.chasing) {
            this.chasing = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 100
        } else {
            const time = this.scene.time.now
            const isKnockbacked = time < this.lastHit + this.knockbackCooldown
            const isDying = time < this.timeOfDeath + 1000

            //disable body after dead
            if (!isDying && !this.alive) {
                this.disableBody(true, true)
                return
            }

            //move if not knockbacked
            if (!isKnockbacked) this.scene.physics.moveToObject(this, this.target, this.movementSpeed)
        }
    }

    setTarget(target: Hittable) {
        this.collider?.destroy()
        this.target = target
        this.collider = this.scene.physics.add.overlap(this, this.target, () => this.overlapHandler())
    }

    overlapHandler() {
        if (this.alive) this.target?.hit(10, 0.5, this)
    }

    hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite): boolean {
        const time = this.scene.time.now
        if (this.isOnHitCooldown() || !this.alive) {
            this.channel.emit(`confirmHit-${this.name}`, { hit: false, x: this.x, y: this.y })

            return false
        }

        const newHealth = this.getData('hp') - damage
        this.setData('hp', newHealth)
        this.lastHit = time

        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        if (newHealth < 0) {
            this.die()
        }

        this.channel.emit(`confirmHit-${this.name}`, { hit: true })
        return true
    }

    isOnHitCooldown(): boolean {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }

    die() {
        this.timeOfDeath = this.scene.time.now
        this.alive = false
    }
}