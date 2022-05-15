import { states } from '../../commons/states.js';
import { Weapon } from '../interfaces/Weapon.js';
import BaseEntity, { IBaseEntityParams } from './BaseEntity.js';
import Enemy from '../interfaces/Enemy.js';
import { ServerChannel } from '@geckos.io/server';
import { InterpolatedSnapshot } from '@geckos.io/snapshot-interpolation/lib/types';

export default class Player extends BaseEntity {
    dashDuration: number
    dashCooldown: 200
    lastDash = 0
    hitCooldown: number
    lastHit = 0
    staggerDuration: number
    channel: ServerChannel
    equippedWeapon?: Weapon
    aimAngle?: number

    constructor(params: IBaseEntityParams, channel: ServerChannel, equippedWeapon?: Weapon) {
        super(params)

        this.body.setSize(10, 16)
        this.setDrag(10)
        this.setName(params.id)

        this.dashDuration = 150
        this.dashCooldown = 200
        this.hitCooldown = 1000
        this.staggerDuration = 200
        this.channel = channel
        this.equippedWeapon = equippedWeapon
    }

    update(movement?: (number|boolean)[]) {
        this.aimAngle = movement![4] as number
        if (!this.isStaggered() && !this.isDashing()) this.moveWithInput(movement!.slice(0, 4) as boolean[])
        // this.updateState()
        super.update()
    }

    // updateState() {
    //     const time = this.scene.time.now

    //     if (this.state === states.HIT) {
    //         if (time > this.hitTintDuration && time < this.hitCooldown) this.setState(states.HITCOOLDOWN)
    //     }
    // }

    moveWithInput(movement: boolean[]) {
        const velocity = this.body.velocity
        const [up, down, left, right] = movement
        const time = this.scene.time.now
        let isDashing = time < this.lastDash + this.dashDuration

        if (isDashing) return
        
        if (up || down || left || right) {
            //up and down
            if (up && down) {
                this.setVelocityY(0)
            } else if (up) {
                this.setVelocityY(-this.movementSpeed)
            } else if (down) {
                this.setVelocityY(this.movementSpeed)
            } else {
                this.setVelocityY(0)
            }

            //left and right
            if (left && right) {
                this.setVelocityX(0)
            } else if (left) {
                this.setVelocityX(-this.movementSpeed)
                // this.lastDirectionIsLeft = true
            } else if (right) {
                this.setVelocityX(this.movementSpeed)
                // this.lastDirectionIsLeft = false
            } else {
                this.setVelocityX(0)
            }

            //diagonals
            if (velocity?.x != 0 && velocity?.y != 0) {
                const diagonalVelocity = velocity.normalize().scale(this.movementSpeed)
                this.setVelocity(diagonalVelocity.x, diagonalVelocity.y)
            }

            if (!this.isOnHitCooldown()) this.updateState(states.IDLE)
        } else {
            //idle
            this.setVelocity(0)

            if (!this.isOnHitCooldown()) this.updateState(states.IDLE)
        }
    }

    dash() {
        //get current time
        const time = this.scene.time.now

        //check if on cooldown
        const isOnDashCooldown = time < this.lastDash + this.dashDuration + this.dashCooldown
        if (isOnDashCooldown || this.body.velocity.length() === 0 || this.isStaggered()) return

        this.lastDash = time
        
        const dashSpeed = this.body.velocity.normalize().scale(this.movementSpeed * 6)
        this.setVelocity(dashSpeed.x, dashSpeed.y)

        this.updateState(states.DASHING)

        this.scene.time.delayedCall(this.dashDuration, () => this.updateState(states.IDLE))
    }

    hit(hitter: Phaser.Physics.Arcade.Sprite, damage: number, knockback: number) {
        //if on hit cooldown or dashing return early
        if (this.isOnHitCooldown() || this.isDashing()) return

        //set state
        this.updateState(states.HIT)

        //set health
        const newHp = this.getData('hp') - damage
        this.setData('hp', newHp)
        this.channel.room.emit('hpUpdatePlayer', {id: this.channel.userData.address, hp: newHp})

        //get current time
        const time = this.scene.time.now

        //set last hit time
        this.lastHit = time

        //set hitcooldown state after tint state
        this.scene.time.delayedCall(this.hitTintDuration, () => this.updateState(states.HITCOOLDOWN))

        //get angle between hitter and player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)

        //get knockback velocity
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)

        //set knockback velocity
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)
    }
    
    attack({time, x, y, angle}: { time: number, x: number, y: number, angle: number }, snapshot: InterpolatedSnapshot, activeEnemies: Map<string, Enemy>) {
        const isStaggered = time < this.lastHit + this.staggerDuration
        const isDashing = time < this.lastDash + this.dashDuration
        if (isStaggered || isDashing || !this.equippedWeapon) return

        if (!this.distanceIsLegit(x, y)) return

        this.equippedWeapon.attack(snapshot, activeEnemies, angle, x, y)
    }

    distanceIsLegit(x: number, y: number): boolean {
        const distance = Phaser.Math.Distance.Between(x, y, this.x, this.y)
        if (distance > 50) return false
        return true
    }

    updateState(state: states) {
        if (this.state !== state) {
            this.channel.room.emit('stateUpdate', {id: this.channel.userData.address, state: state})
            this.setState(state)
        }
    }

    isOnHitCooldown() {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }

    isDashing() {
        return this.scene.time.now < this.lastDash + this.dashDuration
    }

    isStaggered() {
        return this.scene.time.now < this.lastHit + this.staggerDuration
    }
}