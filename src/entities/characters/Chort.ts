import { ServerChannel } from "@geckos.io/server";
import { states } from "../../commons/states.js";
import Enemy from "../interfaces/Enemy.js";
import BaseEntity, { IBaseEntityParams } from "./BaseEntity.js";
import Player from "./Player.js";

export default class Chort extends BaseEntity implements Enemy {
    targets?: Map<string, Player>
    collider?: Phaser.Physics.Arcade.Collider
    aggro?: Player
    lastHit = 0
    hitCooldown: number
    staggerDuration: number
    aggroDistance: number
    room: ServerChannel["room"]
    aggroFinder: Phaser.Time.TimerEvent

    constructor(params: IBaseEntityParams, room: ServerChannel["room"], targets?: Map<string, Player>) {
        super(params)

        if (targets) this.setTarget(targets)

        this.setDrag(50)
        this.setSize(10, 16)
        this.setName(params.id)

        this.hitCooldown = 300
        this.staggerDuration = 1000
        this.aggroDistance = 150
        this.room = room

        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        this.aggroFinder = this.scene.time.addEvent({
            loop: true,
            delay: 2000,
            callback: () => this.checkAggro()
        })
    }

    update() {
        if (!this.aggro) return

        // const time = this.scene.time.now
        // const isDying = time < this.timeOfDeath + 1000

        // //disable body after dead
        // if (!isDying && !this.alive) {
        //     this.disableBody(true, true)
        //     return
        // }

        // move if not staggered
        if (!this.isStaggered() && this.alive) {
            this.scene.physics.moveToObject(this, this.aggro, this.movementSpeed)
            this.updateState(states.MOVING)
        }
    
    }

    setTarget(targets: Map<string, Player>) {
        this.targets = targets
        this.collider = this.scene.physics.add.overlap(this, Array.from(this.targets.values()), (_, target) => this.overlapHandler(target as Player))
    }

    overlapHandler(target: Player) {
        if (this.alive) target.hit(this, 10, 0.5)
    }

    hit(hitter: Phaser.GameObjects.Sprite, damage: number, knockback: number) {
        //if on hit cooldown or dead return early
        if (this.isOnHitCooldown() || !this.alive) return

        //set state
        this.updateState(states.HIT)

        //set new health
        const newHp = this.getData('hp') - damage
        this.setData('hp', newHp)
        this.room.emit('hpUpdateEnemy', {id: this.name, hp: newHp})

        //get current time
        const time = this.scene.time.now

        //set last hit time
        this.lastHit = time

        //get angle between hitter and player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)

        //get knockback velocity
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)

        //set knockback velocity
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        //set new aggro
        this.aggro = hitter as Player

        //die
        if (newHp < 0) {
            this.die()
            return
        }

        //set hitcooldown state after tint state
        this.scene.time.delayedCall(this.hitTintDuration, () => this.updateState(states.HITCOOLDOWN))
        this.scene.time.delayedCall(this.hitCooldown, () => this.updateState(states.MOVING))
    }

    isOnHitCooldown(): boolean {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }

    isStaggered() {
        return this.scene.time.now < this.lastHit + this.staggerDuration
    }

    die() {
        this.alive = false
        this.updateState(states.DYING)
        this.scene.time.delayedCall(1000, () => {
            this.updateState(states.DEAD)
            this.disableBody(true, true)
        })
    }

    checkAggro() {
        if (!this.targets) return

        for (const target of this.targets.values()) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y)
            if (distance > this.aggroDistance) continue

            this.aggro = target
            this.scene.time.removeEvent(this.aggroFinder)
            return
        }
    }

    updateState(state: states) {
        if (this.state !== state) {
            this.room.emit('stateUpdate', {id: this.name, state: state})
            this.setState(state)
        }
    }
}