"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

/**
 * Botón de wallet universal:
 * - Si conectado: muestra address pill + botón ✕ (desconectar) + botón wallet externa
 * - Si no conectado: muestra botón para conectar wallet externa (Rabby/MetaMask)
 */
export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showExternal, setShowExternal] = useState(false);

  // Usamos injected si existe, sino caemos a walletConnect (ideal para Farcaster móvil)
  const externalConnector = connectors.find((c) => c.id === "injected") 
                         || connectors.find((c) => c.id === "walletConnect");

  // --- CONECTADO ---
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Address pill */}
        <div className="px-3 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300">
          {address.slice(0, 6)}…{address.slice(-4)}
        </div>

        {/* Wallet externa */}
        <button
          onClick={() => externalConnector && connect({ connector: externalConnector })}
          disabled={!externalConnector || isPending}
          title="Cambiar a wallet externa (Rabby/MetaMask/WalletConnect)"
          className="px-2 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-xs text-zinc-400 hover:text-[#10b981] hover:border-[#10b981]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🔑
        </button>

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

  // --- NO CONECTADO (browser / Farcaster sin auto-connect aún) ---
  return (
    <button
      onClick={() => externalConnector && connect({ connector: externalConnector })}
      disabled={!externalConnector || isPending}
      className="px-4 py-1.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 text-xs font-semibold text-[#10b981] hover:bg-[#10b981]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isPending ? "Conectando…" : externalConnector ? "Conectar Wallet" : "Sin wallet detectada"}
    </button>
  );
}
