import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoSepolia } from 'viem/chains';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export async function POST(req: Request) {
    try {
        const { address } = await req.json();
        if (!address) return NextResponse.json({ error: "No address" }, { status: 400 });

        const apiKey = process.env.NEXT_PUBLIC_PASSPORT_API_KEY || process.env.PASSPORT_API_KEY;
        const scorerId = process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID || process.env.PASSPORT_SCORER_ID;
        const privateKey = process.env.VERIFIER_PRIVATE_KEY;

        if (!apiKey || !scorerId || !privateKey) {
            return NextResponse.json({ error: "Server config missing" }, { status: 500 });
        }

        // 1. Llamar a la Stamps API v2 de Human Passport
        const response = await fetch(`https://api.passport.xyz/v2/stamps/${scorerId}/score/${address}`, {
            headers: {
                'X-API-KEY': apiKey,
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Passport API error" }, { status: 500 });
        }

        const data = await response.json();
        const score = Number(data.score);

        // 2. Verificar que el score >= 0.5
        if (score >= 0.5 && contractAddress) {
            // 3. Si pasa, ejecutar setVerifiedHuman on-chain
            const account = privateKeyToAccount(privateKey as `0x${string}`);

            const publicClient = createPublicClient({
                chain: celoSepolia,
                transport: http()
            });

            // Checar si ya está verificado para ahorrar gas
            const isVerified = await publicClient.readContract({
                address: contractAddress,
                abi: [{ type: 'function', name: 'isVerifiedHuman', inputs: [{ name: '_user', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' }],
                functionName: 'isVerifiedHuman',
                args: [address as `0x${string}`]
            });

            if (!isVerified) {
                const walletClient = createWalletClient({
                    account,
                    chain: celoSepolia,
                    transport: http()
                });

                const { request } = await publicClient.simulateContract({
                    account,
                    address: contractAddress,
                    abi: [{ type: 'function', name: 'setVerifiedHuman', inputs: [{ name: '_user', type: 'address' }, { name: '_verified', type: 'bool' }], outputs: [], stateMutability: 'nonpayable' }],
                    functionName: 'setVerifiedHuman',
                    args: [address as `0x${string}`, true]
                });

                const txHash = await walletClient.writeContract(request);
            }

            return NextResponse.json({ verified: true, score });
        }

        return NextResponse.json({ verified: score >= 0.5, score }); // If no contractAddress, still return verified logic for testing
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
