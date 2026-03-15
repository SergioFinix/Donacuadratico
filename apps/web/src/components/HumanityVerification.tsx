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

    const { data, isLoading, error } = usePassportScore({
        apiKey,
        scorerId,
        address
    });

    const [verifying, setVerifying] = useState(false);
    const [verifiedOnChain, setVerifiedOnChain] = useState(false);

    useEffect(() => {
        console.log("Human Passport Debug -> address:", address, " apiKey exists?:", !!apiKey, " scorerId:", scorerId);
        console.log("Human Passport Score Data:", data, " isLoading:", isLoading, " error:", error);
    }, [address, apiKey, scorerId, data, isLoading, error]);

    useEffect(() => {
        const currentScore = data?.score ? Number(data.score) : 0;
        // Si el score es > 0.05 (muy bajo, para asegurar que el '5' del usuario pase)
        if (currentScore >= 0.05 && address && !verifiedOnChain && !verifying) {
            const verifyOnChain = async () => {
                setVerifying(true);
                try {
                    console.log("[HumanityVerification] Triggering /api/verify for", address);
                    const res = await fetch("/api/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ address })
                    });
                    if (res.ok) {
                        setVerifiedOnChain(true);
                    } else {
                        const errorData = await res.json();
                        console.error("Verification API error:", errorData);
                    }
                } catch (error) {
                    console.error("Verification failed", error);
                } finally {
                    setVerifying(false);
                }
            };
            verifyOnChain();
        }
    }, [data?.score, address, verifiedOnChain, verifying]);

    if (!address) return <div className="text-zinc-400 p-4 text-center">Conecta tu wallet para verificar tu humanidad.</div>;

    if (verifying) return (
        <div className="p-4 bg-zinc-900 border border-blue-500/20 rounded-xl flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="text-blue-400 font-bold text-sm">Registrando verificación en Celo...</p>
            <p className="text-zinc-500 text-xs">Esto puede tardar unos segundos.</p>
        </div>
    );

    if (verifiedOnChain) return <div className="text-green-500 font-bold px-4 py-2 border border-green-500/30 rounded-lg bg-green-500/10 text-center">¡Verificación enviada! ✅ <br/><span className="text-[10px] font-normal">Recarga si no se actualiza en unos segundos.</span></div>;

    // these are defined above now

    return (
        <div className="w-full mx-auto p-4 bg-[#0a0a0f] rounded-xl border border-white/10 shadow-xl shadow-black">
            <h3 className="text-lg font-medium tracking-tight mb-4 text-white text-center">Verificación de Humanidad</h3>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                    <p className="text-zinc-400 text-sm">Cargando verificación...</p>
                    <p className="text-zinc-500 text-xs mt-1 text-center">API Key Status: {apiKey ? "OK" : "Missing"}</p>
                </div>
            ) : error ? (
                <div className="text-red-500 text-sm text-center p-4">
                    Error cargando Passport: {error.message || String(error)}
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
