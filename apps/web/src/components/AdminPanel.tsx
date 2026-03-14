"use client";

import { useState } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { QuadraticTippingABI, ERC20ABI } from "@/lib/abi";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

// ─── Subcomponent: Creator row inside expanded round ─────────────────────────
function CreatorRow({ roundId, creator }: { roundId: bigint; creator: `0x${string}` }) {
  const { data: info } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "getCreatorInfo",
    args: [roundId, creator],
  });

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30 border border-white/5 text-xs">
      <span className="font-mono text-zinc-400 truncate w-36">
        {creator.slice(0, 8)}…{creator.slice(-6)}
      </span>
      <div className="flex gap-4 text-right">
        <div>
          <p className="text-zinc-500">Tips</p>
          <p className="text-white font-semibold">
            ${info ? formatUnits(info.totalTips, 18) : "—"}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Donantes</p>
          <p className="text-white font-semibold">{info ? info.tipperCount.toString() : "—"}</p>
        </div>
        <div>
          <p className="text-zinc-500">Matching</p>
          <p className="text-[#10b981] font-semibold">
            ${info ? formatUnits(info.matchingAmount, 18) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponent: One round row ─────────────────────────────────────────────
function RoundRow({ roundId }: { roundId: bigint }) {
  const [expanded, setExpanded] = useState(false);
  const { data: round, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "getRoundInfo",
    args: [roundId],
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  if (isConfirmed) refetch();

  if (!round) return null;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const isExpired = now > round.endTime;
  const isActive = now >= round.startTime && now <= round.endTime;

  const statusLabel = round.finalized
    ? "Finalizada"
    : isActive
    ? "En Curso"
    : "Expirada";
  const statusColor = round.finalized
    ? "text-zinc-500 bg-zinc-800"
    : isActive
    ? "text-[#10b981] bg-[#10b981]/10"
    : "text-yellow-400 bg-yellow-400/10";

  const fmt = (ts: bigint) =>
    new Date(Number(ts) * 1000).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900">
        {/* ID */}
        <span className="text-xs font-mono text-zinc-500 w-8">#{roundId.toString()}</span>

        {/* Dates */}
        <div className="flex-1 text-xs text-zinc-400">
          {fmt(round.startTime)} → {fmt(round.endTime)}
        </div>

        {/* Pool */}
        <div className="text-right text-xs">
          <p className="text-zinc-500">Pool</p>
          <p className="text-[#10b981] font-bold">${formatUnits(round.matchingPool, 18)}</p>
        </div>

        {/* Creators */}
        <div className="text-right text-xs">
          <p className="text-zinc-500">Creadores</p>
          <p className="text-[#8b5cf6] font-bold">{round.creators.length}</p>
        </div>

        {/* Status badge */}
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
          {statusLabel}
        </span>

        {/* Finalize button */}
        {!round.finalized && (
          <button
            onClick={() =>
              writeContract({
                address: CONTRACT_ADDRESS,
                abi: QuadraticTippingABI,
                functionName: "finalizeRound",
                args: [roundId],
              })
            }
            disabled={isConfirming}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {isConfirming ? "…" : "Finalizar"}
          </button>
        )}

        {/* Expand toggle */}
        {round.creators.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>

      {/* Collapsible creators */}
      {expanded && round.creators.length > 0 && (
        <div className="p-3 bg-black/40 space-y-2 border-t border-white/5">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">
            Creadores registrados
          </p>
          {round.creators.map((creator) => (
            <CreatorRow
              key={creator}
              roundId={roundId}
              creator={creator as `0x${string}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminPanel() {
  const [poolInput, setPoolInput] = useState("0");
  const [durationInput, setDurationInput] = useState("604800"); // Default 7 days in seconds
  const [step, setStep] = useState<"idle" | "approving" | "creating">("idle");

  const { data: totalRounds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "currentRoundId",
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Reset step on success
  if (isConfirmed && step !== "idle") setStep("idle");

  const roundIds = totalRounds
    ? Array.from({ length: Number(totalRounds) }, (_, i) => BigInt(i + 1))
    : [];

  const handleCreateRound = async () => {
    const amount = parseUnits(poolInput || "0", 18);

    if (amount > 0n) {
      // Step 1: approve
      setStep("approving");
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amount],
      });
      // After approve confirms, user will need to click again or we chain via useEffect
      // For simplicity, we inform user to click again after approve
    } else {
      // No pool — direct createRound(0)
      setStep("creating");
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: QuadraticTippingABI,
        functionName: "createRound",
        args: [0n, BigInt(durationInput)],
      });
    }
  };

  const handleCreateAfterApprove = () => {
    const amount = parseUnits(poolInput || "0", 18);
    setStep("creating");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: QuadraticTippingABI,
      functionName: "createRound",
      args: [amount, BigInt(durationInput)],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
        <span className="text-lg">⚙️</span>
        <h2 className="text-lg font-black text-white">Panel de Administración</h2>
        <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
          Owner
        </span>
      </div>

      {/* Create Round */}
      <div className="p-5 bg-zinc-900 border border-white/5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-zinc-200">Crear Nueva Ronda</h3>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={poolInput}
              onChange={(e) => setPoolInput(e.target.value)}
              className="w-full pl-7 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10b981]/50 placeholder-zinc-600"
            />
          </div>
          <span className="text-xs text-zinc-500 w-24">matching pool</span>
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10b981]/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[position:calc(100%-12px)_center] bg-no-repeat pr-10"
          >
            <option value="600">Prueba rápida (10 minutos)</option>
            <option value="3600">Corta (1 hora)</option>
            <option value="86400">Normal (1 día)</option>
            <option value="259200">Extendida (3 días)</option>
            <option value="604800">Oficial (7 días)</option>
          </select>
          <span className="text-xs text-zinc-500 w-24">duración</span>
        </div>

        {step === "idle" && (
          <button
            onClick={handleCreateRound}
            disabled={isConfirming}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            🚀 Crear Ronda
          </button>
        )}

        {step === "approving" && (
          <div className="space-y-2">
            <div className="p-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-xs text-yellow-400">
              ✅ Paso 1/2: Aprueba el gasto de cUSD en tu wallet. Luego haz clic en &quot;Confirmar Creación&quot;.
            </div>
            <button
              onClick={handleCreateAfterApprove}
              disabled={isConfirming}
              className="w-full py-3 rounded-xl bg-[#8b5cf6] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isConfirming ? "Esperando confirmación…" : "✅ Paso 2/2: Confirmar Creación"}
            </button>
          </div>
        )}

        {step === "creating" && isConfirming && (
          <div className="p-3 bg-[#10b981]/5 border border-[#10b981]/20 rounded-xl text-xs text-[#10b981] text-center">
            ⏳ Creando ronda en la blockchain…
          </div>
        )}
      </div>

      {/* Rounds list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">
            Rondas ({roundIds.length})
          </h3>
        </div>

        {roundIds.length === 0 ? (
          <div className="p-6 text-center text-zinc-600 bg-zinc-900/50 rounded-xl border border-white/5 text-sm">
            No hay rondas creadas aún.
          </div>
        ) : (
          <div className="space-y-2">
            {[...roundIds].reverse().map((id) => (
              <RoundRow key={id.toString()} roundId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
