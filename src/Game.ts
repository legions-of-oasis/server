import { ethers } from "ethers";
import { Server } from "http";
import Phaser from "phaser";
import config from "./config.js";
import RoomManager from "./RoomManager.js";


export default class LegionsOfOasis extends Phaser.Game {
    server: Server
    roomManager: RoomManager
    wallet: ethers.Wallet

    constructor(server: Server, roomManager: RoomManager, wallet: ethers.Wallet) {
        super(config)

        this.server = server
        this.roomManager = roomManager
        this.wallet = wallet
    }
}