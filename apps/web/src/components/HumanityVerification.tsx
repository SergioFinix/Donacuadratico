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
    const [lastAttemptFailed, setLastAttemptFailed] = useState(false);

    useEffect(() => {
        console.log("[HumanityVerification] data:", data, " isLoading:", isLoading, " error:", error);
        console.log("[HumanityVerification] address:", address);
        
        const currentScore = data?.score ? Number(data.score) : 0;
        console.log("[HumanityVerification] currentScore parsed:", currentScore);

        if (currentScore >= 0.05 && address && !verifiedOnChain && !verifying && !lastAttemptFailed) {
            triggerVerify();
        }
    }, [data?.score, address, verifiedOnChain, verifying, lastAttemptFailed]);

    const triggerVerify = async () => {
        if (!address) return;
        setVerifying(true);
        setLastAttemptFailed(false);
        try {
            const { sdk } = await import("@farcaster/frame-sdk");
            const context = await sdk.context;
            const fid = context?.user?.fid;

            console.log("[HumanityVerification] Triggering /api/verify for", address, "with FID:", fid);
            const res = await fetch("/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, fid })
            });

            
            if (res.ok) {
                setVerifiedOnChain(true);
                setLastAttemptFailed(false);
            } else {
                const errorData = await res.json();
                console.error("Verification API error:", errorData);
                setLastAttemptFailed(true);
            }
        } catch (error) {
            console.error("Verification failed", error);
            setLastAttemptFailed(true);
        } finally {
            setVerifying(false);
        }
    };


    useEffect(() => {
        const fetchFID = async () => {
            try {
                const { sdk } = await import("@farcaster/frame-sdk");
                const context = await sdk.context;
                console.log("[HumanityVerification] Farcaster Context FID:", context?.user?.fid);
            } catch (e) {
                console.warn("[HumanityVerification] Could not load Farcaster SDK context", e);
            }
        };
        fetchFID();
    }, []);

    const currentScore = data?.score ? Number(data.score) : 0;

    if (!address) return <div className="text-zinc-400 p-4 text-center">Conecta tu wallet para verificar tu humanidad.</div>;

    return (
        <div className="w-full mx-auto p-4 bg-[#0a0a0f] rounded-xl border border-white/10 shadow-xl shadow-black overflow-hidden scale-100 transition-all">
            <h3 className="text-lg font-medium tracking-tight mb-4 text-white text-center">Verificación de Humanidad</h3>
            
            {/* Status Messages area */}
            <div className="mb-4 empty:hidden">
                {verifying && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3 animate-pulse mb-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent animate-spin rounded-full shrink-0" />
                        <p className="text-blue-400 text-xs font-semibold">Registrando en Celo... (esto puede tardar)</p>
                    </div>
                )}

                {verifiedOnChain && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex flex-col items-center gap-1 mb-2">
                        <p className="text-green-500 text-sm font-bold">¡Verificación enviada! ✅</p>
                        <p className="text-zinc-500 text-[10px]">Actualiza la página si no cambia en unos segundos.</p>
                    </div>
                )}

                {lastAttemptFailed && !verifying && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex flex-col items-center gap-1 mb-2">
                        <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Error en Registro</p>
                        <p className="text-zinc-500 text-[10px] text-center">Intenta de nuevo. Asegúrate de tener un score positivo en el widget.</p>
                        <button 
                            onClick={triggerVerify}
                            className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded border border-white/20 transition-colors"
                        >
                            Reintentar Registro
                        </button>
                    </div>
                )}

                {!verifiedOnChain && !verifying && currentScore >= 0.05 && (
                    <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl flex flex-col items-center gap-3 mb-4">
                        <div className="text-center">
                            <p className="text-[#10b981] text-sm font-bold">Score Detectado: {currentScore.toFixed(2)}</p>
                            <p className="text-zinc-400 text-[10px]">Tu score es suficiente para participar.</p>
                        </div>
                        <button 
                            onClick={triggerVerify}
                            className="w-full py-2 bg-[#10b981] text-black font-black text-sm rounded-lg hover:shadow-lg hover:shadow-[#10b981]/20 transition-all"
                        >
                            Verificar On-Chain Ahora ⚡
                        </button>
                    </div>
                )}
            </div>


            {/* Main Widget Area */}
            {!verifiedOnChain ? (
                isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        <p className="text-zinc-400 text-sm">Cargando Passport...</p>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-sm text-center p-4">
                        Error cargando Passport: {error.message || String(error)}
                    </div>
                ) : (
                    <div className="min-h-[300px] relative">
                        {/* Overlay transparent if verifying to discourage interaction */}
                        {verifying && <div className="absolute inset-0 bg-black/20 z-10 cursor-not-allowed rounded-lg" />}
                        <PassportScoreWidget
                            apiKey={apiKey}
                            scorerId={scorerId}
                            address={address}
                            generateSignatureCallback={async (message) => {
                                return await signMessageAsync({ message });
                            }}
                            theme={DarkTheme}
                        />
                    </div>
                )
            ) : (
                <div className="p-8 text-center text-zinc-500 text-sm bg-black/30 rounded-lg border border-white/5">
                   Tu estatus de humano ya está en proceso de registro.
                </div>
            )}
        </div>
    );
}
