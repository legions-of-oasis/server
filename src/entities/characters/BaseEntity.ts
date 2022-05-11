import Phaser from "phaser";
import { Weapon } from "../interfaces/Weapon";

export interface IBaseEntityParams {
    scene: Phaser.Scene,
    x: number,
    y: number,
    speed: number,
    id: string,
    equippedWeapon?: Weapon,
    hp: number
}

export default abstract class BaseEntity extends Phaser.Physics.Arcade.Sprite {
    movementSpeed: number
    lastDirectionIsLeft = true
    maxHp: number
    alive = true
    dashDuration = 150
    dashCooldown = 200
    lastDash = 0

    constructor(params: IBaseEntityParams) {
        super(params.scene, params.x, params.y, '')

        params.scene.add.existing(this)
        params.scene.physics.world.enable(this, 0)
        
        this.movementSpeed = params.speed
        this.maxHp = params.hp
        this.setData('hp', params.hp)
    }

    update(movement?: boolean[]) {
        if (movement) this.moveWithInput(movement)
    }

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
        } else {
            //idle
            this.setVelocity(0)
        }

    }
}