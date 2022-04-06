use anchor_lang::prelude::*;

use crate::state::state::*;
mod state;

declare_id!("3nFoQdq56rXxQgLGQidrBa2Qfqj75c6NhmDCvdJqMEN9");

// Give validators a maximum of 4 hours to process a block
const MAX_VOTING_TIME_IN_SECONDS: i64 = 60 * 60 * 4;
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
        seeds = [b"program-state"],
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

    // BEGIN IMPLEMENTATION `propose_block_for_voting`
    #[derive(Accounts)]
    #[instruction(block_hash: Pubkey, miner: Pubkey)]
    pub struct ProposeBlockForVoting<'info> {
        #[account(
            init,
            payer=validator,
            seeds=[b"votable-block", block_hash.key().as_ref()],
            bump,
            space=VotableBlock::size_to_allocate()
        )]
        pub votable_block: Account<'info, VotableBlock>,

        #[account(mut)]
        pub validator: Signer<'info>,
        #[account(mut)]
        pub program_state: Account<'info, ProgramState>,
        pub system_program: Program<'info, System>,
    }

    pub fn propose_block_for_voting(
        ctx: Context<ProposeBlockForVoting>,

        // TODO: I'm using the `Pubkey` type here because it's a convenient
        // existing 32-byte container. Need to figure out how to implement a
        // custom BlockHash type and implement serialization/deserialization.
        block_hash: Pubkey,
        miner: Pubkey,
    ) -> Result<()> {
        ctx.accounts.votable_block.block_hash = block_hash;
        ctx.accounts.votable_block.miner = miner;
        ctx.accounts.votable_block.validator = ctx.accounts.validator.key();

        let now = Clock::get().unwrap().unix_timestamp;
        ctx.accounts.votable_block.expires_at = now + MAX_VOTING_TIME_IN_SECONDS;

        ctx.accounts.program_state.active_votes.push(block_hash);

        Ok(())
    }
    // END IMPLEMENTATION `propose_block_for_voting`

    // BEING IMPLEMENTATION `cast_vote_on_block`
    #[derive(Accounts)]
    #[instruction(block_hash: Pubkey, vote: bool)]
    pub struct CastVoteOnBlock<'info> {
        #[account(
            init,
            payer=validator,
            seeds=[b"vote-on-block", block_hash.key().as_ref(), validator.key().as_ref()],
            bump,
            space=VoteOnBlock::size_to_allocate()
        )]
        pub vote_on_block: Account<'info, VoteOnBlock>,

        #[account(mut)]
        pub votable_block: Account<'info, VotableBlock>,
        #[account(mut)]
        pub program_state: Account<'info, ProgramState>,

        pub staked_validator: Account<'info, StakedValidator>,

        #[account(mut)]
        pub validator: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    pub fn cast_vote_on_block(
        ctx: Context<CastVoteOnBlock>,
        block_hash: Pubkey,
        approve: bool,
    ) -> Result<()> {
        // require!(ctx.accounts.votable_block.block_hash == block_hash);
        ctx.accounts.vote_on_block.block_hash = block_hash;
        ctx.accounts.vote_on_block.validator = ctx.accounts.validator.key();
        ctx.accounts.vote_on_block.approve = approve;

        if approve {
            ctx.accounts.votable_block.approve_votes += ctx.accounts.staked_validator.stake;
        } else {
            ctx.accounts.votable_block.reject_votes += ctx.accounts.staked_validator.stake;
        }

        Ok(())
    }
    // END IMPLEMENTATION `cast_vote_on_block`

    // BEGIN IMPLEMENTATION `finalize_block_approval`
    #[derive(Accounts)]
    pub struct FinalizeBlockApproval<'info> {
        #[account(mut)]
        pub votable_block: Account<'info, VotableBlock>,
        #[account(mut)]
        pub program_state: Account<'info, ProgramState>,

        pub staked_validator: Account<'info, StakedValidator>,

        #[account(
            init,
            payer=validator,
            seeds=[b"approved-block", votable_block.block_hash.key().as_ref()],
            bump,
            space = ApprovedBlock::size_to_allocate()
        )]
        pub approved_block: Account<'info, ApprovedBlock>,

        #[account(mut)]
        pub validator: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    pub fn finalize_block_approval(ctx: Context<FinalizeBlockApproval>) -> Result<()> {
        require!(
            ctx.accounts.votable_block.voting_finalized_at == 0,
            Errors::BlockAlreadyFinalized
        );

        // A block can only be approved if more than 50% of validators have
        // voted to approve it. A block can be rejected if more than 50% of
        // validators have voted to reject it, or if its voting period has
        // expired.
        let approval_threshold_reached =
            ctx.accounts.votable_block.approve_votes > ctx.accounts.program_state.total_staked / 2;

        require!(
            approval_threshold_reached,
            Errors::ApprovalThresholdNotReached
        );

        ctx.accounts.votable_block.voting_finalized_at = Clock::get().unwrap().unix_timestamp;

        ctx.accounts.program_state.active_votes = ctx
            .accounts
            .program_state
            .active_votes
            .iter()
            .filter(|&block_hash| block_hash != &ctx.accounts.votable_block.block_hash)
            .cloned()
            .collect();

        ctx.accounts.approved_block.block_hash = ctx.accounts.votable_block.block_hash;

        Ok(())
    }

    // END IMPLEMENTATION `finalize_block_approval`

    // BEGIN IMPLEMENTATION `finalize_block_rejection`

    #[derive(Accounts)]
    pub struct FinalizeBlockRejection<'info> {
        #[account(mut)]
        pub votable_block: Account<'info, VotableBlock>,
        #[account(mut)]
        pub program_state: Account<'info, ProgramState>,

        pub staked_validator: Account<'info, StakedValidator>,

        #[account(mut)]
        pub validator: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    pub fn finalize_block_rejection(ctx: Context<FinalizeBlockRejection>) -> Result<()> {
        require!(
            ctx.accounts.votable_block.voting_finalized_at == 0,
            Errors::BlockAlreadyFinalized
        );

        // A block can be rejected if more than 50% of validators have voted to
        // reject it, or if its voting period has expired.
        let rejection_threshold_reached =
            ctx.accounts.votable_block.reject_votes > ctx.accounts.program_state.total_staked / 2;

        let now = Clock::get().unwrap().unix_timestamp;
        let voting_expired = ctx.accounts.votable_block.expires_at < now;

        require!(
            rejection_threshold_reached || voting_expired,
            Errors::RejectionThresholdNotReached
        );

        ctx.accounts.votable_block.voting_finalized_at = Clock::get().unwrap().unix_timestamp;

        ctx.accounts.program_state.active_votes = ctx
            .accounts
            .program_state
            .active_votes
            .iter()
            .filter(|&block_hash| block_hash != &ctx.accounts.votable_block.block_hash)
            .cloned()
            .collect();

        Ok(())
    }

    // BEGIN IMPLEMENTATION `collect_validator_reward`

    // pub fn

    // END IMPLEMENTATION `collect_validator_reward`

    // BEGIN IMPLEMENTATION `garbage_collect_vote`

    // END IMPLEMENTATION `garbage_collect_vote`
}

#[error_code]
pub enum Errors {
    #[msg("The given block doesn't have enough approval votes to be finalized")]
    ApprovalThresholdNotReached,

    #[msg("The given block doesn't have enough rejection votes to be finalized")]
    RejectionThresholdNotReached,

    #[msg("The given block is already finalized")]
    BlockAlreadyFinalized,
}
