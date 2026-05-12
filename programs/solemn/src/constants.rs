use anchor_lang::prelude::*;

#[constant]
pub const PROMISE_SEED: &[u8] = b"promise";

/// Minimum stake: 0.001 SOL (mencegah spam)
pub const MIN_STAKE_LAMPORTS: u64 = 1_000_000;

/// Maximum deadline: 1 tahun dari sekarang (mencegah promise selama-lamanya)
pub const MAX_DEADLINE_DURATION: i64 = 365 * 24 * 60 * 60;