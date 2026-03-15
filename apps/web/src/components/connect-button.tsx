"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

/**
 * Botón de wallet universal:
 * - Si conectado: muestra address pill + botón ✕ (desconectar)
 * - Si no es móvil: permite cambiar a wallet externa (🔑)
 */
export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [externalConnector, setExternalConnector] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobileMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsMobile(mobileMatch);

    const hasInjected = typeof window !== "undefined" && !!window.ethereum;
    const connectorId = hasInjected ? "injected" : "walletConnect";
    
    const connector = connectors.find((c) => c.id === connectorId) || connectors.find((c) => c.id === "walletConnect");
    setExternalConnector(connector);
  }, [connectors]);

  // --- CONECTADO ---
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Address pill */}
        <div className="px-3 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300">
          {address.slice(0, 6)}…{address.slice(-4)}
        </div>

        {/* Wallet externa (Solo Web) */}
        {externalConnector && !isMobile && (
          <button
            onClick={() => connect({ connector: externalConnector })}
            disabled={isPending}
            title="Cambiar a wallet externa"
            className="px-2 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-xs text-zinc-400 hover:text-[#10b981] hover:border-[#10b981]/40 transition-colors disabled:opacity-40"
          >
            🔑
          </button>
        )}

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
