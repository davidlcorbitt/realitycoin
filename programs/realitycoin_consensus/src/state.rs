pub mod state {
    use anchor_lang::prelude::*;
    use std::mem;

    pub trait SizeToAllocate {
        fn size_to_allocate() -> usize;
    }

    #[account]
    pub struct ProgramState {
        pub min_stake: u64,
        pub total_staked: u64,
        pub active_votes: Vec<Pubkey>,
    }
    impl SizeToAllocate for ProgramState {
        fn size_to_allocate() -> usize {
            8 + mem::size_of::<ProgramState>() + 100 * mem::size_of::<Pubkey>()
        }
    }

    #[account]
    pub struct StakedValidator {
        pub validator: Pubkey,
        pub stake: u64,
    }
    impl SizeToAllocate for StakedValidator {
        fn size_to_allocate() -> usize {
            8 + mem::size_of::<StakedValidator>()
        }
    }

    #[account]
    pub struct VotableBlock {
        pub block_hash: Pubkey,
        pub miner: Pubkey,
        pub validator: Pubkey,
        pub approve_votes: u64,
        pub reject_votes: u64,
        pub expires_at: u64,
    }
    impl SizeToAllocate for VotableBlock {
        fn size_to_allocate() -> usize {
            8 + mem::size_of::<VotableBlock>()
        }
    }

    #[account]
    pub struct VoteOnBlock {
        pub validator: Pubkey,
        pub block_hash: Pubkey,
        pub approve: bool,
    }
    impl SizeToAllocate for VoteOnBlock {
        fn size_to_allocate() -> usize {
            8 + mem::size_of::<VoteOnBlock>()
        }
    }
}
