import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import BN from 'bn.js';
import idl from '../../idl/solemn.json';

// Program ID Solemn di devnet
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || '82H3B7Sf7wEf3nv1u8FTDfgHoRZNzY8poH27RPqcFNCK'
);

// Seed untuk PDA (harus match dengan constants.rs)
export const PROMISE_SEED = Buffer.from('promise');

/**
 * Bikin Anchor program client untuk interact dengan Solemn
 */
export function getSolemnProgram(
  connection: Connection,
  wallet: AnchorWallet
): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  return new Program(idl as Idl, provider);
}

/**
 * Derive Promise PDA dari promiser + deadline
 * Pakai BN.js untuk i64 → bytes (reliable di browser & node)
 */
export function getPromisePDA(
  promiser: PublicKey,
  deadline: number
): [PublicKey, number] {
  // Convert i64 (signed) → 8-byte little-endian buffer pakai BN
  const deadlineBuffer = new BN(deadline).toArrayLike(Buffer, 'le', 8);

  return PublicKey.findProgramAddressSync(
    [PROMISE_SEED, promiser.toBuffer(), deadlineBuffer],
    PROGRAM_ID
  );
}

/**
 * Convert SOL ke lamports (1 SOL = 1,000,000,000 lamports)
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

/**
 * Convert lamports ke SOL (untuk display)
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Status promise (sesuai enum di state.rs)
 */
export enum PromiseStatus {
  Active = 0,
  Approved = 1,
  Rejected = 2,
  TimedOut = 3,
}

/**
 * Type Promise account (untuk TypeScript)
 */
export interface PromiseAccount {
  publicKey: PublicKey;
  promiser: PublicKey;
  judge: PublicKey;
  charity: PublicKey;
  stakeAmount: BN;
  deadline: BN;
  createdAt: BN;
  status: PromiseStatus;
  bump: number;
}

/**
 * Fetch semua promise milik wallet tertentu (sebagai promiser)
 */
export async function fetchPromisesByPromiser(
  program: Program,
  promiser: PublicKey
): Promise<PromiseAccount[]> {
  // @ts-ignore - Anchor types kadang strict, ini aman
  const accounts = await program.account.promise.all([
    {
      memcmp: {
        offset: 8, // skip discriminator (8 bytes)
        bytes: promiser.toBase58(),
      },
    },
  ]);

  return accounts.map((acc: any) => ({
    publicKey: acc.publicKey,
    promiser: acc.account.promiser,
    judge: acc.account.judge,
    charity: acc.account.charity,
    stakeAmount: acc.account.stakeAmount,
    deadline: acc.account.deadline,
    createdAt: acc.account.createdAt,
    status: parseStatusEnum(acc.account.status),
    bump: acc.account.bump,
  }));
}

/**
 * Fetch semua promise di mana wallet ini ditunjuk sebagai judge
 */
export async function fetchPromisesByJudge(
  program: Program,
  judge: PublicKey
): Promise<PromiseAccount[]> {
  // @ts-ignore
  const accounts = await program.account.promise.all([
    {
      memcmp: {
        offset: 8 + 32, // skip discriminator + promiser
        bytes: judge.toBase58(),
      },
    },
  ]);

  return accounts.map((acc: any) => ({
    publicKey: acc.publicKey,
    promiser: acc.account.promiser,
    judge: acc.account.judge,
    charity: acc.account.charity,
    stakeAmount: acc.account.stakeAmount,
    deadline: acc.account.deadline,
    createdAt: acc.account.createdAt,
    status: parseStatusEnum(acc.account.status),
    bump: acc.account.bump,
  }));
}

/**
 * Parse enum status dari Anchor (yang return object kayak {active: {}}, dll)
 */
function parseStatusEnum(status: any): PromiseStatus {
  if (status.active !== undefined) return PromiseStatus.Active;
  if (status.approved !== undefined) return PromiseStatus.Approved;
  if (status.rejected !== undefined) return PromiseStatus.Rejected;
  if (status.timedOut !== undefined) return PromiseStatus.TimedOut;
  return PromiseStatus.Active;
}

/**
 * Format timestamp Unix ke readable date
 */
export function formatDate(unixTimestamp: number | BN): string {
  const ts = typeof unixTimestamp === 'number' ? unixTimestamp : unixTimestamp.toNumber();
  return new Date(ts * 1000).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate time remaining sampai deadline (dalam detik)
 */
export function getTimeRemaining(deadline: number | BN): number {
  const ts = typeof deadline === 'number' ? deadline : deadline.toNumber();
  const now = Math.floor(Date.now() / 1000);
  return ts - now;
}

/**
 * Format countdown ke human readable (e.g. "5d 3h 20m")
 */
export function formatCountdown(secondsRemaining: number): string {
  if (secondsRemaining <= 0) return 'Expired';

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}