import { Types } from "@geckos.io/snapshot-interpolation";
import Enemy from "./Enemy";


export interface Weapon extends Phaser.Physics.Arcade.Sprite {
    attack: (snapshot: Types.Snapshot, enemies: Map<string, Enemy>, angle: number, x: number, y: number) => void
}