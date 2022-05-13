import BaseEntity from "../characters/BaseEntity";

export default interface Enemy extends BaseEntity {
    hit(hitter: BaseEntity, damage: number, knockback: number): void
}