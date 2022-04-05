use anchor_lang::prelude::*;

declare_id!("3nFoQdq56rXxQgLGQidrBa2Qfqj75c6NhmDCvdJqMEN9");

#[program]
pub mod realitycoin_consensus {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, min_stake: u64) -> Result<()> {
        ctx.accounts.program_data.min_stake = min_stake;
        Ok(())
    }

    pub fn add_validator(ctx: Context<AddValidator>, tokens_to_stake: u64) -> Result<()> {
        // ctx.accounts.staked_validator.validator = ctx.accounts.validator.key();

        // TODO: actually transfer the tokens!
        // ctx.accounts.staked_validator.stake = tokens_to_stake;

        Ok(())
    }
}

#[account]
pub struct StakedValidator {
    pub validator: Pubkey,
    pub stake: u64,
}

#[account]
pub struct ProgramData {
    pub min_stake: u64,
    pub total_staked: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        seeds = [b"program-data", owner.key().as_ref()],
        bump,
        space = 8 + 8 + 8
    )]
    pub program_data: Account<'info, ProgramData>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddValidator<'info> {
    #[account(mut)]
    pub validator: Signer<'info>,

    #[account(
        init,
        payer = validator,
        seeds = [b"staked-validator", validator.key().as_ref()],
        bump,
        space = 8 + 32 + 8
    )]
    pub staked_validator: Account<'info, StakedValidator>,
    pub system_program: Program<'info, System>,
}
