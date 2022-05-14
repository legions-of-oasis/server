import { InterpolatedSnapshot } from "@geckos.io/snapshot-interpolation/lib/types";
import Enemy from "./Enemy";


export interface Weapon extends Phaser.Physics.Arcade.Sprite {
    attack: (snapshot: InterpolatedSnapshot, enemies: Map<string, Enemy>, angle: number, x: number, y: number) => void
}