"use client";

import { useState } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { QuadraticTippingABI, ERC20ABI } from "@/lib/abi";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

// ─── Subcomponent: Creator row inside expanded round ─────────────────────────
function CreatorRow({ roundId, creator }: { roundId: bigint; creator: `0x${string}` }) {
  const [showTips, setShowTips] = useState(false);
  const { data: info } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "getCreatorInfo",
    args: [roundId, creator],
  });

  const { data: tips } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "getCreatorTips",
    args: [roundId, creator],
    query: { enabled: showTips }
  });

  return (
    <div className="space-y-2">
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
          {info && info.tipperCount > 0n && (
            <button 
              onClick={() => setShowTips(!showTips)}
              className="pl-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showTips ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {showTips && tips && tips.length > 0 && (
        <div className="ml-4 space-y-1 border-l-2 border-white/5 pl-3">
          {tips.map((record, idx) => (
            <div key={idx} className="flex justify-between text-[10px] py-1 border-b border-white/5 last:border-0">
              <span className="font-mono text-zinc-500 truncate w-32">
                {record.tipper.slice(0, 6)}…{record.tipper.slice(-4)}
              </span>
              <span className="text-[#10b981] font-bold">
                +${formatUnits(record.amount, 18)}
              </span>
            </div>
          ))}
        </div>
      )}
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

  const { writeContract, data: hash, error: finalError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } =
    useWaitForTransactionReceipt({ hash });

  // Funding Logic
  const [fundingAmount, setFundingAmount] = useState("");
  const [fundingStep, setFundingStep] = useState<"idle" | "approving" | "funding">("idle");

  const { writeContract: fundPool, data: fundHash, error: fundError } = useWriteContract();
  const { isLoading: isConfirmingFund, isSuccess: isFundSuccess, error: confirmFundError } = 
    useWaitForTransactionReceipt({ hash: fundHash });

  const { writeContract: approveFund, data: approveHash, error: approveError } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess, error: confirmApproveError } = 
    useWaitForTransactionReceipt({ hash: approveHash });

  useEffect(() => {
    const error = finalError || confirmError;
    if (error) {
      console.error("Finalize error:", error);
      if (error.message?.includes("Round still active")) {
        toast.error("La ronda todavía está activa");
      } else {
        toast.error("Error al finalizar la ronda");
      }
    }
  }, [finalError, confirmError]);

  useEffect(() => {
    const error = fundError || confirmFundError || approveError || confirmApproveError;
    if (error) {
      console.error("Fund error:", error);
      toast.error("Error al fondear ronda");
      setFundingStep("idle");
    }
  }, [fundError, confirmFundError, approveError, confirmApproveError]);

  useEffect(() => {
    if (isApproveSuccess && fundingStep === "approving") {
      setFundingStep("funding");
      const amount = parseUnits(fundingAmount, 18);
      fundPool({
        address: CONTRACT_ADDRESS,
        abi: QuadraticTippingABI,
        functionName: "fundMatchingPool",
        args: [roundId, amount],
        gas: 500000n,
      });
    }
  }, [isApproveSuccess, fundingStep, fundingAmount, roundId, fundPool]);

  useEffect(() => {
    if (isFundSuccess) {
      toast.success("¡Fondeo exitoso!");
      setFundingStep("idle");
      setFundingAmount("");
      refetch();
    }
  }, [isFundSuccess, refetch]);

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
        {!round.finalized && isExpired && (
          <button
            onClick={() =>
              writeContract({
                address: CONTRACT_ADDRESS,
                abi: QuadraticTippingABI,
                functionName: "finalizeRound",
                args: [roundId],
                gas: 500000n,
              })
            }
            disabled={isConfirming}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {isConfirming ? "…" : "Finalizar"}
          </button>
        )}

        {/* Fund Input/Button */}
        {!round.finalized && (
          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
            <input
              type="number"
              placeholder="0.00"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              disabled={fundingStep !== "idle"}
              className="w-16 bg-transparent text-xs font-mono text-white outline-none pl-1 placeholder:text-zinc-700"
            />
            <button
              onClick={() => {
                const amount = parseUnits(fundingAmount, 18);
                if (amount <= 0n) return toast.error("Ingresa un monto");
                setFundingStep("approving");
                approveFund({
                  address: USDC_ADDRESS,
                  abi: ERC20ABI,
                  functionName: "approve",
                  args: [CONTRACT_ADDRESS, amount],
                });
              }}
              disabled={fundingStep !== "idle" || !fundingAmount}
              className="p-1 rounded bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 transition-colors disabled:opacity-30"
              title="Fondear Matching Pool"
            >
              {fundingStep === "idle" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              ) : (
                <div className="w-3 h-3 border-2 border-[#10b981] border-t-transparent animate-spin rounded-full" />
              )}
            </button>
          </div>
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
  const [step, setStep] = useState<"idle" | "approving" | "creating_pending" | "creating">("idle");

  const { data: totalRounds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: QuadraticTippingABI,
    functionName: "currentRoundId",
  });

  const { writeContract: writeCreate, data: hashCreate, error: createError } = useWriteContract();
  const { isLoading: isConfirmingCreate, isSuccess: isConfirmedCreate, error: confirmCreateError } =
    useWaitForTransactionReceipt({ hash: hashCreate });

  useEffect(() => {
    const error = createError || confirmCreateError;
    if (error) {
      console.error("Create error:", error);
      toast.error("Error al crear la ronda");
      setStep("idle");
    }
  }, [createError, confirmCreateError]);

  const { writeContract: writeApprove, data: hashApprove, error: approveError } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isConfirmedApprove, error: confirmApproveError } =
    useWaitForTransactionReceipt({ hash: hashApprove });

  useEffect(() => {
    const error = approveError || confirmApproveError;
    if (error) {
      console.error("Approve error:", error);
      toast.error("Error al aprobar cUSD");
      setStep("idle");
    }
  }, [approveError, confirmApproveError]);

  // Si approve es exitoso, pasamos al paso 2
  if (isConfirmedApprove && step === "approving") {
    setStep("creating_pending");
  }

  // Si la creacion de ronda es exitosa, reiniciamos el formulario
  if (isConfirmedCreate && (step === "creating" || step === "creating_pending")) {
    setStep("idle");
    setPoolInput("0");
  }

  const roundIds = totalRounds
    ? Array.from({ length: Number(totalRounds) }, (_, i) => BigInt(i + 1))
    : [];

  const handleCreateRound = async () => {
    const amount = parseUnits(poolInput || "0", 18);

    if (amount > 0n) {
      setStep("approving");
      writeApprove({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amount],
        gas: 200000n,
      });
    } else {
      setStep("creating");
      writeCreate({
        address: CONTRACT_ADDRESS,
        abi: QuadraticTippingABI,
        functionName: "createRound",
        args: [0n, BigInt(durationInput)],
        gas: 500000n,
      });
    }
  };

  const handleCreateAfterApprove = () => {
    const amount = parseUnits(poolInput || "0", 18);
    setStep("creating");
    writeCreate({
      address: CONTRACT_ADDRESS,
      abi: QuadraticTippingABI,
      functionName: "createRound",
      args: [amount, BigInt(durationInput)],
      gas: 500000n,
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
            disabled={isConfirmingApprove || isConfirmingCreate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            🚀 Crear Ronda
          </button>
        )}

        {(step === "approving" || step === "creating_pending") && (
          <div className="space-y-2">
            <div className={`p-3 border rounded-xl text-xs ${step === "creating_pending" ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]" : "bg-yellow-400/5 border-yellow-400/20 text-yellow-400"}`}>
              {step === "creating_pending" 
                ? "✅ cUSD Aprobado. Ahora confirma la creación de la ronda." 
                : "✅ Paso 1/2: Aprueba el gasto de cUSD en tu wallet. Luego haz clic en \"Confirmar Creación\"."}
            </div>
            <button
              onClick={handleCreateAfterApprove}
              disabled={step === "approving" || isConfirmingApprove || isConfirmingCreate}
              className="w-full py-3 rounded-xl bg-[#8b5cf6] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isConfirmingApprove ? "Aprobando cUSD..." : isConfirmingCreate ? "Esperando transacción..." : "✅ Paso 2/2: Confirmar Creación"}
            </button>
          </div>
        )}

        {step === "creating" && isConfirmingCreate && (
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
