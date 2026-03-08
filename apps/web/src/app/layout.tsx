import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { Navbar } from '@/components/navbar';
import Providers from "@/components/providers"

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
      name: "QuadTip",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#0a0a0f",
    },
  },
};

export const metadata: Metadata = {
  title: 'QuadTip',
  description: 'Quadratic Tipping for Farcaster via Celo',
  openGraph: {
    title: 'QuadTip',
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
