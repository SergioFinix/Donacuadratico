"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";
import { WagmiProvider, createConfig, http, useConnect } from "wagmi";
import { celo } from "wagmi/chains";

const config = createConfig({
  ssr: true,
  chains: [celo],
  connectors: [
    farcasterMiniApp(), // Único connector permitido: MiniApp de Farcaster
  ],
  transports: {
    [celo.id]: http(),
  },
});

const queryClient = new QueryClient();

/**
 * Detecta si estamos corriendo dentro de un iframe de Farcaster.
 * En browser normal (Rabby/testing) window.parent === window.
 */
function isInFarcasterFrame(): boolean {
  if (typeof window === "undefined") return false;
  return window.parent !== window;
}

/**
 * Auto-conecta la wallet de Farcaster SOLO si estamos dentro del MiniApp.
 * En browser normal no hace nada — el usuario conecta Rabby manualmente.
 */
function AutoConnect() {
  const { connect, connectors } = useConnect();
  useEffect(() => {
    if (isInFarcasterFrame()) {
      const farcasterConnector = connectors[0]; // farcasterMiniApp
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export { isInFarcasterFrame };

export default function FrameWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
