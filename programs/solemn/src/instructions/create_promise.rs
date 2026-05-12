use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

use crate::constants::*;
use crate::error::SolemnError;
use crate::state::*;

pub fn handler(
    ctx: Context<CreatePromise>,
    stake_amount: u64,
    deadline: i64,
    judge: Pubkey,
    charity: Pubkey,
) -> Result<()> {
    let clock = Clock::get()?;

    // Validations
    require!(stake_amount >= MIN_STAKE_LAMPORTS, SolemnError::StakeTooLow);
    require!(deadline > clock.unix_timestamp, SolemnError::DeadlineInPast);
    require!(
        deadline - clock.unix_timestamp <= MAX_DEADLINE_DURATION,
        SolemnError::DeadlineTooFar
    );
    require!(
        judge != ctx.accounts.promiser.key(),
        SolemnError::SelfJudgeNotAllowed
    );

    // Initialize promise account
    let promise = &mut ctx.accounts.promise;
    promise.promiser = ctx.accounts.promiser.key();
    promise.judge = judge;
    promise.charity = charity;
    promise.stake_amount = stake_amount;
    promise.deadline = deadline;
    promise.created_at = clock.unix_timestamp;
    promise.status = PromiseStatus::Active;
    promise.bump = ctx.bumps.promise;

    // Transfer SOL: promiser → PDA (escrow) via system_instruction
    let transfer_ix = system_instruction::transfer(
        &ctx.accounts.promiser.key(),
        &promise.key(),
        stake_amount,
    );

    invoke(
        &transfer_ix,
        &[
            ctx.accounts.promiser.to_account_info(),
            promise.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    msg!(
        "Promise created. Stake: {} lamports, Deadline: {}",
        stake_amount,
        deadline
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(stake_amount: u64, deadline: i64)]
pub struct CreatePromise<'info> {
    #[account(
        init,
        payer = promiser,
        space = Promise::LEN,
        seeds = [PROMISE_SEED, promiser.key().as_ref(), &deadline.to_le_bytes()],
        bump
    )]
    pub promise: Account<'info, Promise>,

    #[account(mut)]
    pub promiser: Signer<'info>,

    pub system_program: Program<'info, System>,
}