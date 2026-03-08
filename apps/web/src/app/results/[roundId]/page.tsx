"use client";

import { useParams } from "next/navigation";
import { useReadContract, useReadContracts } from "wagmi";
import { QuadraticTippingABI } from "@/lib/abi";
import { formatUnits } from "viem";
import Link from "next/link";
import { useMemo } from "react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function ResultsPage() {
    const params = useParams();
    const roundId = BigInt(params.roundId as string);

    // 1. Get Round Info
    const { data: roundInfo } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: QuadraticTippingABI,
        functionName: "getRoundInfo",
        args: [roundId],
    });

    // 2. Prepare calls for each creator
    const creatorCalls = useMemo(() => {
        if (!roundInfo?.creators) return [];
        return roundInfo.creators.map(creator => ({
            address: CONTRACT_ADDRESS,
            abi: QuadraticTippingABI,
            functionName: "getCreatorInfo",
            args: [roundId, creator],
        }));
    }, [roundInfo, roundId]);

    // 3. Fetch all creator infos
    const { data: creatorsData } = useReadContracts({
        // @ts-ignore
        contracts: creatorCalls,
    });

    const creators = useMemo(() => {
        if (!creatorsData) return [];
        return creatorsData
            .map(result => result.result as any)
            .filter(Boolean)
            .sort((a, b) => {
                // Sort by total received (tips + matching)
                const totalA = Number(a.totalTips) + Number(a.matchingAmount);
                const totalB = Number(b.totalTips) + Number(b.matchingAmount);
                return totalB - totalA;
            });
    }, [creatorsData]);

    let totalTips = 0;
    let totalMatching = 0;
    let totalTippers = 0;

    creators.forEach(c => {
        totalTips += Number(formatUnits(c.totalTips, 18));
        totalMatching += Number(formatUnits(c.matchingAmount, 18));
        totalTippers += Number(c.tipperCount);
    });

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-4 pt-12 pb-20">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                        ← Volver al Inicio
                    </Link>
                    <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-semibold">
                        {roundInfo?.finalized ? "Resultados Finales" : "Estimaciones Actuales"}
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-white">
                        Resultados Ronda #{roundId.toString()}
                    </h1>
                    <p className="text-zinc-400">Desglose de la distribución de QuadTip</p>
                </div>

                {/* Global Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-center">
                        <p className="text-sm text-zinc-500 mb-1">Total Tips</p>
                        <p className="text-2xl font-black text-[#10b981]">${totalTips.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-center">
                        <p className="text-sm text-zinc-500 mb-1">Total Matching</p>
                        <p className="text-2xl font-black text-[#8b5cf6]">${totalMatching.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-center">
                        <p className="text-sm text-zinc-500 mb-1">Tippers Únicos</p>
                        <p className="text-2xl font-black text-white">{totalTippers}</p>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="space-y-4 mt-8">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
                        Leaderboard de Creadores
                    </h2>

                    <div className="space-y-3">
                        {creators.map((c, idx) => {
                            const tips = Number(formatUnits(c.totalTips, 18));
                            const match = Number(formatUnits(c.matchingAmount, 18));
                            const total = tips + match;

                            // Find max total to calculate bar widths
                            const maxTotal = creators.length > 0
                                ? Number(formatUnits(creators[0].totalTips, 18)) + Number(formatUnits(creators[0].matchingAmount, 18))
                                : 1;

                            const tipsPct = (tips / maxTotal) * 100;
                            const matchPct = (match / maxTotal) * 100;

                            return (
                                <div key={c.creator} className="p-4 bg-zinc-900/80 border border-white/5 rounded-2xl hover:bg-zinc-800/80 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center font-bold text-xs shadow-inner">
                                                #{idx + 1}
                                            </div>
                                            <p className="font-mono text-sm tracking-tighter text-zinc-300">
                                                {c.creator.substring(0, 6)}...{c.creator.substring(38)}
                                            </p>
                                        </div>
                                        <p className="font-black text-xl text-white">${total.toFixed(2)}</p>
                                    </div>

                                    {/* Progress Bar Representation */}
                                    <div className="w-full h-3 bg-black rounded-full flex overflow-hidden">
                                        <div style={{ width: `${tipsPct}%` }} className="h-full bg-[#10b981]" title={`Tips directos: $${tips.toFixed(2)}`} />
                                        <div style={{ width: `${matchPct}%` }} className="h-full bg-[#8b5cf6]" title={`Matching: $${match.toFixed(2)}`} />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs">
                                        <span className="text-[#10b981]/80 font-bold">Tips: ${tips.toFixed(2)}</span>
                                        <span className="text-[#8b5cf6]/80 font-bold">+ Matching: ${match.toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
