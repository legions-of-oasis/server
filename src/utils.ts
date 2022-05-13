import { ethers } from "ethers"
import { addresses } from "./commons/contracts.js"

export const signPacket = async (wallet: ethers.Wallet, request: string, deadline: string, receiver: string) => {
    const domain = {
        name: "Web3Game",
        version: "1",
        chainId: 4,
        verifyingContract: addresses.CLAIM_VERIFIER
    }

    const types = {
        VerifyPacket: [
            { name: "request", type: "address" },
            { name: "deadline", type: "uint256" },
            { name: "receiver", type: "address" }
        ]
    }

    const value = {
        request,
        deadline,
        receiver
    }

    const sig = await wallet._signTypedData(domain, types, value)
    return sig
}

interface Rectangle {
    x: number,
    y: number,
    width: number,
    height: number
}

export function collisionDetection(rect1: Rectangle, rect2: Rectangle) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    )
}