use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::{Bet, Market, Outcome};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod prediction_market {
    use super::*;

    /// Initialize a new prediction market. Creates the market PDA and vault ATA.
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        _market_bump: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.oracle = ctx.accounts.oracle.key();
        market.mint = ctx.accounts.mint.key();
        market.creation_ts = Clock::get()?.unix_timestamp;
        market.resolution_ts = 0;
        market.resolved = false;
        market.winning_outcome_index = 0;
        market.bump = ctx.bumps.market;
        market.outcome_count = 0;
        Ok(())
    }

    /// Create an outcome for a market (e.g. "Yes" or "No").
    pub fn create_outcome(ctx: Context<CreateOutcome>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let outcome = &mut ctx.accounts.outcome;

        require!(!market.resolved, PredictionMarketError::MarketAlreadyResolved);
        require!(
            market.outcome_count < 255,
            PredictionMarketError::TooManyOutcomes
        );

        outcome.market = market.key();
        outcome.index = market.outcome_count;
        outcome.total_stake = 0;
        outcome.bump = ctx.bumps.outcome;

        market.outcome_count = market.outcome_count.checked_add(1).unwrap();

        Ok(())
    }

    /// Place a bet on an outcome. Transfers tokens from user to vault.
    /// Strict state check: cannot bet after resolution.
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64) -> Result<()> {
        let market = &ctx.accounts.market;
        let outcome = &mut ctx.accounts.outcome;
        let bet = &mut ctx.accounts.bet;

        require!(!market.resolved, PredictionMarketError::MarketAlreadyResolved);
        require!(amount > 0, PredictionMarketError::InvalidAmount);

        bet.market = market.key();
        bet.user = ctx.accounts.user.key();
        bet.outcome = outcome.key();
        bet.amount = amount;
        bet.claimed = false;
        bet.bump = ctx.bumps.bet;

        outcome.total_stake = outcome
            .total_stake
            .checked_add(amount)
            .ok_or(PredictionMarketError::MathOverflow)?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    /// Resolve the market. Only the oracle may call this.
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winning_outcome_index: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        require!(!market.resolved, PredictionMarketError::MarketAlreadyResolved);
        require!(
            winning_outcome_index < market.outcome_count,
            PredictionMarketError::InvalidOutcomeIndex
        );

        market.resolved = true;
        market.resolution_ts = Clock::get()?.unix_timestamp;
        market.winning_outcome_index = winning_outcome_index;

        Ok(())
    }

    /// Claim winnings for a winning bet. Transfers share from vault to user.
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let outcome = &ctx.accounts.outcome;
        let bet = &mut ctx.accounts.bet;

        require!(market.resolved, PredictionMarketError::MarketNotResolved);
        require!(!bet.claimed, PredictionMarketError::AlreadyClaimed);
        require!(bet.market == market.key(), PredictionMarketError::BetMarketMismatch);
        require!(bet.outcome == outcome.key(), PredictionMarketError::BetOutcomeMismatch);

        let outcome_index = outcome.index;
        require!(
            outcome_index == market.winning_outcome_index,
            PredictionMarketError::NotWinningOutcome
        );

        require!(outcome.total_stake > 0, PredictionMarketError::ZeroOutcomeStake);

        let vault_balance = ctx.accounts.vault.amount;
        let share = (u128::from(bet.amount))
            .checked_mul(u128::from(vault_balance))
            .ok_or(PredictionMarketError::MathOverflow)?
            .checked_div(u128::from(outcome.total_stake))
            .ok_or(PredictionMarketError::MathOverflow)?;
        let share_u64 = u64::try_from(share).map_err(|_| PredictionMarketError::MathOverflow)?;
        require!(share_u64 > 0, PredictionMarketError::ZeroPayout);

        bet.claimed = true;

        let seeds = &[
            b"market",
            market.authority.as_ref(),
            &[market.bump],
        ][..];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.user_token.to_account_info(),
                    authority: ctx.accounts.market.to_account_info(),
                },
                signer,
            ),
            share_u64,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(_market_bump: u8)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", authority.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub oracle: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = market,
        token::token_program = token_program,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateOutcome<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"market", market.authority.as_ref()],
        bump = market.bump,
        constraint = !market.resolved @ PredictionMarketError::MarketAlreadyResolved
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Outcome::INIT_SPACE,
        seeds = [
            b"outcome",
            market.key().as_ref(),
            &[market.outcome_count],
        ],
        bump
    )]
    pub outcome: Account<'info, Outcome>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        seeds = [b"market", market.authority.as_ref()],
        bump = market.bump,
        constraint = !market.resolved @ PredictionMarketError::MarketAlreadyResolved
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [
            b"outcome",
            market.key().as_ref(),
            &[outcome.index],
        ],
        bump = outcome.bump,
        constraint = outcome.market == market.key()
    )]
    pub outcome: Account<'info, Outcome>,

    #[account(
        init,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [
            b"bet",
            market.key().as_ref(),
            outcome.key().as_ref(),
            user.key().as_ref(),
        ],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token.owner == user.key(),
        constraint = user_token.mint == market.mint
    )]
    pub user_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump,
        constraint = vault.mint == market.mint
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", market.authority.as_ref()],
        bump = market.bump,
        constraint = market.oracle == oracle.key() @ PredictionMarketError::UnauthorizedOracle
    )]
    pub market: Account<'info, Market>,

    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"market", market.authority.as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        seeds = [
            b"outcome",
            market.key().as_ref(),
            &[outcome.index],
        ],
        bump = outcome.bump
    )]
    pub outcome: Account<'info, Outcome>,

    #[account(
        mut,
        seeds = [
            b"bet",
            market.key().as_ref(),
            outcome.key().as_ref(),
            user.key().as_ref(),
        ],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token.owner == user.key(),
        constraint = user_token.mint == market.mint
    )]
    pub user_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump,
        constraint = vault.mint == market.mint
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum PredictionMarketError {
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    #[msg("Market has not been resolved yet")]
    MarketNotResolved,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Math overflow or underflow")]
    MathOverflow,
    #[msg("Outcome index out of range")]
    InvalidOutcomeIndex,
    #[msg("Winnings have already been claimed")]
    AlreadyClaimed,
    #[msg("Bet does not match market")]
    BetMarketMismatch,
    #[msg("Bet does not match outcome")]
    BetOutcomeMismatch,
    #[msg("Bet was not on the winning outcome")]
    NotWinningOutcome,
    #[msg("Only the oracle may resolve")]
    UnauthorizedOracle,
    #[msg("Too many outcomes")]
    TooManyOutcomes,
    #[msg("Outcome has zero stake")]
    ZeroOutcomeStake,
    #[msg("Payout would be zero")]
    ZeroPayout,
}
