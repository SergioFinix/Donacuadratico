"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "./connect-button";

const navLinks = [
  { name: "Home", href: "/" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
      <div className="container flex h-14 max-w-xl mx-auto items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="font-black text-lg bg-gradient-to-br from-[#10b981] to-[#8b5cf6] text-transparent bg-clip-text">
            Donacuadratico
          </span>
        </Link>

        {/* Address pill — visible una vez que Farcaster conecta */}
        <WalletConnectButton />
      </div>
    </header>
  );
}
