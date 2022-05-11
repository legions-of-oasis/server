import { ethers } from "ethers"
import { contracts, addresses } from "./commons/contracts.js"

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