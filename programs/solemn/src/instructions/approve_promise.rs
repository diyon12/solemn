use anchor_lang::prelude::*;

use crate::error::SolemnError;
use crate::state::*;

pub fn handler(ctx: Context<ApprovePromise>) -> Result<()> {
    let promise = &mut ctx.accounts.promise;

    require!(
        promise.status == PromiseStatus::Active,
        SolemnError::PromiseNotActive
    );

    // Transfer stake dari PDA balik ke promiser
    let stake = promise.stake_amount;
    **promise.to_account_info().try_borrow_mut_lamports()? -= stake;
    **ctx
        .accounts
        .promiser
        .to_account_info()
        .try_borrow_mut_lamports()? += stake;

    promise.status = PromiseStatus::Approved;

    msg!("✅ Promise approved! {} lamports returned to promiser", stake);

    Ok(())
}

#[derive(Accounts)]
pub struct ApprovePromise<'info> {
    #[account(
        mut,
        has_one = promiser,
        has_one = judge
    )]
    pub promise: Account<'info, Promise>,

    /// CHECK: Verified via has_one constraint di Promise
    #[account(mut)]
    pub promiser: UncheckedAccount<'info>,

    pub judge: Signer<'info>,
}