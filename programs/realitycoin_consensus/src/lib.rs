use anchor_lang::prelude::*;

use crate::state::state::*;
mod state;

declare_id!("3nFoQdq56rXxQgLGQidrBa2Qfqj75c6NhmDCvdJqMEN9");

// Give validators a maximum of 4 hours to process a block
const MAX_VOTING_TIME_IN_SECONDS: u32 = 60 * 60 * 4;

#[program]
pub mod realitycoin_consensus {
    use super::*;

    // BEGIN IMPLEMENTATION `initialize`
    #[derive(Accounts)]
    pub struct Initialize<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,

        #[account(
        init,
        payer = owner,
        seeds = [b"program-data"],
        bump,
        space = ProgramState::size_to_allocate()
        )]
        pub program_state: Account<'info, ProgramState>,

        pub system_program: Program<'info, System>,
    }

    pub fn initialize(ctx: Context<Initialize>, min_stake: u64) -> Result<()> {
        ctx.accounts.program_state.min_stake = min_stake;
        Ok(())
    }
    // END IMPLEMENTATION `initialize`

    // BEGIN IMPLEMENTATION `add_validator`
    #[derive(Accounts)]
    pub struct AddValidator<'info> {
        #[account(mut)]
        pub validator: Signer<'info>,

        #[account(
            init,
            payer = validator,
            seeds = [b"staked-validator", validator.key().as_ref()],
            bump,
            space = StakedValidator::size_to_allocate()
        )]
        pub staked_validator: Account<'info, StakedValidator>,
        #[account(mut)]
        pub program_state: Account<'info, ProgramState>,
        pub system_program: Program<'info, System>,
    }

    pub fn add_validator(ctx: Context<AddValidator>, tokens_to_stake: u64) -> Result<()> {
        ctx.accounts.staked_validator.validator = ctx.accounts.validator.key();

        // TODO: This is a placeholder. Need to actually transfer the tokens!

        ctx.accounts.staked_validator.stake = tokens_to_stake;
        ctx.accounts.program_state.total_staked += tokens_to_stake;

        Ok(())
    }
    // END IMPLEMENTATION `add_validator`

    // BEGIN IMPLEMENTATION `start_block_vote`
    #[derive(Accounts)]
    #[instruction(block_hash: Pubkey, miner: Pubkey)]
    pub struct StartBlockVote<'info> {
        #[account(
        init,
        payer=validator,
        // seeds=[b"block-vote"],
        seeds=[b"block-vote", block_hash.key().as_ref()],
        bump,
        space=BlockVote::size_to_allocate()
    )]
        pub block_vote: Account<'info, BlockVote>,

        #[account(mut)]
        pub validator: Signer<'info>,
        #[account(mut)]
        pub program_state: Account<'info, ProgramState>,
        pub system_program: Program<'info, System>,
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

        ctx.accounts.program_state.active_votes.push(block_hash);

        Ok(())
    }
    // END IMPLEMENTATION `start_block_vote`
}
