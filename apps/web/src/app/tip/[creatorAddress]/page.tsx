"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { QuadraticTippingABI, ERC20ABI } from "@/lib/abi";
import Link from "next/link";
import { sdk } from "@farcaster/frame-sdk";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const CUSD_ADDRESS = process.env.NEXT_PUBLIC_CUSD_ADDRESS as `0x${string}` || "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

const PRESET_AMOUNTS = [0.25, 0.50, 1, 2];

export default function TipPage() {
    const params = useParams();
    const creatorAddress = params.creatorAddress as `0x${string}`;
    const router = useRouter();
    const { address } = useAccount();

    const [amount, setAmount] = useState<number>(1);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [isCustom, setIsCustom] = useState(false);

    const [step, setStep] = useState<"input" | "approving" | "tipping" | "success">("input");

    // Get Active Round
    const { data: activeRoundId } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: QuadraticTippingABI,
        functionName: "getActiveRound",
    });

    // Get Creator Info
    const { data: creatorInfo, refetch: refetchCreator } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: QuadraticTippingABI,
        functionName: "getCreatorInfo",
        args: activeRoundId ? [activeRoundId, creatorAddress] : undefined,
        query: { enabled: !!activeRoundId }
    });

    // Write contracts
    const { writeContract: approve, data: approveHash } = useWriteContract();
    const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

    const { writeContract: tip, data: tipHash } = useWriteContract();
    const { isLoading: isTipping, isSuccess: isTipSuccess } = useWaitForTransactionReceipt({ hash: tipHash });

    useEffect(() => {
        if (isApproveSuccess && step === "approving") {
            setStep("tipping");
            const amtStr = isCustom && customAmount ? customAmount : amount.toString();
            tip({
                address: CONTRACT_ADDRESS,
                abi: QuadraticTippingABI,
                functionName: "tip",
                args: [activeRoundId!, creatorAddress, parseUnits(amtStr, 18)],
            });
        }
    }, [isApproveSuccess, step, isCustom, customAmount, amount, activeRoundId, creatorAddress, tip]);

    useEffect(() => {
        if (isTipSuccess && step === "tipping") {
            setStep("success");
            refetchCreator();
        }
    }, [isTipSuccess, step, refetchCreator]);

    const handleTipSubmit = () => {
        if (!activeRoundId) return;
        const amtStr = isCustom && customAmount ? customAmount : amount.toString();
        if (Number(amtStr) <= 0) return;

        setStep("approving");
        approve({
            address: CUSD_ADDRESS,
            abi: ERC20ABI,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, parseUnits(amtStr, 18)],
        });
    };

    const handleShareCast = () => {
        const amtStr = isCustom && customAmount ? customAmount : amount.toString();
        const estTotalMatchStr = estimatedMatchDiff > 0 ? formatUnits(BigInt(Math.floor(estimatedMatchDiff * 1e18).toString()), 18) : "0";

        sdk.actions.openUrl(`https://warpcast.com/~/compose?text=Acabo de enviar un tip de $${amtStr} en DonaCuadratico! 🎯 Mi tip generará ~$${parseFloat(estTotalMatchStr).toFixed(2)} de matching cuadrático.&embeds[]=https://DonaCuadratico.xyz`);
    };

    // Preview Calculation
    // We need to simulate the math: new_matching = (sqrtSum_actual + sqrt(amount))^2 - (totalTips + amount)
    let estimatedMatchDiff = 0;
    const tipAmountNum = isCustom ? Number(customAmount) : amount;

    if (creatorInfo && tipAmountNum > 0) {
        // Math.sqrt receives scale 1e18, returns scale 1e9.
        // So 1 cUSD = 1 = 1e18 wei. sqrt(1e18) = 1e9.
        const tipAmountWei = tipAmountNum * 1e18;
        const currentSqrtSum = Number(creatorInfo.sqrtSum); // scale e9
        const tipSqrt = Math.sqrt(tipAmountWei);            // scale e9 

        const newSqrtSum = currentSqrtSum + tipSqrt;
        const newSquaredSum = newSqrtSum * newSqrtSum;      // scale e18
        const currentTotalTips = Number(creatorInfo.totalTips); // scale e18
        const newTotalTips = currentTotalTips + tipAmountWei;

        let newMatching = 0;
        if (newSquaredSum > newTotalTips) {
            newMatching = newSquaredSum - newTotalTips;       // scale e18
        }

        let currentMatching = 0;
        const currentSquaredSum = currentSqrtSum * currentSqrtSum;
        if (currentSquaredSum > currentTotalTips) {
            currentMatching = currentSquaredSum - currentTotalTips;
        }

        estimatedMatchDiff = (newMatching - currentMatching) / 1e18;
    }

    if (step === "success") {
        return (
            <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-6">🎉</div>
                <h1 className="text-3xl font-black mb-2 text-center">¡Tip Enviado!</h1>
                <p className="text-zinc-400 text-center mb-8 max-w-sm">
                    Has contribuido a aumentar el matching cuadrático. Cada persona cuenta más que cada dólar.
                </p>
                <div className="space-y-4 w-full max-w-sm">
                    <button
                        onClick={handleShareCast}
                        className="w-full py-3 rounded-xl font-bold bg-[#8b5cf6] text-white hover:bg-[#7c3aed] transition-colors"
                    >
                        Compartir en Farcaster
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-4 pt-12 pb-20">
            <div className="max-w-md mx-auto space-y-8">
                <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    ← Volver
                </Link>

                {/* Creator Info Header */}
                <div className="flex flex-col items-center p-6 bg-zinc-900 border border-white/5 rounded-3xl">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#10b981] to-[#8b5cf6] flex items-center justify-center text-2xl font-black shadow-2xl mb-4 text-white">
                        {creatorAddress.substring(2, 4).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold font-mono tracking-tighter truncate w-full text-center px-4">
                        {creatorAddress.substring(0, 6)}...{creatorAddress.substring(38)}
                    </h2>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="text-center">
                            <p className="text-sm text-zinc-500">Tips Obtenidos</p>
                            <p className="font-bold text-[#10b981]">
                                ${creatorInfo ? parseFloat(formatUnits(creatorInfo.totalTips, 18)).toFixed(2) : "0.00"}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-sm text-zinc-500">Tippers</p>
                            <p className="font-bold text-white">
                                {creatorInfo ? creatorInfo.tipperCount.toString() : "0"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tip Selector */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Selecciona tu Tip (cUSD)</h3>

                    <div className="grid grid-cols-4 gap-2">
                        {PRESET_AMOUNTS.map((amt) => (
                            <button
                                key={amt}
                                onClick={() => { setAmount(amt); setIsCustom(false); }}
                                className={`py-3 rounded-xl font-bold text-sm transition-all ${!isCustom && amount === amt
                                    ? "bg-[#10b981] text-black shadow-lg shadow-[#10b981]/20 scale-105"
                                    : "bg-zinc-900 text-zinc-300 border border-white/5 hover:bg-zinc-800"
                                    }`}
                            >
                                ${amt.toFixed(2)}
                            </button>
                        ))}
                    </div>

                    <div className="relative mt-2">
                        <div className={`flex items-center p-1 rounded-xl border transition-colors ${isCustom ? "border-[#10b981] bg-[#10b981]/10" : "border-white/10 bg-zinc-900"}`}>
                            <span className="pl-4 text-zinc-400 font-bold">$</span>
                            <input
                                type="number"
                                placeholder="Otro monto..."
                                className="w-full bg-transparent border-none outline-none py-3 px-2 text-white font-bold placeholder:font-normal"
                                value={customAmount}
                                onChange={(e) => {
                                    setIsCustom(true);
                                    setCustomAmount(e.target.value);
                                }}
                                onFocus={() => setIsCustom(true)}
                            />
                        </div>
                    </div>
                </div>

                {/* Matching Preview */}
                <div className="p-4 bg-gradient-to-br from-[#10b981]/10 to-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-2xl">
                    <p className="text-sm text-zinc-300 mb-2">Impacto Cuadrático Estimado</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#8b5cf6]">
                            +${estimatedMatchDiff > 0 ? estimatedMatchDiff.toFixed(2) : "0.00"}
                        </span>
                        <span className="text-sm text-zinc-400 mb-1">en matching</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                        Tu tip de ${tipAmountNum || "0"} genera este matching extra para el creador.
                    </p>
                </div>

                {/* Submit */}
                <button
                    onClick={handleTipSubmit}
                    disabled={step !== "input" || !activeRoundId || !address}
                    className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-[#10b981]/20 ${step !== "input" ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" : "bg-[#10b981] text-black hover:bg-[#0ea5e9]/90 hover:shadow-[#0ea5e9]/30"
                        }`}
                >
                    {step === "approving" ? "Aprobando cUSD..." : step === "tipping" ? "Enviando Tip..." : "Confirmar Tip"}
                </button>
            </div>
        </div>
    );
}
