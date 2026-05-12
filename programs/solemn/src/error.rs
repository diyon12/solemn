use anchor_lang::prelude::*;

#[error_code]
pub enum SolemnError {
    #[msg("Stake amount must be at least 0.001 SOL")]
    StakeTooLow,

    #[msg("Deadline must be in the future")]
    DeadlineInPast,

    #[msg("Deadline cannot be more than 1 year away")]
    DeadlineTooFar,

    #[msg("Only the assigned judge can perform this action")]
    UnauthorizedJudge,

    #[msg("Promise is not in active state")]
    PromiseNotActive,

    #[msg("Deadline has not been reached yet")]
    DeadlineNotReached,

    #[msg("Promiser cannot be their own judge")]
    SelfJudgeNotAllowed,
}