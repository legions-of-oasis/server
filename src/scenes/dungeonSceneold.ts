// import Phaser from 'phaser'
// import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
// import { ethers } from 'ethers'
// import { addresses } from '../commons/contracts.js'
// import Player from '../entities/characters/Player.js'
// import Chort from '../entities/characters/Chort.js'
// import { ServerChannel } from '@geckos.io/server'
// import { Hittable } from '../entities/interfaces/Hittable.js'
// import BaseEntity from '../entities/characters/BaseEntity.js'

// export default class DungeonScene extends Phaser.Scene {
//     channel!: ServerChannel
//     players!: Map<string, Player>
//     enemies!: Map<string, BaseEntity>
//     SI!: SnapshotInterpolation
//     wallet!: ethers.Wallet
//     claimManager = addresses.DUNGEON
//     tick = 0

//     constructor() {
//         super('dungeon')
//     }

//     init({ channel, wallet }: { channel: ServerChannel, wallet: ethers.Wallet }) {
//         this.channel = channel
//         this.wallet = wallet
//     }

//     preload() {
//         //load tilemap
//         this.load.tilemapTiledJSON('dungeon-tilemap', `../assets/tilemaps/tilemap.json`)
//     }

//     create() {
//         //initialise snapshot interpolation
//         this.SI = new SnapshotInterpolation()

//         //initialise player
//         this.player = new Player({
//             scene: this,
//             x: 240,
//             y: 260,
//             speed: 80,
//             id: this.channel.userData.address,
//             hp: 100
//         })

//         this.enemies = []

//         //TODO: replace with tilemap enemy placements
//         for (let i = 0; i < 1; i++) {
//             const id = `chort-${i}`
//             const enemy = new Chort({
//                 scene: this,
//                 x: 240,
//                 y: 100,
//                 speed: 20,
//                 hp: 50,
//                 id
//             }, this.channel, this.player)
//             this.enemies.push(enemy)
//         }

//         //initialise tilemap
//         const map = this.make.tilemap({
//             key: 'dungeon-tilemap'
//         })
//         const walls = map.createLayer('walls', '', 0, 0)

//         //set collison
//         walls.setCollisionByProperty({ collides: true })
//         this.physics.add.collider(this.player, walls)

//         // //set overlap
//         // this.physics.add.overlap(this.player, this.coin, () => this.collectCoin())

//         //add listeners
//         this.channel.on('move', (data) => {
//             //movement
//             this.player.update(data as any)
//         })

//         this.channel.on('attack', (angle) => {
//             if (!this.player.equippedWeapon) return

//             this.player.equippedWeapon.attack(Array.from(this.enemies.values()), angle as number)
//         })

//         this.channel.onDisconnect(() => {
//             this.scene.stop()
//         })

//         //emit ready event to client when done
//         this.channel.emit('ready', {
//             players: [{
//                 x: 240,
//                 y: 260,
//                 id: this.channel.userData.address
//             }],
//             enemies: [{
//                 x: 240,
//                 y: 100,
//                 id: 'chort-0'
//             }]
//         })
//     }

//     update() {
//         this.tick++

//         //only send snapshot at half the server fps
//         if (this.tick % 2 !== 0) return
//         const enemies = this.enemies.map(enemy => ({
//             id: enemy.name,
//             x: enemy.x,
//             y: enemy.y
//         }))
//         const players = [{
//             id: this.channel.userData.address,
//             x: this.player.x,
//             y: this.player.y
//         }]
//         const worldState = {
//             players,
//             enemies
//         }

//         const snapshot = this.SI.snapshot.create(worldState)

//         this.channel.emit('update', snapshot)
//     }

//     // async collectCoin() {
//     //     //destroy coin
//     //     this.coin.disableBody(true, true)

//     //     //hash claim manager address
//     //     const request = this.claimManager

//     //     //deadline before packet expires
//     //     const deadline = ethers.constants.MaxUint256

//     //     //get address of player
//     //     const address = await this.channel.userData.address

//     //     //encode user address and claim manager contract address
//     //     const receiver = address

//     //     //sign packet
//     //     const sig = await signPacket(this.wallet, request, deadline, receiver)

//     //     //emit packet claim
//     //     this.channel.emit('claim', sig)

//     //     //close scene
//     //     setTimeout(() => {
//     //         this.channel.close()
//     //         this.scene.stop()
//     //     }, 60000)
//     // }
// }