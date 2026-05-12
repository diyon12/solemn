use anchor_lang::prelude::*;

use crate::error::SolemnError;
use crate::state::*;

pub fn handler(ctx: Context<ClaimTimeout>) -> Result<()> {
    let promise = &mut ctx.accounts.promise;
    let clock = Clock::get()?;

    require!(
        promise.status == PromiseStatus::Active,
        SolemnError::PromiseNotActive
    );
    require!(
        clock.unix_timestamp > promise.deadline,
        SolemnError::DeadlineNotReached
    );

    // Default behavior on timeout: stake ke charity
    let stake = promise.stake_amount;
    **promise.to_account_info().try_borrow_mut_lamports()? -= stake;
    **ctx
        .accounts
        .charity
        .to_account_info()
        .try_borrow_mut_lamports()? += stake;

    promise.status = PromiseStatus::TimedOut;

    msg!("⏰ Promise timed out. {} lamports sent to charity", stake);

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimTimeout<'info> {
    #[account(
        mut,
        has_one = charity
    )]
    pub promise: Account<'info, Promise>,

    /// CHECK: Verified via has_one constraint
    #[account(mut)]
    pub charity: UncheckedAccount<'info>,

    /// Anyone can call ini — biasanya promiser sendiri atau bot
    pub caller: Signer<'info>,
}