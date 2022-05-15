export default function generateTypedAuth(nonce: string, chainId: number) {
    const domain = {
        name: "Legions of Oasis",
        version: '1',
        chainId
    }

    const types = {
        Challenge: [
            { name: 'nonce', type: 'string' },
            { name: 'uri', type: 'string' }
        ]
    }

    const value = {
        "uri": 'legionsofoasis.xyz',
        nonce
    }

    return {
        domain,
        types,
        value
    }
}