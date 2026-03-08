"use client";

import { useAccount, useSignMessage } from "wagmi";
import { PassportScoreWidget, usePassportScore, DarkTheme } from "@human.tech/passport-embed";
import { useEffect, useState } from "react";

export function HumanityVerification() {
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const scorerIdStr = process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID;
    const scorerId = scorerIdStr || "0";
    const apiKey = process.env.NEXT_PUBLIC_PASSPORT_API_KEY || "";

    const { data, isLoading } = usePassportScore({
        apiKey,
        scorerId,
        address
    });

    const [verifying, setVerifying] = useState(false);
    const [verifiedOnChain, setVerifiedOnChain] = useState(false);

    useEffect(() => {
        if (data?.passingScore && address && !verifiedOnChain && !verifying) {
            const verifyOnChain = async () => {
                setVerifying(true);
                try {
                    const res = await fetch("/api/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ address })
                    });
                    if (res.ok) {
                        setVerifiedOnChain(true);
                    }
                } catch (error) {
                    console.error("Verification failed", error);
                } finally {
                    setVerifying(false);
                }
            };
            verifyOnChain();
        }
    }, [data?.passingScore, address, verifiedOnChain, verifying]);

    if (!address) return <div className="text-gray-400">Conecta tu wallet para verificar tu humanidad.</div>;

    if (verifiedOnChain) return <div className="text-green-500 font-bold px-4 py-2 border border-green-500/30 rounded-lg bg-green-500/10 text-center">¡Humano Verificado! ✅</div>;

    // these are defined above now

    return (
        <div className="w-full mx-auto p-4 bg-[#0a0a0f] rounded-xl border border-white/10 shadow-xl shadow-black">
            <h3 className="text-lg font-medium tracking-tight mb-4 text-white text-center">Verificación de Humanidad</h3>
            {isLoading ? (
                <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            ) : (
                <PassportScoreWidget
                    apiKey={apiKey}
                    scorerId={scorerId}
                    address={address}
                    generateSignatureCallback={async (message) => {
                        return await signMessageAsync({ message });
                    }}
                    theme={DarkTheme}
                />
            )}
        </div>
    );
}
