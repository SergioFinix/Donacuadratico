"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { QuadraticTippingABI } from "@/lib/abi";
import { formatUnits } from "viem";
import { useState, useEffect } from "react";
import { HumanityVerification } from "@/components/HumanityVerification";
import Link from "next/link";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function Home() {
  const { address, isConnected } = useAccount();

  // 1. Get Active Round
  const { data: activeRoundId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "getActiveRound",
  });

  // 2. Get Round Info
  const { data: roundInfo, refetch: refetchRound } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "getRoundInfo",
    args: activeRoundId ? [activeRoundId] : undefined,
    query: {
      enabled: !!activeRoundId,
    }
  });

  // 3. User verification status
  const { data: isVerified } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "isVerifiedHuman",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // 4. Registration Check
  const { data: isRegistered } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "isRegisteredCreator",
    args: address && activeRoundId ? [activeRoundId, address] : undefined,
    query: {
      enabled: !!address && !!activeRoundId,
    }
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const registerAsCreator = () => {
    if (!activeRoundId) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: QuadraticTippingABI,
      functionName: "registerAsCreator",
      args: [activeRoundId],
    });
  };

  useEffect(() => {
    if (isConfirmed) refetchRound();
  }, [isConfirmed, refetchRound]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 pb-20 pt-8">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-[#10b981] to-[#8b5cf6] text-transparent bg-clip-text">
            QuadTip
          </h1>
          <p className="text-zinc-400">Quadratic Tipping for Farcaster</p>
        </div>

        {/* Humanity Status */}
        {isConnected && (
          <div className="space-y-4">
            {!isVerified ? (
              <HumanityVerification />
            ) : (
              <div className="p-4 bg-zinc-900 border border-green-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-green-400">Humano Verificado ✅</h3>
                  <p className="text-xs text-zinc-400">Tu poder de matching está activo.</p>
                </div>
                {!isRegistered && activeRoundId && (
                  <button
                    onClick={registerAsCreator}
                    disabled={isConfirming}
                    className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {isConfirming ? "Registrando..." : "Registrarse como Creador"}
                  </button>
                )}
                {isRegistered && (
                  <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-bold rounded-full border border-[#10b981]/20">
                    Creador Activo
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Round Info */}
        <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Ronda #{activeRoundId ? activeRoundId.toString() : "-"}</h2>
            <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-semibold text-zinc-300">
              {roundInfo?.finalized ? "Finalizada" : "En Curso"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/50 rounded-xl border border-white/5">
              <p className="text-sm text-zinc-400 mb-1">Matching Pool</p>
              <p className="text-2xl font-black text-[#10b981]">
                ${roundInfo ? formatUnits(roundInfo.matchingPool, 18) : "0.00"}
              </p>
            </div>
            <div className="p-4 bg-black/50 rounded-xl border border-white/5">
              <p className="text-sm text-zinc-400 mb-1">Creadores</p>
              <p className="text-2xl font-black text-[#8b5cf6]">
                {roundInfo ? roundInfo.creators.length : "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Creators List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Explorar Creadores</h3>
          {roundInfo?.creators.map((creator) => (
            <Link href={`/tip/${creator}`} key={creator}>
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl flex items-center gap-4 hover:border-[#8b5cf6]/50 transition-colors cursor-pointer group mt-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#10b981] to-[#8b5cf6] flex items-center justify-center font-bold text-white shadow-lg">
                  {creator.substring(2, 4)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold font-mono text-sm truncate">{creator}</p>
                  <p className="text-xs text-zinc-400 mt-1 group-hover:text-[#8b5cf6] transition-colors">Enviar Tip →</p>
                </div>
              </div>
            </Link>
          ))}
          {roundInfo?.creators.length === 0 && (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-white/5">
              Todavía no hay creadores registrados en esta ronda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
