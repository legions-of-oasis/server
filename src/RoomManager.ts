import { ServerChannel } from "@geckos.io/server/lib/geckos/server"
import { roomModes } from "./commons/roomModes.js"
import config from "./config.js"
import Phaser from "phaser"
import DungeonScene from "./scenes/dungeonScene.js"
import { ethers } from "ethers"

export interface Room {
    channels: ServerChannel[]
    roomId: string
    playerCount: number
    type: string,
    game?: Phaser.Game
    inSession: boolean
}

export default class RoomManager {
    singlePlayerRooms: Map<string, Room>
    publicRooms: Map<string, Room>
    privateRooms: Map<string, Room>
    connectedPlayers: Map<string, boolean>
    wallet: ethers.Wallet

    constructor(wallet: ethers.Wallet) {
        this.singlePlayerRooms = new Map()
        this.publicRooms = new Map()
        this.privateRooms = new Map()
        this.connectedPlayers = new Map()
        this.wallet = wallet
    }

    add(channel: ServerChannel) {
        const roomMode = parseInt(channel.userData.roomMode) as roomModes
        let roomId: string

        switch (roomMode) {
            case roomModes.SINGLEPLAYER:
                roomId = this.addSinglePlayer(channel)
                break;
            case roomModes.PUBLIC_JOIN:
                roomId = this.joinPublic(channel)
                break;
            case roomModes.PUBLIC_CREATE:
                roomId = this.createPublic(channel)
                break;
            case roomModes.PRIVATE_JOIN:
                roomId = this.joinPrivate(channel)
                break;
            case roomModes.PRIVATE_CREATE:
                roomId = this.createPrivate(channel)
                break;
            default:
                roomId = ''
                break;
        }

        this.connectedPlayers.set(channel.userData.address, true)
        return roomId
    }

    remove(channel: ServerChannel, roomId: string) {
        const room = this.getRoom(roomId)
        if (!room) return

        this.connectedPlayers.delete(channel.userData.address)

        room.playerCount--

        if (room.playerCount === 0) {
            if (room.type === 'singleplayer') this.singlePlayerRooms.delete(room.roomId)
            if (room.type === 'public') this.publicRooms.delete(room.roomId)
            if (room.type === 'private') this.privateRooms.delete(room.roomId)
            return
        }

        room.channels = room.channels.filter((_channel) => {
            _channel.id !== channel.id
        })
    }

    getRoom(roomId: string) {
        let room
        room = this.publicRooms.get(roomId)
        if (!room) room = this.publicRooms.get(roomId)
        if (!room) room = this.singlePlayerRooms.get(roomId)

        return room
    }

    addSinglePlayer(channel: ServerChannel) {

        const room: Room = {
            channels: [channel],
            roomId: channel.userData.address,
            playerCount: 1,
            type: 'singleplayer',
            inSession: true,
        }
        this.singlePlayerRooms.set(room.roomId, room)

        channel.on('start', () => {
            const game = new Phaser.Game(config)
            console.log('starting', room.roomId)
            game.scene.add(room.roomId, DungeonScene, true, { playerChannels: room.channels, wallet: this.wallet })
            room.inSession = true
            room.game = game
        })

        return channel.userData.address
    }

    joinPublic(channel: ServerChannel) {
        const room = this.publicRooms.get(channel.userData.roomId)

        if (!room) {
            channel.emit('roomError', `room ${channel.userData.roomId} does not exist`, {reliable: true})
            setTimeout(() => channel.close(), 20)
            return ''
        }

        const newPlayerCount = room.playerCount + 1
        if (newPlayerCount > 4) {
            channel.emit('roomError', `room ${channel.userData.roomId} is full`, {reliable: true})
            setTimeout(() => channel.close(), 20)
            return ''
        }

        if (room.inSession) return ''

        room.playerCount = newPlayerCount
        room.channels.push(channel)
        channel.join(room.roomId)

        return room.roomId
    }

    createPublic(channel: ServerChannel) {
        
        let _room
        let roomId
        do {
            roomId = this.generateRoomId()
            _room = this.publicRooms.get(roomId)
        } while (_room !== undefined)

        const room: Room = {
            channels: [channel],
            roomId,
            playerCount: 1,
            type: 'public',
            inSession: false
        }

        channel.on('start', () => {
            const game = new Phaser.Game(config)
            console.log('starting', room.roomId)
            game.scene.add(room.roomId, DungeonScene, true, { playerChannels: room.channels, wallet: this.wallet })
            room.inSession = true
            room.game = game
        })

        channel.join(roomId)
        this.publicRooms.set(roomId, room)

        return roomId
    }

    joinPrivate(channel: ServerChannel) {
        const room = this.privateRooms.get(channel.userData.roomId)

        if (!room) {
            channel.emit('roomError', `room ${channel.userData.roomId} does not exist`, {reliable: true})
            setTimeout(() => channel.close(), 20)
            return ''
        }

        const newPlayerCount = room.playerCount + 1
        if (newPlayerCount > 4) {
            channel.emit('roomError', `room ${channel.userData.roomId} is full`, {reliable: true})
            setTimeout(() => channel.close(), 20)
            return ''
        }

        if (room.inSession) return ''

        room.playerCount = newPlayerCount
        room.channels.push(channel)
        channel.join(room.roomId)

        return room.roomId
    }

    createPrivate(channel: ServerChannel) {
        
        let _room
        let roomId
        do {
            roomId = this.generateRoomId()
            _room = this.privateRooms.get(roomId)
        } while (_room !== undefined)

        const room: Room = {
            channels: [channel],
            roomId,
            playerCount: 1,
            type: 'private',
            inSession: false,
        }

        channel.on('start', () => {
            const game = new Phaser.Game(config)
            console.log('starting', room.roomId)
            game.scene.add(room.roomId, DungeonScene, true, { playerChannels: room.channels, wallet: this.wallet })
            room.inSession = true
            room.game = game
        })

        channel.join(roomId)
        this.privateRooms.set(roomId, room)

        return roomId
    }

    generateRoomId() {
        let result = ''
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const length = 5

        for (let i=0; i<length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length))
        }

        return result
    }
}