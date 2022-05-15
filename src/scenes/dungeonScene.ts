import { ServerChannel } from '@geckos.io/server';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import { ethers } from 'ethers';
import Phaser from 'phaser'
import Chort from '../entities/characters/Chort.js';
import Player from '../entities/characters/Player.js';
import Enemy from '../entities/interfaces/Enemy.js';
import path from 'path';
import { fileURLToPath } from 'url';
import Sword from '../entities/weapons/Sword.js';
import '../assets/tilemaps/dungeon-tilemap.json';

export default class DungeonScene extends Phaser.Scene {
    playerChannels!: ServerChannel[]
    wallet!: ethers.Wallet
    SI!: SnapshotInterpolation
    players!: Map<string, Player>
    activeEnemies!: Map<string, Enemy>
    activePlayers = 0
    tick = 0

    // constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    //     super({
    //         active: true
    //     })
    // }

    init({ playerChannels, wallet }: { playerChannels: ServerChannel[], wallet: ethers.Wallet }) {
        this.playerChannels = playerChannels
        this.wallet = wallet
    }

    preload() {
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        this.load.tilemapTiledJSON('dungeon-tilemap', path.join(__dirname, '../assets/tilemaps/dungeon-tilemap.json'))
    }

    create() {
        //initialise snapshot interpolation
        this.SI = new SnapshotInterpolation()

        //add tilemap
        const map = this.make.tilemap({
            key: 'dungeon-tilemap'
        })

        //initialise players
        this.players = new Map()

        const playerPositions = [
            { x: 350, y: 640 },
            { x: 450, y: 640 },
            { x: 350, y: 700 },
            { x: 450, y: 700 }
        ]

        //populate players
        this.playerChannels.forEach((channel, i) => {
            const player = new Player({
                scene: this,
                x: playerPositions[i].x,
                y: playerPositions[i].y,
                hp: 100,
                id: channel.userData.address,
                speed: 80
            }, channel)
            player.equippedWeapon = new Sword({
                player,
                scene: this
            })
            this.players.set(channel.userData.address, player)
            this.activePlayers++
        })

        //initialise enemies
        this.activeEnemies = new Map()

        //populate enemies
        const enemies = map.getObjectLayer('enemies').objects
        enemies.forEach((enemyObject) => {
            const enemy = new Chort({
                hp: 50,
                id: enemyObject.name,
                x: enemyObject.x!,
                y: enemyObject.y!,
                scene: this,
                speed: 20
            }, this.playerChannels[0].room, this.players)
            this.activeEnemies.set(enemyObject.name, enemy)
        })

        //add walls from tilemap
        const walls = map.createLayer('walls', '')
        walls.setCollisionByProperty({ collide: true })

        //add collision
        const playerArray = Array.from(this.players.values())
        const enemyArray = Array.from(this.activeEnemies.values())
        this.physics.add.collider(Array.from(this.players.values()), walls)
        this.physics.add.collider(enemyArray, walls)
        this.physics.add.collider(enemyArray, enemyArray)

        //initial data to emit
        const initialData = {
            players: playerArray.map(player => ({
                x: player.x,
                y: player.y,
                id: player.name
            })),
            enemies: enemyArray.map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                id: enemy.name
            }))
        }

        //add channel listeners
        this.playerChannels.forEach(channel => {
            const player = this.players.get(channel.userData.address)

            //listen for movement update
            channel.on('input', (input) => {
                player?.update(input as boolean[])
            })

            //listen for attack
            channel.on('attack', (data: any) => {
                channel.broadcast.emit('attackUpdate', channel.userData.address)

                const rewindedSnapshot = this.SI.vault.get(data.time)
                if (!rewindedSnapshot) return

                const rewindedAndInterpolatedSnapshot = this.SI.interpolate(
                    rewindedSnapshot.older,
                    rewindedSnapshot.newer,
                    data.time,
                    'x y',
                    'enemies'
                )
                if (!rewindedAndInterpolatedSnapshot) return

                player?.attack(data, rewindedAndInterpolatedSnapshot, this.activeEnemies)
            })

            //listen for dash
            channel.on('dash', () => {
                player?.dash()
            })

            //listen for disconnect
            channel.onDisconnect(() => {
                this.activePlayers--
                if (this.activePlayers === 0) {
                    this.scene.stop() 
                }
            })

            console.log('ready')
            channel.emit('ready', initialData)
        })
    }

    update(): void {
        this.tick++

        for (const enemy of this.activeEnemies.values()) {
            enemy.update()
        }

        //only send snapshot at half the server fps
        if (this.tick % 2 !== 0) return

        const playerArray = Array.from(this.players.values())
        const enemyArray = Array.from(this.activeEnemies.values())

        const worldState = {
            players: playerArray.map(player => ({
                x: player.x,
                y: player.y,
                id: player.name,
                angle: player.aimAngle
            })),
            enemies: enemyArray.map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                id: enemy.name
            }))
        }

        const snapshot = this.SI.snapshot.create(worldState)
        this.SI.vault.add(snapshot)

        this.playerChannels[0].room.emit('update', snapshot)
    }
}