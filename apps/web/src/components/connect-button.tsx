"use client";

import { useAccount, useDisconnect } from "wagmi";

/**
 * Botón de wallet universal:
 * - Si conectado: muestra address pill + botón ✕ (desconectar) + botón wallet externa
 * - Si no conectado: muestra botón para conectar wallet externa (Rabby/MetaMask)
 */
export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // --- CONECTADO ---
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Address pill */}
        <div className="px-3 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300">
          {address.slice(0, 6)}…{address.slice(-4)}
        </div>

        {/* Desconectar */}
        <button
          onClick={() => disconnect()}
          title="Desconectar wallet"
          className="px-2 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-xs text-zinc-400 hover:text-red-400 hover:border-red-400/30 transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
