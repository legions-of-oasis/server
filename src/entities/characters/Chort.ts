import Enemy from "../interfaces/Enemy.js";
import BaseEntity, { IBaseEntityParams } from "./BaseEntity.js";
import Player from "./Player.js";

export default class Chort extends BaseEntity implements Enemy {
    targets?: Map<string, Player>
    collider?: Phaser.Physics.Arcade.Collider
    aggro?: Player
    lastHit = 0
    hitCooldown = 300
    knockbackCooldown = 1000
    timeOfDeath = 0

    constructor(params: IBaseEntityParams, targets?: Map<string, Player>) {
        super(params)

        if (targets) this.setTarget(targets)

        this.setDrag(50)
        this.setSize(10, 16)
        this.setName(params.id)

        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        this.scene.time.addEvent({
            loop: true,
            delay: 2000,
            callback: () => {
                
            }
        })
    }

    update() {
        // if (this.alive) super.update()
        if (!this.targets) {
            return
        }
        if (!this.aggro) {
            // this.chasing = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 100
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
            // if (!isKnockbacked) this.scene.physics.moveToObject(this, this.target, this.movementSpeed)
        }
    }

    setTarget(targets: Map<string, Player>) {
        this.collider?.destroy()
        this.targets = targets
        this.collider = this.scene.physics.add.overlap(this, Array.from(this.targets.values()), (target) => this.overlapHandler(target))
    }

    overlapHandler(target: Player) {
        if (this.alive) target.hit(10, 0.5, this)
    }

    hit(hitter: Phaser.GameObjects.Sprite, damage: number, knockback: number) {
        const time = this.scene.time.now
        if (this.isOnHitCooldown() || !this.alive) return

        const newHealth = this.getData('hp') - damage
        this.setData('hp', newHealth)
        this.lastHit = time

        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        if (newHealth < 0) {
            this.die()
        }

        return
    }

    isOnHitCooldown(): boolean {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }

    die() {
        this.timeOfDeath = this.scene.time.now
        this.alive = false
    }
}