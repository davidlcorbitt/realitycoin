use anchor_lang::prelude::*;
use std::mem;

declare_id!("3nFoQdq56rXxQgLGQidrBa2Qfqj75c6NhmDCvdJqMEN9");

// Give validators a maximum of 4 hours to process a block
const MAX_VOTING_TIME_IN_SECONDS: u32 = 60 * 60 * 4;

#[program]
pub mod realitycoin_consensus {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, min_stake: u64) -> Result<()> {
        ctx.accounts.program_data.min_stake = min_stake;
        Ok(())
    }

    pub fn add_validator(ctx: Context<AddValidator>, tokens_to_stake: u64) -> Result<()> {
        ctx.accounts.staked_validator.validator = ctx.accounts.validator.key();

        // TODO: This is a placeholder. Need to actually transfer the tokens!
        ctx.accounts.staked_validator.stake = tokens_to_stake;
        ctx.accounts.program_data.total_staked += tokens_to_stake;

        Ok(())
    }

    pub fn start_block_vote(
        ctx: Context<StartBlockVote>,

        // TODO: I'm using the `Pubkey` type here because it's a convenient
        // existing 32-byte container. Need to figure out how to implement a
        // custom BlockHash type and implement serialization/deserialization.
        block_hash: Pubkey,
        miner: Pubkey,
    ) -> Result<()> {
        ctx.accounts.block_vote.block_hash = block_hash;
        ctx.accounts.block_vote.miner = miner;
        ctx.accounts.block_vote.validator = ctx.accounts.validator.key();

        let now = Clock::get().unwrap().unix_timestamp;
        ctx.accounts.block_vote.expires_at = (now + MAX_VOTING_TIME_IN_SECONDS as i64) as u64;

        ctx.accounts.program_data.active_votes.push(block_hash);

        Ok(())
    }
}

#[account]
pub struct ProgramData {
    pub min_stake: u64,
    pub total_staked: u64,
    pub active_votes: Vec<Pubkey>,
}

#[account]
pub struct StakedValidator {
    pub validator: Pubkey,
    pub stake: u64,
}

#[account]
pub struct BlockVote {
    pub block_hash: Pubkey,
    pub miner: Pubkey,
    pub validator: Pubkey,
    pub approve_votes: u32,
    pub reject_votes: u32,
    pub expires_at: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        seeds = [b"program-data"],
        bump,
        space = 8 + 8 + 8 + 32 * 100
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
        space = 8 + mem::size_of::<StakedValidator>()
    )]
    pub staked_validator: Account<'info, StakedValidator>,
    #[account(mut)]
    pub program_data: Account<'info, ProgramData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(block_hash: Pubkey, miner: Pubkey)]
pub struct StartBlockVote<'info> {
    #[account(
        init,
        payer=validator,
        // seeds=[b"block-vote"],
        seeds=[b"block-vote", block_hash.key().as_ref()],
        bump,
        space=8+mem::size_of::<BlockVote>()
    )]
    pub block_vote: Account<'info, BlockVote>,

    #[account(mut)]
    pub validator: Signer<'info>,
    #[account(mut)]
    pub program_data: Account<'info, ProgramData>,
    pub system_program: Program<'info, System>,
}
