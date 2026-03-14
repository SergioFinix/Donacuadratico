"use client";

import { useAccount, useConnect } from "wagmi";
import { ReactNode } from "react";

const FEATURES = [
  {
    icon: "⚡",
    title: "Quadratic Funding",
    desc: "Cada tip multiplica geometricamente el impacto — pequeñas donaciones de muchos valen más que una grande.",
  },
  {
    icon: "🛡️",
    title: "Resistencia Sybil",
    desc: "Solo humanos verificados con Human Passport participan, protegiendo la matemática cuadrática.",
  },
  {
    icon: "🌐",
    title: "Nativo de Celo",
    desc: "Transacciones en cUSD sobre Celo — gas ultra bajo, confirmaciones en segundos.",
  },
  {
    icon: "🔁",
    title: "Ciclo viral en Farcaster",
    desc: "Comparte tu donación como Cast y amplifica el matching pool de toda la comunidad.",
  },
];

interface WalletGateProps {
  children: ReactNode;
}

export function WalletGate({ children }: WalletGateProps) {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  // Si ya hay wallet conectada → mostrar la app principal
  if (isConnected) return <>{children}</>;

  const externalConnector = connectors.find((c) => c.id === "injected")
                         || connectors.find((c) => c.id === "walletConnect");
  // farcasterMiniApp auto-conecta via AutoConnect, pero por si acaso:
  const farcasterConnector = connectors.find((c) => c.id !== "injected");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-4 pb-16">
      {/* Hero */}
      <div className="text-center space-y-4 mb-12 max-w-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-semibold mb-2">
          ✨ Construido sobre Celo × Farcaster
        </div>

        <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-[#10b981] via-white to-[#8b5cf6] text-transparent bg-clip-text leading-none pb-1">
          Donacuadratico
        </h1>

        <p className="text-zinc-400 text-base leading-relaxed">
          La primera plataforma de <span className="text-white font-semibold">tipping cuadrático</span> para
          creadores de contenido en Farcaster. Envía micro-tips en cUSD y desbloquea un matching pool
          que <span className="text-[#10b981] font-semibold">multiplica tu impacto</span> geométricamente.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-12">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-1.5 hover:border-white/10 transition-colors"
          >
            <span className="text-2xl">{f.icon}</span>
            <h3 className="text-sm font-bold text-white">{f.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA section */}
      <div className="w-full max-w-sm space-y-3 text-center">
        <p className="text-zinc-500 text-sm">Conecta tu wallet para comenzar</p>

        {/* Farcaster (MiniApp — auto-connect ya lo maneja, pero si falla puede hacer clic) */}
        {farcasterConnector && (
          <button
            onClick={() => connect({ connector: farcasterConnector })}
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6d3fc9] text-white font-bold text-sm shadow-lg shadow-purple-900/30 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Conectando…" : "🟣  Entrar con Farcaster"}
          </button>
        )}

        {/* Wallet externa (Rabby, MetaMask, WalletConnect) */}
        {externalConnector && (
          <button
            onClick={() => connect({ connector: externalConnector })}
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl bg-zinc-800 border border-white/10 text-white font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isPending ? "Conectando…" : "🔑  Conectar wallet externa"}
          </button>
        )}

        {!farcasterConnector && !externalConnector && (
          <p className="text-red-400 text-sm">No se detectó ninguna wallet. Abre la app desde Warpcast o instala Rabby.</p>
        )}

        <p className="text-zinc-600 text-xs pt-2">
          La verificación de humanidad ocurre dentro de la app.
        </p>
      </div>
    </div>
  );
}
