use anchor_lang::prelude::*;

use crate::error::SolemnError;
use crate::state::*;

pub fn handler(ctx: Context<RejectPromise>) -> Result<()> {
    let promise = &mut ctx.accounts.promise;

    require!(
        promise.status == PromiseStatus::Active,
        SolemnError::PromiseNotActive
    );

    // Transfer stake dari PDA ke charity
    let stake = promise.stake_amount;
    **promise.to_account_info().try_borrow_mut_lamports()? -= stake;
    **ctx
        .accounts
        .charity
        .to_account_info()
        .try_borrow_mut_lamports()? += stake;

    promise.status = PromiseStatus::Rejected;

    msg!("❌ Promise rejected. {} lamports sent to charity", stake);

    Ok(())
}

#[derive(Accounts)]
pub struct RejectPromise<'info> {
    #[account(
        mut,
        has_one = judge,
        has_one = charity
    )]
    pub promise: Account<'info, Promise>,

    /// CHECK: Verified via has_one constraint
    #[account(mut)]
    pub charity: UncheckedAccount<'info>,

    pub judge: Signer<'info>,
}