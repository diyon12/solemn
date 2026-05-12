'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { WalletButton } from '../components/WalletButton';

interface NFTAsset {
  mint: string;
  name: string;
  image: string;
  description: string;
  attributes: { trait_type: string; value: string | number }[];
}

export default function AchievementsPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNFTs() {
      if (!publicKey) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );

        const nftAccounts = response.value.filter((acc) => {
          const info = acc.account.data.parsed.info;
          return info.tokenAmount.uiAmount === 1 && info.tokenAmount.decimals === 0;
        });

        const nftAssets: NFTAsset[] = [];

        for (const acc of nftAccounts) {
          const mint = acc.account.data.parsed.info.mint;

          try {
            const metadataPDA = PublicKey.findProgramAddressSync(
              [
                Buffer.from('metadata'),
                new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
                new PublicKey(mint).toBuffer(),
              ],
              new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
            )[0];

            const metadataAccount = await connection.getAccountInfo(metadataPDA);
            if (!metadataAccount) continue;

            const data = metadataAccount.data;
            let offset = 1 + 32 + 32;
            const nameLength = data.readUInt32LE(offset);
            offset += 4;
            const name = data.slice(offset, offset + nameLength).toString('utf-8').replace(/\0/g, '');
            offset += nameLength;
            const symbolLength = data.readUInt32LE(offset);
            offset += 4 + symbolLength;
            const uriLength = data.readUInt32LE(offset);
            offset += 4;
            const uri = data.slice(offset, offset + uriLength).toString('utf-8').replace(/\0/g, '');

            if (!name.includes('Solemn') && !uri.includes('SOLEMN') && !uri.includes('solemn')) continue;

            let metadataJson;
            if (uri.startsWith('data:application/json;base64,')) {
              const base64 = uri.replace('data:application/json;base64,', '');
              metadataJson = JSON.parse(decodeURIComponent(escape(atob(base64))));
            } else {
              const res = await fetch(uri);
              metadataJson = await res.json();
            }

            // Override the name with on-chain name (which has unique tier + number)
            nftAssets.push({
              mint,
              name: name.trim() || metadataJson.name,
              image: metadataJson.image,
              description: metadataJson.description,
              attributes: metadataJson.attributes || [],
            });
          } catch (e) {
            console.error('Failed to parse NFT:', mint, e);
          }
        }

        setNfts(nftAssets);
      } catch (err: any) {
        console.error('Error loading NFTs:', err);
        setError(err.message || 'Failed to load achievements');
      } finally {
        setLoading(false);
      }
    }

    loadNFTs();
  }, [publicKey, connection]);

  if (!connected) {
    return <ConnectWalletScreen />;
  }

  // Group by tier
  const tierOrder = ['Diamond', 'Gold', 'Silver', 'Bronze'];
  const nftsByTier = tierOrder.reduce((acc, tier) => {
    acc[tier] = nfts.filter(nft => nft.name.includes(tier));
    return acc;
  }, {} as Record<string, NFTAsset[]>);

  return (
    <main className="relative min-h-screen bg-[#0a0a14] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <Nav />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition">
          <span>←</span> Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-300 uppercase tracking-wider">
            🏆 Hall of Honor
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            My Achievements
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            NFT achievements earned for keeping your promises.
            <br className="hidden md:block" />
            Verifiable on Solana forever — proof of your integrity.
          </p>
        </div>

        {/* Stats Bar */}
        {!loading && nfts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            <TierStat
              icon="💎"
              label="Diamond"
              count={nftsByTier['Diamond'].length}
              gradient="from-blue-500/20 to-cyan-500/5"
              border="border-blue-500/30"
              textColor="text-blue-300"
            />
            <TierStat
              icon="🥇"
              label="Gold"
              count={nftsByTier['Gold'].length}
              gradient="from-amber-500/20 to-yellow-500/5"
              border="border-amber-500/30"
              textColor="text-amber-300"
            />
            <TierStat
              icon="🥈"
              label="Silver"
              count={nftsByTier['Silver'].length}
              gradient="from-slate-400/20 to-slate-500/5"
              border="border-slate-400/30"
              textColor="text-slate-200"
            />
            <TierStat
              icon="🥉"
              label="Bronze"
              count={nftsByTier['Bronze'].length}
              gradient="from-orange-500/20 to-amber-700/5"
              border="border-orange-500/30"
              textColor="text-orange-300"
            />
            <div className="relative group col-span-2 md:col-span-1">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-50 group-hover:opacity-100 transition" />
              <div className="relative h-full p-4 rounded-2xl bg-black/60 border border-purple-500/30 backdrop-blur-xl flex flex-col justify-center">
                <div className="text-xs text-purple-300/70 uppercase tracking-wider mb-1">Total</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {nfts.length}
                </div>
                <div className="text-xs text-slate-400">Promises Kept</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="relative">
            <div className="absolute -inset-1 bg-amber-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-black/40 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent mb-4" />
              <p className="text-slate-400">Loading your achievements...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="relative">
            <div className="absolute -inset-1 bg-rose-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-rose-500/5 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-xl">
              <p className="text-rose-300">❌ {error}</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && nfts.length === 0 && (
          <div className="relative">
            <div className="absolute -inset-1 bg-amber-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-black/40 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
              <div className="text-7xl mb-6">🎯</div>
              <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                No achievements yet
              </h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Keep your first promise to earn your first achievement NFT. Every kept promise mints a new tier-based NFT in your wallet.
              </p>
              <Link
                href="/create"
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600" />
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl blur opacity-50 group-hover:opacity-100 transition" />
                <span className="relative">Make a Promise</span>
                <span className="relative group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* NFT Grid */}
        {!loading && nfts.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <NFTCard key={nft.mint} nft={nft} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// =============================================================================
// COMPONENTS
// =============================================================================

function Nav() {
  return (
    <nav className="relative z-20 flex justify-between items-center px-6 md:px-12 py-5 border-b border-white/5">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <Image
            src="/logo/solemn-logo.png"
            alt="Solemn"
            width={40}
            height={40}
            className="rounded-xl transition-transform group-hover:scale-110"
            priority
          />
          <div className="absolute inset-0 bg-indigo-500/30 rounded-xl blur-xl -z-10" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          Solemn
        </span>
      </Link>
      <WalletButton />
    </nav>
  );
}

function ConnectWalletScreen() {
  return (
    <main className="relative min-h-screen bg-[#0a0a14] text-white flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative z-10 text-center max-w-md px-8">
        <div className="text-6xl mb-6">🏆</div>
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
          Your Achievements
        </h1>
        <p className="text-slate-400 mb-8">
          Connect wallet to see your earned achievement NFTs.
        </p>
        <div className="mb-6">
          <WalletButton />
        </div>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

function TierStat({
  icon,
  label,
  count,
  gradient,
  border,
  textColor,
}: {
  icon: string;
  label: string;
  count: number;
  gradient: string;
  border: string;
  textColor: string;
}) {
  return (
    <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${gradient} border ${border} backdrop-blur-sm hover:scale-105 transition`}>
      <div className="text-3xl mb-1">{icon}</div>
      <div className={`text-xs uppercase tracking-wider mb-1 ${textColor}`}>{label}</div>
      <div className="text-2xl font-bold text-white">{count}</div>
    </div>
  );
}

function NFTCard({ nft }: { nft: NFTAsset }) {
  // Detect tier from name
  const getTierFromName = (name: string): { tier: string; color: string; glow: string } => {
    if (name.includes('Diamond')) return { tier: 'Diamond', color: 'from-blue-500/20 to-cyan-500/20', glow: 'from-blue-400 to-cyan-400' };
    if (name.includes('Gold')) return { tier: 'Gold', color: 'from-amber-500/20 to-yellow-500/20', glow: 'from-amber-400 to-yellow-400' };
    if (name.includes('Silver')) return { tier: 'Silver', color: 'from-slate-400/20 to-slate-500/20', glow: 'from-slate-300 to-slate-400' };
    return { tier: 'Bronze', color: 'from-orange-500/20 to-amber-700/20', glow: 'from-orange-400 to-amber-600' };
  };

  const { tier, color, glow } = getTierFromName(nft.name);

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${color} rounded-3xl blur opacity-50 group-hover:opacity-100 transition`} />

      {/* Card */}
      <div className="relative h-full bg-black/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-white/20 transition">
        {/* NFT Image */}
        <div className="relative aspect-square overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nft.image}
            alt={nft.name}
            className="relative w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
          {/* Tier badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 bg-black/70 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${glow} bg-clip-text text-transparent`}>
            {tier}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {nft.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[2rem]">
            {nft.description}
          </p>

          {/* Attributes */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {nft.attributes.slice(0, 3).map((attr, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-slate-300"
                >
                  {attr.value}
                </span>
              ))}
            </div>
          )}

          {/* Mint Address & Link */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <code className="text-xs text-slate-500 font-mono">
              {nft.mint.slice(0, 6)}...{nft.mint.slice(-4)}
            </code>
            <a
              href={`https://explorer.solana.com/address/${nft.mint}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Explorer ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}