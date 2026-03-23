use anchor_lang::prelude::*;

/// Global market account. Tracks vault, oracle, and resolution state.
#[account]
#[derive(Default, InitSpace)]
pub struct Market {
    /// Creator/authority who initialized the market
    pub authority: Pubkey,
    /// Oracle pubkey - only this account may resolve the market
    pub oracle: Pubkey,
    /// Token mint used for bets (e.g. USDC)
    pub mint: Pubkey,
    /// Unix timestamp when market was created
    pub creation_ts: i64,
    /// Unix timestamp when market was resolved (0 if unresolved)
    pub resolution_ts: i64,
    /// True if market has been resolved
    pub resolved: bool,
    /// Index of winning outcome (0-based). Invalid until resolved.
    pub winning_outcome_index: u8,
    /// PDA bump for the market
    pub bump: u8,
    /// Total outcomes created for this market (max 256)
    pub outcome_count: u8,
}

/// Outcome account. Tracks stake for one outcome (e.g. "Yes" or "No").
#[account]
#[derive(Default, InitSpace)]
pub struct Outcome {
    /// Parent market
    pub market: Pubkey,
    /// Outcome index within the market (0, 1, 2, ...)
    pub index: u8,
    /// Total amount staked on this outcome (in mint decimals)
    pub total_stake: u64,
    /// PDA bump
    pub bump: u8,
}

/// Individual bet placed by a user on an outcome.
#[account]
#[derive(Default, InitSpace)]
pub struct Bet {
    /// Market this bet belongs to
    pub market: Pubkey,
    /// User who placed the bet
    pub user: Pubkey,
    /// Outcome account this bet is on
    pub outcome: Pubkey,
    /// Amount staked (in mint decimals)
    pub amount: u64,
    /// True if winnings have been claimed
    pub claimed: bool,
    /// PDA bump
    pub bump: u8,
}
