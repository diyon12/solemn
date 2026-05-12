use anchor_lang::prelude::*;

#[account]
pub struct Promise {
    pub promiser: Pubkey,         // 32 — yang bikin janji
    pub judge: Pubkey,            // 32 — accountability partner
    pub charity: Pubkey,          // 32 — tujuan dana kalau gagal
    pub stake_amount: u64,        //  8 — dalam lamports (1 SOL = 1B lamports)
    pub deadline: i64,            //  8 — unix timestamp
    pub created_at: i64,          //  8 — unix timestamp
    pub status: PromiseStatus,    //  1
    pub bump: u8,                 //  1 — PDA bump seed
}

impl Promise {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1;
    //                     ^                                       
    //              discriminator
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PromiseStatus {
    Active,
    Approved,   // judge approved → stake balik ke promiser
    Rejected,   // judge rejected → stake ke charity
    TimedOut,   // deadline lewat tanpa approval → stake ke charity
}