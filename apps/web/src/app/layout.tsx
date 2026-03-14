import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { Navbar } from '@/components/navbar';
import Providers from "@/components/providers"
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ['latin'] });

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// Embed metadata for Farcaster sharing
const frame = {
  version: "next",
  imageUrl: `${appUrl}/api/og`,
  button: {
    title: "Enviar Tip",
    action: {
      type: "launch_frame",
      name: "DonaCuadratico",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#0a0a0f",
    },
  },
};

export const metadata: Metadata = {
  title: 'DonaCuadratico',
  description: 'Quadratic Tipping for Farcaster via Celo',
  openGraph: {
    title: 'DonaCuadratico',
    description: 'Quadratic Tipping for Farcaster via Celo',
    images: [`${appUrl}/api/og`],
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        {/* Navbar is included on all pages */}
        <div className="relative flex min-h-screen flex-col">
          <Providers>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
