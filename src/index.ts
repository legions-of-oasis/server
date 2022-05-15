import "@geckos.io/phaser-on-nodejs"
import express from 'express'
import http, { IncomingMessage, OutgoingMessage } from 'http'
import cors from 'cors'
import { ethers } from "ethers"
import dotenv from 'dotenv'
import RoomManager from "./RoomManager.js"
import jwt from 'jsonwebtoken'
import generateTypedAuth from "./commons/auth.js"
import { geckos, iceServers } from "@geckos.io/server"
import { roomModes } from "./commons/roomModes.js"

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(cors())

const authRequest = new Map<string, {challenge: string, time: number}>()

//generate signer
const wallet = process.env.NODE_ENV === 'production' ? ethers.Wallet.createRandom() : new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
let signerAddress: string
wallet.getAddress().then(address => {
    console.log("trusted address: ", address)
    signerAddress = address
})

//GET signer address
app.get("/signer", (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.send(signerAddress ?? 'generating..')
})

//request authentication challenge
app.post("/challenge", express.text(), (req, res) => {
    //get address
    const address = req.body

    //delete previous challenge
    authRequest.delete(address)

    //generate new challenge
    const challenge = ethers.utils.keccak256(ethers.utils.randomBytes(8))

    //set challenge for address
    authRequest.set(address, {challenge, time: Date.now()})

    //return challenge
    res.setHeader('Content-Type', 'text/plain')
    res.send(challenge)
})

const secret = process.env.TOKEN_SECRET ?? '09f26e402586e2faa8da4c98a35f1b20d6b033c6097befa8be3486a829587fe2f90a832bd3ff9d42710a4da095a2ce285b009f0c3730cd9b8e1af3eb84df6611' //test

//generate jwt
app.post("/generateToken", express.text(), (req, res) => {
    const auth = req.body

    if (!verifyChallenge(auth)) {
        return res.sendStatus(401)
    }
    
    const token = jwt.sign({address: auth.split(' ')[0]}, secret, { expiresIn: "7d" })

    res.json(token)
})

function verifyChallenge(auth: string): boolean {
        //split address and signature
        const token = auth!.split(' ')

        if (token.length < 2) return false

        const address = token[0]
        const sig = token[1]

        //get secret
        const secret = authRequest.get(address)
        if (!secret) return false

        //expire in 60 secs
        if (Date.now() > secret.time + 60000) return false

        //get typed data
        const chainId = process.env.NODE_ENV === 'production' ? 4 : 31337
        const { domain, types, value } = generateTypedAuth(secret.challenge, chainId)

        //get recovered address from typed data and signature
        const recoveredAddress = ethers.utils.verifyTypedData(domain, types, value, sig)

        if (recoveredAddress === address) {
            //verification successful
            authRequest.delete(address)
            return true
        }
        //verification unsuccessful
        authRequest.delete(address)
        return false
}

//room manager
const roomManager = new RoomManager(wallet)
    
//create new game instance
// const game = new Phaser.Game(config)

const io = geckos({
    //verify address used
    authorization: async (auth: string | undefined, req: IncomingMessage, res: OutgoingMessage) => {
        //split address and signature
        const tokens = auth!.split(' ')
        const address = tokens[0]
        const jwtoken = tokens[1]
        const roomMode = parseInt(tokens[2])
        const roomId = tokens[3]

        if (!(roomMode in roomModes)) return false

        if (roomManager.connectedPlayers.has(address)) {
            console.log("already in session")
            return false
        }

        const secret = process.env.TOKEN_SECRET ?? '09f26e402586e2faa8da4c98a35f1b20d6b033c6097befa8be3486a829587fe2f90a832bd3ff9d42710a4da095a2ce285b009f0c3730cd9b8e1af3eb84df6611' //test

        let verified = true

        jwt.verify(jwtoken, secret as string, (err: any, user: any) => {
            if (err) {
                verified = false
                console.log("jwt authorization error: ", err)
            }
            if (user.address !== address) {
                console.error("bad token: invalid address", user)
                verified = false
            }
        })

        if (!verified) return 403

        return { address, roomMode, roomId }
    },
    cors: { allowAuthorization: true, origin: "*" },
    iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
})

io.addServer(server)

io.onConnection(channel => {
    console.log(`${channel.userData.address} connected`)

    const roomId = roomManager.add(channel)
    if (roomId === '') channel.close()

    channel.emit('roomId', roomId, { reliable: true })

    channel.onDisconnect((reason) => {
        console.log(`${channel.userData.address} disconnected: ${reason}`)
        roomManager.remove(channel, roomId)
    })
})

server.listen(9208, () => {
    console.log("listening on port 9208")
})