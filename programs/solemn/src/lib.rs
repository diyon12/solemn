pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("82H3B7Sf7wEf3nv1u8FTDfgHoRZNzY8poH27RPqcFNCK");

#[program]
pub mod solemn {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn create_promise(
        ctx: Context<CreatePromise>,
        stake_amount: u64,
        deadline: i64,
        judge: Pubkey,
        charity: Pubkey,
    ) -> Result<()> {
        create_promise::handler(ctx, stake_amount, deadline, judge, charity)
    }

    pub fn approve_promise(ctx: Context<ApprovePromise>) -> Result<()> {
        approve_promise::handler(ctx)
    }

    pub fn reject_promise(ctx: Context<RejectPromise>) -> Result<()> {
        reject_promise::handler(ctx)
    }

    pub fn claim_timeout(ctx: Context<ClaimTimeout>) -> Result<()> {
        claim_timeout::handler(ctx)
    }
}