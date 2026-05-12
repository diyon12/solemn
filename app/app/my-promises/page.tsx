'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../components/WalletButton';
import {
  getSolemnProgram,
  fetchPromisesByPromiser,
  PromiseAccount,
  PromiseStatus,
  lamportsToSol,
  formatDate,
  getTimeRemaining,
  formatCountdown,
} from '../lib/anchor';

export default function MyPromisesPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [promises, setPromises] = useState<PromiseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadPromises() {
      if (!publicKey || !anchorWallet) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const program = getSolemnProgram(connection, anchorWallet);
        const myPromises = await fetchPromisesByPromiser(program, publicKey);
        myPromises.sort((a, b) => b.createdAt.toNumber() - a.createdAt.toNumber());
        setPromises(myPromises);
      } catch (err: any) {
        console.error('Error fetching promises:', err);
        setError(err.message || 'Failed to load promises');
      } finally {
        setLoading(false);
      }
    }

    loadPromises();
  }, [publicKey, anchorWallet, connection]);

  if (!connected) {
    return <ConnectWalletScreen />;
  }

  const activePromises = promises.filter((p) => p.status === PromiseStatus.Active);
  const completedPromises = promises.filter((p) => p.status !== PromiseStatus.Active);

  return (
    <main className="relative min-h-screen bg-[#0a0a14] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Nav */}
      <Nav />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition">
          <span>←</span> Back to home
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="inline-block px-3 py-1 mb-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 uppercase tracking-wider">
              📜 Promises Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              My Promises
            </h1>
            <p className="text-slate-400">
              {loading ? 'Loading from blockchain...' : `${promises.length} promise${promises.length !== 1 ? 's' : ''} on-chain`}
            </p>
          </div>

          <Link
            href="/create"
            className="group relative px-6 py-3 rounded-xl font-semibold overflow-hidden whitespace-nowrap"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-100 transition" />
            <span className="relative flex items-center gap-2">
              <span className="text-xl">+</span> New Promise
            </span>
          </Link>
        </div>

        {/* Stats Cards (only if has promises) */}
        {!loading && promises.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <StatsCard
              icon="🚦"
              label="Active"
              value={activePromises.length}
              color="indigo"
            />
            <StatsCard
              icon="✅"
              label="Approved"
              value={promises.filter(p => p.status === PromiseStatus.Approved).length}
              color="emerald"
            />
            <StatsCard
              icon="❌"
              label="Rejected"
              value={promises.filter(p => p.status === PromiseStatus.Rejected).length}
              color="rose"
            />
            <StatsCard
              icon="⏰"
              label="Timed Out"
              value={promises.filter(p => p.status === PromiseStatus.TimedOut).length}
              color="slate"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-black/40 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-indigo-400 border-t-transparent mb-4" />
              <p className="text-slate-400">Fetching your promises from Solana...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="relative">
            <div className="absolute -inset-1 bg-rose-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-rose-500/5 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-xl">
              <p className="text-rose-300">❌ {error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && promises.length === 0 && (
          <div className="relative">
            <div className="absolute -inset-1 bg-indigo-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-black/40 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
              <div className="text-7xl mb-6">📝</div>
              <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                No promises yet
              </h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                You haven&apos;t made any promises yet. Make your first commitment and put real skin in the game.
              </p>
              <Link
                href="/create"
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-100 transition" />
                <span className="relative">Make Your First Promise</span>
                <span className="relative group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Active Section */}
        {!loading && activePromises.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Active ({activePromises.length})
            </h2>
            <div className="space-y-4">
              {activePromises.map((promise) => (
                <PromiseCard key={promise.publicKey.toString()} promise={promise} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {!loading && completedPromises.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-300">
              History ({completedPromises.length})
            </h2>
            <div className="space-y-4">
              {completedPromises.map((promise) => (
                <PromiseCard key={promise.publicKey.toString()} promise={promise} />
              ))}
            </div>
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
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center max-w-md px-8">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Connect Wallet First
        </h1>
        <p className="text-slate-400 mb-8">
          Connect your wallet to view your promises on-chain.
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

function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
    slate: 'from-slate-500/20 to-slate-600/5 border-slate-500/20',
  };

  return (
    <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} border backdrop-blur-sm hover:scale-105 transition`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function PromiseCard({ promise }: { promise: PromiseAccount }) {
  const stake = lamportsToSol(promise.stakeAmount.toNumber());
  const timeRemaining = getTimeRemaining(promise.deadline);
  const isActive = promise.status === PromiseStatus.Active;
  const isExpired = isActive && timeRemaining <= 0;

  const statusConfig = {
    [PromiseStatus.Active]: {
      label: isExpired ? '⏰ Expired (claim timeout)' : '🚦 Active',
      gradient: isExpired ? 'from-amber-500/20 to-amber-600/5' : 'from-indigo-500/20 to-indigo-600/5',
      border: isExpired ? 'border-amber-500/30' : 'border-indigo-500/30',
      textColor: isExpired ? 'text-amber-300' : 'text-indigo-300',
    },
    [PromiseStatus.Approved]: {
      label: '✅ Approved',
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      border: 'border-emerald-500/30',
      textColor: 'text-emerald-300',
    },
    [PromiseStatus.Rejected]: {
      label: '❌ Rejected',
      gradient: 'from-rose-500/20 to-rose-600/5',
      border: 'border-rose-500/30',
      textColor: 'text-rose-300',
    },
    [PromiseStatus.TimedOut]: {
      label: '⏰ Timed Out',
      gradient: 'from-slate-500/20 to-slate-600/5',
      border: 'border-slate-500/30',
      textColor: 'text-slate-300',
    },
  };

  const config = statusConfig[promise.status];

  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${config.gradient} rounded-2xl blur opacity-50 group-hover:opacity-100 transition`} />
      <div className={`relative bg-black/60 border ${config.border} rounded-2xl p-6 backdrop-blur-xl`}>
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <div className={`inline-block px-3 py-1 mb-3 bg-black/40 border ${config.border} rounded-full ${config.textColor} text-xs font-medium`}>
              {config.label}
            </div>
            <h3 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {stake} SOL
            </h3>
            <p className="text-slate-400 text-sm">
              Created {formatDate(promise.createdAt)}
            </p>
          </div>

          {isActive && !isExpired && (
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Time left</div>
              <div className="text-2xl font-mono font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                {formatCountdown(timeRemaining)}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <InfoField label="Judge" value={`${promise.judge.toString().slice(0, 8)}...${promise.judge.toString().slice(-8)}`} />
          <InfoField label="Charity" value={`${promise.charity.toString().slice(0, 8)}...${promise.charity.toString().slice(-8)}`} />
          <InfoField label="Deadline" value={formatDate(promise.deadline)} />
          <InfoField
            label="Promise PDA"
            value={
              <a
                href={`https://explorer.solana.com/address/${promise.publicKey.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-indigo-400 hover:text-indigo-300 underline break-all"
              >
                {promise.publicKey.toString().slice(0, 8)}...{promise.publicKey.toString().slice(-8)} ↗
              </a>
            }
          />
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-slate-300 font-mono text-xs break-all">{value}</div>
    </div>
  );
}