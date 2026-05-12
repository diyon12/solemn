'use client';

import dynamic from 'next/dynamic';

// Dynamic import dengan ssr:false biar gak ada hydration mismatch
export const WalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return WalletMultiButton;
  },
  {
    ssr: false,
    loading: () => (
      <button
        className="px-4 py-2 bg-indigo-600/50 rounded-md text-sm font-medium"
        disabled
      >
        Loading...
      </button>
    ),
  }
);