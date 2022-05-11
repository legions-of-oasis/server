import { Hittable } from '../interfaces/Hittable';
import { Weapon } from '../interfaces/Weapon';
import BaseEntity, { IBaseEntityParams } from './BaseEntity.js';

interface IPlayerParams extends IBaseEntityParams {
    equippedWeapon?: Weapon
}

export default class Player extends BaseEntity implements Hittable {
    equippedWeapon?: Weapon
    lastHit = 0
    hitCooldown = 1000
    knockbackCooldown = 200
    
    constructor(params: IPlayerParams) {
        super(params)

        this.equippedWeapon = params.equippedWeapon
        this.setSize(10, 16)
        this.setDrag(10)
    }

    update(movement: boolean[]): void {
        //update equipped weapon
        if (this.equippedWeapon) this.equippedWeapon.update()

        //get current time
        const time = this.scene.time.now

        // //small period where sprite flashes white after being hit
        // const inTintPeriod = time < this.lastHit + 50

        //is knockbacked (staggered)
        const isKnockbacked = time < this.lastHit + this.knockbackCooldown

        //if not staggered, update movement with input
        if (!isKnockbacked) super.update(movement)

        // //if not in tint period and is tinted and is not dashing, clear all tint
        // if (!inTintPeriod && this.isTinted && !this.isDashing()) this.clearTint()

        // //if on hit cooldown and not in tint period, alternate flash the player to show invulnerability
        // if (this.isOnHitCooldown() && !inTintPeriod) {
        //     this.setAlpha(time % 200 < 100 ? 0.1 : 1)
        // } else {
        //     this.setAlpha(1)
        // }
    }

    setEquippedWeapon(weapon: Weapon) {
        this.equippedWeapon = weapon
    }

    hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite) {
        //get current time
        const time = this.scene.time.now
        
        //if on hit cooldown do nothing and return false
        if (this.isOnHitCooldown()) return false

        //if is dashing do nothing and return false
        if (this.isDashing()) return false

        // //set white tint
        // this.setTintFill(0xDDDDDD)

        //set last hit time
        this.lastHit = time

        //get angle between hitter and player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)

        //get knockback velocity
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)

        //set knockback velocity
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        //get new health after damage
        const newHealth = this.getData('hp') - damage

        //set new health after damage
        this.setData('hp', newHealth)

        //return true to indicate hit successful
        return true
    }

    dash() {
        //get current time
        const time = this.scene.time.now

        //check if on cooldown
        const isOnDashCooldown = time < this.lastDash + this.dashDuration + this.dashCooldown
        if (isOnDashCooldown) return
        if (this.body.velocity.length() === 0) return

        this.lastDash = time
        // this.setTintFill(0xDDDDDD)
        const dashSpeed = this.body.velocity.normalize().scale(this.movementSpeed * 6)
        this.setVelocity(dashSpeed.x, dashSpeed.y)
    }

    isOnHitCooldown() {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }

    isDashing() {
        return this.scene.time.now < this.lastDash + this.dashDuration
    }
}