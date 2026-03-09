"use client"

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useMiniApp } from '@/contexts/miniapp-context'

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { context } = useMiniApp()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
        Connect Wallet
      </button>
    )
  }

  if (!isConnected) {
    return (
      <div className="relative group">
        <button
          type="button"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-zinc-800 hover:text-white h-10 px-4 py-2"
        >
          Connect Wallet ▾
        </button>
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-zinc-900 ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50 overflow-hidden border border-white/10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {connectors.map((connector) => (
              <button
                key={connector.uid || connector.id}
                onClick={() => {
                  console.log(`Connecting with ${connector.name} (${connector.id})`);
                  connect({ connector });
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between"
                role="menuitem"
              >
                {connector.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-3 py-2"
      >
        Celo
      </button>

      <button
        onClick={() => disconnect()}
        type="button"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
      >
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
      </button>
    </div>
  )
}
