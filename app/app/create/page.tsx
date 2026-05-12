'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { getSolemnProgram, getPromisePDA, solToLamports } from '../lib/anchor';
import { WalletButton } from '../components/WalletButton';

type DeadlineUnit = 'minutes' | 'hours' | 'days';

const UNIT_SECONDS: Record<DeadlineUnit, number> = {
  minutes: 60,
  hours: 3600,
  days: 86400,
};

export default function CreatePromisePage() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [description, setDescription] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [deadlineValue, setDeadlineValue] = useState('5');
  const [deadlineUnit, setDeadlineUnit] = useState<DeadlineUnit>('minutes');
  const [judgeAddress, setJudgeAddress] = useState('');
  const [charityAddress, setCharityAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!publicKey || !anchorWallet) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setTxSignature(null);

    try {
      const stake = parseFloat(stakeAmount);
      const durationValue = parseInt(deadlineValue);

      if (isNaN(stake) || stake < 0.001) {
        throw new Error('Stake minimum 0.001 SOL');
      }
      if (isNaN(durationValue) || durationValue < 1) {
        throw new Error('Durasi minimum 1');
      }
      if (!description.trim()) {
        throw new Error('Deskripsi tidak boleh kosong');
      }

      let judge: PublicKey;
      let charity: PublicKey;

      try {
        judge = new PublicKey(judgeAddress.trim());
      } catch {
        throw new Error('Judge address tidak valid');
      }

      try {
        charity = new PublicKey(charityAddress.trim());
      } catch {
        throw new Error('Charity address tidak valid');
      }

      if (judge.equals(publicKey)) {
        throw new Error('Kamu tidak boleh jadi judge sendiri');
      }

      const program = getSolemnProgram(connection, anchorWallet);
      const stakeLamports = solToLamports(stake);
      const now = Math.floor(Date.now() / 1000);
      const deadline = now + durationValue * UNIT_SECONDS[deadlineUnit];

      const [promisePDA] = getPromisePDA(publicKey, deadline);

      console.log('Creating promise:', {
        promiser: publicKey.toString(),
        judge: judge.toString(),
        charity: charity.toString(),
        stakeLamports,
        deadline,
        promisePDA: promisePDA.toString(),
      });

      const tx = await program.methods
        .createPromise(
          new BN(stakeLamports),
          new BN(deadline),
          judge,
          charity
        )
        .accounts({
          promise: promisePDA,
          promiser: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Transaction sent:', tx);
      setTxSignature(tx);

      setTimeout(() => {
        router.push('/my-promises');
      }, 5000);

    } catch (err: any) {
      console.error('Error creating promise:', err);
      const message = err?.message || 'Transaction failed';
      if (message.includes('User rejected')) {
        setError('Transaksi dibatalkan. Coba lagi kalau mau.');
      } else if (message.includes('no record of a prior credit') || message.includes('Insufficient funds')) {
        setError('Wallet tidak punya cukup SOL. Airdrop dulu di devnet faucet.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const previewDeadline = (() => {
    const val = parseInt(deadlineValue);
    if (isNaN(val) || val < 1) return null;
    const futureMs = Date.now() + val * UNIT_SECONDS[deadlineUnit] * 1000;
    return new Date(futureMs).toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  if (!connected) {
    return <ConnectWalletScreen />;
  }

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

      <Nav />

      <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition">
          <span>←</span> Back to home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 mb-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 uppercase tracking-wider">
            📝 New Commitment
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            Make a Promise
          </h1>
          <p className="text-slate-400 text-lg">
            Define your commitment. Stake SOL. Stay accountable on-chain.
          </p>
        </div>

        {/* Form Card */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />
          <div className="relative bg-black/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-6">

            {/* Description */}
            <FormField
              label="What do you promise?"
              required
              hint={`${description.length}/280 characters`}
            >
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Saya akan belajar 2 jam setiap hari selama seminggu"
                maxLength={280}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:bg-white/[0.07] outline-none resize-none transition"
              />
            </FormField>

            {/* Stake & Deadline Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Stake (SOL)" required hint="Min 0.001 SOL">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full px-4 py-3 pr-16 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:bg-white/[0.07] outline-none transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono uppercase tracking-wider">
                    SOL
                  </span>
                </div>
              </FormField>

              <FormField
                label="Deadline"
                required
                hint={
                  deadlineUnit === 'minutes' ? '⚡ Great for demo & testing' :
                  deadlineUnit === 'hours' ? '⏰ Short-term commitment' :
                  '🎯 Serious commitment'
                }
              >
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={deadlineValue}
                    onChange={(e) => setDeadlineValue(e.target.value)}
                    className="flex-1 w-0 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:bg-white/[0.07] outline-none transition"
                  />
                  <select
                    value={deadlineUnit}
                    onChange={(e) => setDeadlineUnit(e.target.value as DeadlineUnit)}
                    className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 outline-none cursor-pointer transition"
                  >
                    <option value="minutes" className="bg-slate-900">Min</option>
                    <option value="hours" className="bg-slate-900">Hours</option>
                    <option value="days" className="bg-slate-900">Days</option>
                  </select>
                </div>
              </FormField>
            </div>

            {/* Deadline Preview */}
            {previewDeadline && (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-50" />
                <div className="relative bg-indigo-500/5 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <p className="text-xs text-indigo-300/70 mb-1 uppercase tracking-wider">Deadline will be</p>
                      <p className="text-sm text-indigo-200 font-medium">
                        {previewDeadline}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Judge Address */}
            <FormField
              label="Judge Wallet Address"
              required
              hint="Address Solana wallet teman yang akan jadi saksi"
            >
              <input
                type="text"
                value={judgeAddress}
                onChange={(e) => setJudgeAddress(e.target.value)}
                placeholder="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:bg-white/[0.07] outline-none font-mono text-sm transition"
              />
            </FormField>

            {/* Charity Address */}
            <FormField
              label="Charity Wallet"
              required
              hint="Tujuan dana kalau kamu gagal — bisa pakai address Phantom kedua untuk testing"
            >
              <input
                type="text"
                value={charityAddress}
                onChange={(e) => setCharityAddress(e.target.value)}
                placeholder="Another wallet address"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:bg-white/[0.07] outline-none font-mono text-sm transition"
              />
            </FormField>

            {/* Error Display */}
            {error && (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-rose-500/30 rounded-xl blur opacity-50" />
                <div className="relative bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-rose-300 text-sm flex items-start gap-2">
                    <span>❌</span>
                    <span>{error}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Success Display */}
            {txSignature && (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-xl blur opacity-75" />
                <div className="relative bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">🎉</div>
                    <div>
                      <p className="text-emerald-300 font-semibold mb-1">
                        Promise Created Successfully!
                      </p>
                      <p className="text-emerald-200/70 text-xs">
                        Your stake is now locked in a smart contract on Solana.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-100 transition"
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                  <p className="text-slate-400 text-xs mt-3 flex items-center gap-1">
                    <span className="animate-pulse">●</span> Redirecting to your promises in 5 seconds...
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !!txSignature}
              className="group relative w-full overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition" />
              <div className="relative px-8 py-4 font-bold text-lg flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Creating Promise...</span>
                  </>
                ) : txSignature ? (
                  <>
                    <span>✓</span>
                    <span>Promise Locked</span>
                  </>
                ) : (
                  <>
                    <span>Stake & Commit</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </div>
            </button>

            {/* Disclaimer */}
            <p className="text-xs text-slate-500 text-center pt-2">
              💡 By staking, you agree that your SOL will be locked until judge decides or deadline passes.
            </p>
          </div>
        </div>
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
          Connect your wallet to make a promise on Solana.
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

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-slate-200">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
          {hint}
        </p>
      )}
    </div>
  );
}