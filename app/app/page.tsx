'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from './components/WalletButton';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative min-h-screen bg-[#0a0a14] text-white overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Floating particles */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/40 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image
              src="/logo/solemn-logo.png"
              alt="Solemn"
              width={48}
              height={48}
              className="rounded-xl transition-transform group-hover:scale-110"
              priority
            />
            <div className="absolute inset-0 bg-indigo-500/30 rounded-xl blur-xl group-hover:blur-2xl transition-all -z-10" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            Solemn
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/diyon12/solemn"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.467-2.38 1.236-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
          <WalletButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16 md:py-28">
        <div className="max-w-7xl mx-auto">
          {/* Built on Solana Badge */}
          <div className="flex justify-center mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-50 group-hover:opacity-75 transition" />
              <div className="relative flex items-center gap-2 px-5 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-slate-300">Live on</span>
                <span className="font-semibold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  Solana Devnet
                </span>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-center text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="block bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Promises with
            </span>
            <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Weight.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-center text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stake SOL behind your goals. Smart contracts hold you accountable.
            <br className="hidden md:block" />
            Keep them — earn an Achievement NFT. Break them — support charity.
          </p>

          {/* Connection Status / CTA */}
          {connected ? (
            <div className="flex flex-col items-center gap-6 mb-12">
              {/* Connected Badge */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition" />
                <div className="relative flex items-center gap-3 px-6 py-3 bg-black/60 backdrop-blur-xl border border-emerald-500/30 rounded-2xl">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-emerald-300/70 uppercase tracking-wider">Wallet Connected</div>
                    <div className="font-mono text-sm text-emerald-300">
                      {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-6)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/create"
                  className="group relative px-8 py-4 rounded-xl font-semibold overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-100 transition" />
                  <span className="relative flex items-center gap-2">
                    <span>Make a Promise</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Link>

                <Link
                  href="/my-promises"
                  className="group relative px-8 py-4 rounded-xl font-semibold border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition"
                >
                  <span className="flex items-center gap-2">
                    📜 My Promises
                  </span>
                </Link>

                <Link
                  href="/judge"
                  className="group relative px-8 py-4 rounded-xl font-semibold border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition"
                >
                  <span className="flex items-center gap-2">
                    ⚖️ Judge Dashboard
                  </span>
                </Link>

                <Link
                  href="/achievements"
                  className="group relative px-8 py-4 rounded-xl font-semibold border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 backdrop-blur-xl transition text-amber-300"
                >
                  <span className="flex items-center gap-2">
                    🏆 Achievements
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-12">
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 animate-pulse" />
                <div className="relative px-6 py-4 bg-black/60 backdrop-blur-xl border border-amber-500/30 rounded-2xl">
                  <p className="text-amber-300 text-sm flex items-center gap-2">
                    <span className="text-xl">👆</span>
                    Connect your wallet above to get started
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mt-16">
            {[
              { label: 'Network', value: 'Devnet', icon: '🌐' },
              { label: 'Stake (min)', value: '0.001 SOL', icon: '💎' },
              { label: 'NFT Tiers', value: '4 Levels', icon: '🏆' },
              { label: 'Fully', value: 'On-Chain', icon: '⛓️' },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/10 transition"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-300">
              ✨ How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Three steps to keep your word
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: '01',
                icon: '📝',
                title: 'Make Your Promise',
                description: 'Define your commitment, stake SOL, set a deadline, and pick a trusted judge.',
                gradient: 'from-indigo-500/20 to-indigo-600/5',
                border: 'indigo',
              },
              {
                step: '02',
                icon: '🎯',
                title: 'Stay Committed',
                description: 'Your stake is locked in a smart contract. No way back unless you keep your word.',
                gradient: 'from-purple-500/20 to-purple-600/5',
                border: 'purple',
              },
              {
                step: '03',
                icon: '🏆',
                title: 'Earn Your Proof',
                description: 'Succeed → stake back + Achievement NFT. Fail → stake goes to charity.',
                gradient: 'from-pink-500/20 to-pink-600/5',
                border: 'pink',
              },
            ].map((item, i) => (
              <div key={i} className="group relative">
                {/* Glow effect on hover */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${item.gradient} rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500`} />

                {/* Card */}
                <div className="relative h-full p-8 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-white/20 transition">
                  {/* Step Number */}
                  <div className={`text-sm font-mono text-${item.border}-400/60 mb-4`}>
                    /{item.step}
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-3 text-white">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 mb-4 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300">
                💎 Why Solemn?
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Built for the
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  decentralized future.
                </span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                92% of resolutions fail because there are no real consequences.
                Solemn changes that with blockchain-backed accountability.
              </p>

              <div className="space-y-4">
                {[
                  { icon: '⚡', text: 'Instant settlement on Solana — fees under $0.01' },
                  { icon: '🔒', text: 'Trustless escrow — no middleman, no fees' },
                  { icon: '🎨', text: 'Tier-based NFTs (Bronze → Diamond) for achievements' },
                  { icon: '🌍', text: 'Fully on-chain — verifiable, permanent, censorship-resistant' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                      {item.icon}
                    </div>
                    <p className="text-slate-300 pt-2">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock NFT Card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 border border-amber-500/30 flex items-center justify-center mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-radial from-amber-400/20 to-transparent" />
                  <div className="relative text-center">
                    <div className="text-8xl mb-4">🏆</div>
                    <div className="text-2xl font-bold text-amber-300">Promise Kept</div>
                    <div className="text-sm text-amber-200/60 font-mono mt-2">#0001</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Tier</span>
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-semibold">
                      GOLD
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Stake</span>
                    <span className="text-white font-mono">0.5 SOL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Network</span>
                    <span className="text-white">Solana</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
            <div className="relative p-12 md:p-16 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-xl text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Ready to put
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  skin in the game?
                </span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Join the on-chain commitment revolution. Make your first promise in less than 60 seconds.
              </p>
              {connected ? (
                <Link
                  href="/create"
                  className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition" />
                  <span className="relative">Make Your First Promise</span>
                  <span className="relative group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ) : (
                <p className="text-amber-300 text-sm">
                  ↑ Connect your wallet to start
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/solemn-logo.png"
                alt="Solemn"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <div className="font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  Solemn
                </div>
                <div className="text-xs text-slate-500">
                  Built on Solana · Hackathon 2026
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a
                href="https://explorer.solana.com/address/82H3B7Sf7wEf3nv1u8FTDfgHoRZNzY8poH27RPqcFNCK?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                View Program ↗
              </a>
              <a
                href="https://github.com/diyon12/solemn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS untuk animasi */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-100px) translateX(20px); opacity: 0.6; }
          90% { opacity: 1; }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </main>
  );
}