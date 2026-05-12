'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletButton } from '../components/WalletButton';
import {
  getSolemnProgram,
  fetchPromisesByJudge,
  PromiseAccount,
  PromiseStatus,
  lamportsToSol,
  formatDate,
  getTimeRemaining,
  formatCountdown,
} from '../lib/anchor';
import { getUmi, mintAchievementNFT } from '../lib/nft';

const MIN_BALANCE_FOR_TX = 0.001;

export default function JudgePage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const anchorWallet = useAnchorWallet();

  const [promises, setPromises] = useState<PromiseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
    txSig?: string;
    nftMint?: string;
    showAirdrop?: boolean;
  } | null>(null);

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const checkBalance = useCallback(async () => {
    if (!publicKey) return;
    setBalanceLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, [publicKey, connection]);

  const loadPromises = useCallback(async () => {
    if (!publicKey || !anchorWallet) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const program = getSolemnProgram(connection, anchorWallet);
      const judgedPromises = await fetchPromisesByJudge(program, publicKey);
      judgedPromises.sort((a, b) => b.createdAt.toNumber() - a.createdAt.toNumber());
      setPromises(judgedPromises);
    } catch (err: any) {
      console.error('Error fetching promises:', err);
      setError(err.message || 'Failed to load promises');
    } finally {
      setLoading(false);
    }
  }, [publicKey, anchorWallet, connection]);

  useEffect(() => {
    loadPromises();
    checkBalance();
  }, [loadPromises, checkBalance]);

  const parseErrorMessage = (err: any): { text: string; showAirdrop: boolean } => {
    const message = err?.message || String(err);
    if (message.includes('User rejected') || message.includes('user rejected') || message.includes('WalletConnectionError')) {
      return { text: 'Transaksi dibatalkan. Coba lagi kalau mau.', showAirdrop: false };
    }
    if (message.includes('no record of a prior credit') || message.includes('Insufficient funds')) {
      return { text: 'Wallet tidak punya cukup SOL. Airdrop dulu di devnet faucet.', showAirdrop: true };
    }
    if (message.includes('blockhash not found') || message.includes('expired')) {
      return { text: 'Transaksi expired. Coba lagi.', showAirdrop: false };
    }
    if (message.includes('UnauthorizedJudge')) {
      return { text: 'Hanya judge yang ditunjuk yang bisa approve/reject.', showAirdrop: false };
    }
    if (message.includes('PromiseNotActive')) {
      return { text: 'Promise sudah tidak active.', showAirdrop: false };
    }
    return { text: message.length > 200 ? `${message.slice(0, 200)}...` : message, showAirdrop: false };
  };

  const handleApprove = async (promise: PromiseAccount) => {
    if (!publicKey || !anchorWallet) return;
    if (balance !== null && balance < MIN_BALANCE_FOR_TX + 0.01) {
      setActionMessage({ type: 'warning', text: 'Wallet butuh ~0.01 SOL untuk approve + mint NFT. Airdrop dulu.', showAirdrop: true });
      return;
    }
    setActionLoading(promise.publicKey.toString());
    setActionMessage(null);
    try {
      setActionMessage({ type: 'success', text: '⏳ Step 1/2: Approving promise on Solana...' });
      const program = getSolemnProgram(connection, anchorWallet);
      const approveTx = await program.methods.approvePromise().accounts({
        promise: promise.publicKey,
        promiser: promise.promiser,
        judge: publicKey,
      }).rpc();
      console.log('Approve tx:', approveTx);

      setActionMessage({ type: 'success', text: '⏳ Step 2/2: Minting Achievement NFT...' });
      const completedApproved = promises.filter(p => p.status === PromiseStatus.Approved).length;
      const achievementNumber = completedApproved + 1;
      const umi = getUmi(connection, wallet);
      const stakeSol = lamportsToSol(promise.stakeAmount.toNumber());

      const nftResult = await mintAchievementNFT({
        umi,
        promiserAddress: promise.promiser,
        promiseDescription: `Achievement #${achievementNumber}`,
        stakeAmount: stakeSol,
        achievementNumber,
        approvedAt: Math.floor(Date.now() / 1000),
        judgeAddress: publicKey.toString(),
      });

      setActionMessage({
        type: 'success',
        text: `✅ Promise approved & ${nftResult.tier} NFT minted! Stake (${stakeSol} SOL) returned + Achievement NFT delivered.`,
        txSig: nftResult.signature,
        nftMint: nftResult.mintAddress,
      });
      await loadPromises();
      await checkBalance();
    } catch (err: any) {
      console.error('Approve/Mint error:', err);
      const parsed = parseErrorMessage(err);
      setActionMessage({ type: 'error', text: parsed.text, showAirdrop: parsed.showAirdrop });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (promise: PromiseAccount) => {
    if (!publicKey || !anchorWallet) return;
    if (balance !== null && balance < MIN_BALANCE_FOR_TX) {
      setActionMessage({ type: 'warning', text: 'Wallet tidak punya cukup SOL untuk bayar fee.', showAirdrop: true });
      return;
    }
    const confirmed = window.confirm('Yakin reject promise ini? Stake akan masuk ke charity dan TIDAK BISA dibatalkan.');
    if (!confirmed) return;
    setActionLoading(promise.publicKey.toString());
    setActionMessage(null);
    try {
      const program = getSolemnProgram(connection, anchorWallet);
      const tx = await program.methods.rejectPromise().accounts({
        promise: promise.publicKey,
        charity: promise.charity,
        judge: publicKey,
      }).rpc();
      setActionMessage({
        type: 'success',
        text: '❌ Promise rejected. Stake sent to charity.',
        txSig: tx,
      });
      await loadPromises();
      await checkBalance();
    } catch (err: any) {
      console.error('Reject error:', err);
      const parsed = parseErrorMessage(err);
      setActionMessage({ type: 'error', text: parsed.text, showAirdrop: parsed.showAirdrop });
    } finally {
      setActionLoading(null);
    }
  };

  if (!connected) {
    return <ConnectWalletScreen />;
  }

  const activePromises = promises.filter((p) => p.status === PromiseStatus.Active);
  const completedPromises = promises.filter((p) => p.status !== PromiseStatus.Active);
  const hasInsufficientBalance = balance !== null && balance < MIN_BALANCE_FOR_TX;

  return (
    <main className="relative min-h-screen bg-[#0a0a14] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <Nav />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition">
          <span>←</span> Back to home
        </Link>

        {/* Header with Balance */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
          <div>
            <div className="inline-block px-3 py-1 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-300 uppercase tracking-wider">
              ⚖️ Judge Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-amber-200 to-yellow-300 bg-clip-text text-transparent">
              Judge Dashboard
            </h1>
            <p className="text-slate-400">
              Verify commitments and decide their fate.
            </p>
          </div>

          {balance !== null && (
            <div className="group relative">
              <div className={`absolute -inset-0.5 rounded-2xl blur opacity-50 ${
                hasInsufficientBalance ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <div className={`relative px-5 py-3 bg-black/60 border rounded-2xl backdrop-blur-xl ${
                hasInsufficientBalance ? 'border-amber-500/30' : 'border-emerald-500/30'
              }`}>
                <div className={`text-xs uppercase tracking-wider mb-0.5 ${
                  hasInsufficientBalance ? 'text-amber-400' : 'text-emerald-400'
                }`}>Your Balance</div>
                <div className={`font-mono text-lg font-bold ${
                  hasInsufficientBalance ? 'text-amber-300' : 'text-emerald-300'
                }`}>
                  {balance.toFixed(4)} SOL
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Insufficient Balance Banner */}
        {hasInsufficientBalance && (
          <div className="relative mb-8">
            <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-amber-500/5 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-200 mb-2">
                    Insufficient SOL Balance
                  </h3>
                  <p className="text-amber-100/70 text-sm mb-4">
                    Approve + mint NFT needs ~0.01 SOL for fees. Your wallet has {balance?.toFixed(6)} SOL.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://faucet.helius.dev/?address=${publicKey?.toString()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-100 text-sm font-medium transition"
                    >
                      🚰 Helius Faucet ↗
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publicKey?.toString() || '');
                        alert('✓ Wallet address copied!');
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition"
                    >
                      📋 Copy Address
                    </button>
                    <button
                      onClick={checkBalance}
                      disabled={balanceLoading}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition"
                    >
                      {balanceLoading ? '⏳' : '🔄'} Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Message */}
        {actionMessage && (
          <ActionMessageBanner
            message={actionMessage}
            onClose={() => setActionMessage(null)}
            onRefreshBalance={checkBalance}
            publicKey={publicKey?.toString()}
          />
        )}

        {/* Loading */}
        {loading && (
          <LoadingCard message="Fetching assigned promises..." />
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
        {!loading && !error && promises.length === 0 && (
          <div className="relative">
            <div className="absolute -inset-1 bg-amber-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-black/40 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
              <div className="text-7xl mb-6">⚖️</div>
              <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                No promises assigned
              </h3>
              <p className="text-slate-400 mb-4 max-w-md mx-auto">
                Belum ada yang menunjukmu sebagai judge. Share your wallet address:
              </p>
              <code className="inline-block px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-amber-300 text-xs font-mono break-all">
                {publicKey?.toString()}
              </code>
            </div>
          </div>
        )}

        {/* Active (need action) */}
        {activePromises.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="bg-gradient-to-r from-amber-200 to-yellow-300 bg-clip-text text-transparent">
                Awaiting Your Decision ({activePromises.length})
              </span>
            </h2>
            <div className="space-y-4">
              {activePromises.map((promise) => (
                <JudgePromiseCard
                  key={promise.publicKey.toString()}
                  promise={promise}
                  onApprove={() => handleApprove(promise)}
                  onReject={() => handleReject(promise)}
                  isProcessing={actionLoading === promise.publicKey.toString()}
                  disabled={hasInsufficientBalance}
                />
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {completedPromises.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-300">
              History ({completedPromises.length})
            </h2>
            <div className="space-y-4">
              {completedPromises.map((promise) => (
                <JudgePromiseCard
                  key={promise.publicKey.toString()}
                  promise={promise}
                  onApprove={() => {}}
                  onReject={() => {}}
                  isProcessing={false}
                  disabled={false}
                  readonly
                />
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
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative z-10 text-center max-w-md px-8">
        <div className="text-6xl mb-6">⚖️</div>
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
          Judge Dashboard
        </h1>
        <p className="text-slate-400 mb-8">
          Connect the wallet that&apos;s designated as judge to verify promises.
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

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-indigo-500/20 rounded-3xl blur-xl" />
      <div className="relative bg-black/40 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-indigo-400 border-t-transparent mb-4" />
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  );
}

function ActionMessageBanner({
  message,
  onClose,
  onRefreshBalance,
  publicKey,
}: {
  message: { type: 'success' | 'error' | 'warning'; text: string; txSig?: string; nftMint?: string; showAirdrop?: boolean };
  onClose: () => void;
  onRefreshBalance: () => void;
  publicKey?: string;
}) {
  const config = {
    success: {
      gradient: 'from-emerald-500/20 to-cyan-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
    },
    error: {
      gradient: 'from-rose-500/20 to-red-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-300',
    },
    warning: {
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
    },
  }[message.type];

  return (
    <div className="relative mb-8">
      <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-2xl blur-xl`} />
      <div className={`relative bg-black/60 border ${config.border} rounded-2xl p-5 backdrop-blur-xl`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className={config.text}>{message.text}</p>
            {message.txSig && (
              <a
                href={`https://explorer.solana.com/tx/${message.txSig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs underline hover:opacity-80 mt-2 mr-3 opacity-90"
              >
                View Transaction ↗
              </a>
            )}
            {message.nftMint && (
              <a
                href={`https://explorer.solana.com/address/${message.nftMint}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs underline hover:opacity-80 mt-2 opacity-90"
              >
                🏆 View NFT ↗
              </a>
            )}
            {message.showAirdrop && (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`https://faucet.helius.dev/?address=${publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-amber-100 text-xs font-medium transition"
                >
                  🚰 Faucet
                </a>
                <button
                  onClick={onRefreshBalance}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white text-xs font-medium transition"
                >
                  🔄 Refresh
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function JudgePromiseCard({
  promise,
  onApprove,
  onReject,
  isProcessing,
  disabled,
  readonly = false,
}: {
  promise: PromiseAccount;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
  disabled: boolean;
  readonly?: boolean;
}) {
  const stake = lamportsToSol(promise.stakeAmount.toNumber());
  const timeRemaining = getTimeRemaining(promise.deadline);
  const isActive = promise.status === PromiseStatus.Active;
  const isExpired = isActive && timeRemaining <= 0;

  const statusConfig = {
    [PromiseStatus.Active]: {
      label: isExpired ? '⏰ Expired' : '🚦 Active',
      gradient: isExpired ? 'from-amber-500/20 to-amber-600/5' : 'from-amber-500/20 to-yellow-500/5',
      border: isExpired ? 'border-amber-500/30' : 'border-amber-500/40',
      textColor: 'text-amber-300',
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
              <div className="text-2xl font-mono font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
                {formatCountdown(timeRemaining)}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-sm mb-5">
          <InfoField
            label="Promiser"
            value={
              <a
                href={`https://explorer.solana.com/address/${promise.promiser.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-300 transition"
              >
                {promise.promiser.toString().slice(0, 8)}...{promise.promiser.toString().slice(-8)} ↗
              </a>
            }
          />
          <InfoField
            label="Charity"
            value={`${promise.charity.toString().slice(0, 8)}...${promise.charity.toString().slice(-8)}`}
          />
          <InfoField label="Deadline" value={formatDate(promise.deadline)} />
          <InfoField
            label="Promise PDA"
            value={
              <a
                href={`https://explorer.solana.com/address/${promise.publicKey.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                View on Explorer ↗
              </a>
            }
          />
        </div>

        {/* Action Buttons */}
        {!readonly && isActive && (
          <div className="pt-4 border-t border-white/5">
            {disabled && (
              <p className="text-xs text-amber-300/80 mb-3 text-center">
                💡 Airdrop SOL to your wallet first before approve/reject
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onApprove}
                disabled={isProcessing || disabled}
                className="group/btn flex-1 relative overflow-hidden rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-emerald-600 opacity-0 group-hover/btn:opacity-100 transition" />
                <div className="relative px-6 py-3 font-semibold">
                  {isProcessing ? 'Processing...' : '✅ Approve + Mint NFT'}
                </div>
              </button>
              <button
                onClick={onReject}
                disabled={isProcessing || disabled}
                className="group/btn flex-1 relative overflow-hidden rounded-xl border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <div className="px-6 py-3 font-semibold text-rose-300">
                  {isProcessing ? 'Processing...' : '❌ Reject'}
                </div>
              </button>
            </div>
          </div>
        )}
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