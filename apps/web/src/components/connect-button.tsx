"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { isInFarcasterFrame } from "@/contexts/frame-wallet-context";

/**
 * - En Farcaster MiniApp: muestra la address pill (la conexión es automática).
 * - En browser (Rabby/testing): muestra botón "Conectar Wallet" hasta conectar,
 *   luego muestra la address pill + botón de desconectar.
 */
export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Conectado → siempre mostrar la address pill
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300">
          {address.slice(0, 6)}…{address.slice(-4)}
        </div>
        {/* Botón de desconectar solo en browser (para testing) */}
        {!isInFarcasterFrame() && (
          <button
            onClick={() => disconnect()}
            className="px-2 py-1 rounded-full bg-zinc-800 border border-white/10 text-xs text-zinc-500 hover:text-red-400 hover:border-red-400/30 transition-colors"
            title="Desconectar wallet"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // No conectado en browser → botón para conectar Rabby/MetaMask
  if (!isInFarcasterFrame()) {
    const injectedConnector = connectors.find((c) => c.id === "injected");
    return (
      <button
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
        disabled={!injectedConnector}
        className="px-4 py-1.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 text-xs font-semibold text-[#10b981] hover:bg-[#10b981]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {injectedConnector ? "Conectar Wallet" : "No se detectó wallet"}
      </button>
    );
  }

  // Farcaster: sin conexión aún → invisible (AutoConnect lo maneja)
  return null;
}

