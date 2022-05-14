// import '@geckos.io/phaser-on-nodejs'
// import { geckos, GeckosServer, iceServers } from '@geckos.io/server'
// import { ethers } from 'ethers'
// import { IncomingMessage, OutgoingMessage } from 'http'
// import Phaser from 'phaser'
// import { roomModes } from '../commons/roomModes.js'
// import LegionsOfOasis from '../Game.js'
// import RoomManager, { Room } from '../RoomManager.js'
// import DungeonScene from './dungeonScene.js'
// import dotenv from 'dotenv'
// import jwt from 'jsonwebtoken'

// dotenv.config()

// export default class RoomManagerScene extends Phaser.Scene {
//     io!: GeckosServer
//     roomManager!: RoomManager
//     sessions!: Map<string, string>
//     wallet!: ethers.Wallet
//     roomStartQueue: Room[] = []

//     constructor(config: any) {
//         super(config)
//     }

//     init() {
//         this.io = geckos({
//             //verify address used
//             authorization: async (auth: string | undefined, req: IncomingMessage, res: OutgoingMessage) => {
//                 //split address and signature
//                 const tokens = auth!.split(' ')
//                 const address = tokens[0]
//                 const jwtoken = tokens[1]
//                 const roomMode = parseInt(tokens[2])
//                 const roomId = tokens[3]

//                 if (!(roomMode in roomModes)) return false

//                 if (this.roomManager.connectedPlayers.has(address)) {
//                     console.log("already in session")
//                     return false
//                 }

//                 const secret = process.env.TOKEN_SECRET ?? '09f26e402586e2faa8da4c98a35f1b20d6b033c6097befa8be3486a829587fe2f90a832bd3ff9d42710a4da095a2ce285b009f0c3730cd9b8e1af3eb84df6611' //test

//                 let verified = true

//                 jwt.verify(jwtoken, secret as string, (err: any, user: any) => {
//                     if (err) {
//                         verified = false
//                         console.log("jwt authorization error: ", err)
//                     }
//                     if (user.address !== address) {
//                         console.error("bad token: invalid address", user)
//                         verified = false
//                     }
//                 })

//                 if (!verified) return 403

//                 return { address, roomMode, roomId }
//             },
//             cors: { allowAuthorization: true, origin: "*" },
//             iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
//         })

//         this.io.addServer((this.game as LegionsOfOasis).server)

//         this.roomManager = (this.game as LegionsOfOasis).roomManager
//         this.wallet = (this.game as LegionsOfOasis).wallet
//     }

//     create() {
//         this.io.onConnection((channel) => {
//             console.log(`${channel.userData.address} connected`)

//             const roomId = this.roomManager.add(channel)
//             if (!roomId) return

//             const room = this.roomManager.getRoom(roomId)!
            
//             channel.on('start', () => {
//                 this.roomStartQueue.push(room)
//             })

//             channel.emit('roomId', roomId)

//             channel.onDisconnect((reason) => {
//                 console.log(`${channel.userData.address} disconnected: ${reason}`)
//                 this.roomManager.remove(channel, roomId)
//             })
//         })
//     }

//     update(time: number, delta: number): void {
//         if (this.roomStartQueue.length) {
//             for (let i=0; i<this.roomStartQueue.length; i++) {
//                 const room = this.roomStartQueue[i]
//                 const scene = this.game.scene.add(room.roomId, DungeonScene, true, { playerChannels: room.channels, wallet: this.wallet })
//                 console.log(scene)
//             }
//             this.roomStartQueue = []
//         }
//     }

//     start(room: Room) {
//         const scene = this.game.scene.add(room.roomId, DungeonScene, true, { playerChannels: room.channels, wallet: this.wallet })
//         console.log(scene)
//     }
// }