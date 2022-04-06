import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RealitycoinConsensus } from "../target/types/realitycoin_consensus";
import { PublicKey, SystemProgram } from "@solana/web3.js";

anchor.setProvider(anchor.Provider.env());
export const program = anchor.workspace.RealitycoinConsensus as Program<RealitycoinConsensus>;

// PROGRAM STATE GETTERS

export const getPDA = async (seeds: (string | PublicKey | Buffer)[]) => {
  const encodedSeeds = seeds.map((seed) =>
    seed instanceof Buffer
      ? seed
      : seed instanceof PublicKey
      ? seed.toBuffer()
      : anchor.utils.bytes.utf8.encode(seed)
  );

  const [address, _] = await PublicKey.findProgramAddress(encodedSeeds, program.programId);

  return address;
};

const createGetters = <
  Args extends Array<typeof getPDA["arguments"][0]>,
  T extends anchor.AccountClient = anchor.AccountClient
>(
  discriminator: string,
  account: T
) => {
  return {
    pda: (...args: Args) => getPDA([discriminator, ...args]),
    val: async (...args) => account.fetch(await getPDA([discriminator, ...args])),
  };
};

export const programState = createGetters("program-state", program.account.programState);

export const stakedValidator = createGetters<[PublicKey]>(
  "staked-validator",
  program.account.stakedValidator
);

export const votableBlock = createGetters<[PublicKey]>(
  "votable-block",
  program.account.votableBlock
);

export const voteOnBlock = createGetters<[PublicKey, PublicKey]>(
  "vote-on-block",
  program.account.voteOnBlock
);

export const approvedBlock = createGetters<[PublicKey]>(
  "approved-block",
  program.account.approvedBlock
);

// END PROGRAM STATE GETTERS

// UTILITY FUNCTIONS

export const airdrop = async (account: anchor.web3.PublicKey) =>
  await program.provider.connection.confirmTransaction(
    await program.provider.connection.requestAirdrop(account, 100000000000),
    "processed"
  );

// END UTILITY FUNCTIONS

// PROGRAM INSTRUCTIONS

export const addValidator = async (validator: anchor.web3.Keypair, stake: anchor.BN) => {
  await airdrop(validator.publicKey);
  await program.rpc.addValidator(stake, {
    accounts: {
      stakedValidator: await stakedValidator.pda(validator.publicKey),
      validator: validator.publicKey,
      systemProgram: SystemProgram.programId,
      programState: await programState.pda(),
    },
    signers: [validator],
  });
};

export const proposeBlockForVoting = async (validator: anchor.web3.Keypair) => {
  const blockHash = anchor.web3.Keypair.generate().publicKey;
  const miner = anchor.web3.Keypair.generate();
  const votableBlockPDA = await votableBlock.pda(blockHash);

  await program.rpc.proposeBlockForVoting(blockHash, miner.publicKey, {
    accounts: {
      stakedValidator: await stakedValidator.pda(validator.publicKey),
      votableBlock: votableBlockPDA,
      programState: await programState.pda(),
      systemProgram: SystemProgram.programId,
      validator: validator.publicKey,
    },
    signers: [validator],
  });
  return { blockHash, votableBlockPDA, miner };
};

export const castVoteOnBlock = async (
  validator: anchor.web3.Keypair,
  blockHash: anchor.web3.PublicKey,
  approve: boolean
) => {
  await program.rpc.castVoteOnBlock(approve, {
    accounts: {
      voteOnBlock: await voteOnBlock.pda(blockHash, validator.publicKey),
      votableBlock: await votableBlock.pda(blockHash),
      programState: await programState.pda(),
      stakedValidator: await stakedValidator.pda(validator.publicKey),
      systemProgram: SystemProgram.programId,
      validator: validator.publicKey,
    },
    signers: [validator],
  });
};

export const finalizeBlockApproval = async (
  validator: anchor.web3.Keypair,
  blockHash: anchor.web3.PublicKey
) => {
  await program.rpc.finalizeBlockApproval({
    accounts: {
      votableBlock: await votableBlock.pda(blockHash),
      approvedBlock: await approvedBlock.pda(blockHash),
      programState: await programState.pda(),
      stakedValidator: await stakedValidator.pda(validator.publicKey),
      systemProgram: SystemProgram.programId,
      validator: validator.publicKey,
    },
    signers: [validator],
  });
};

export const finalizeBlockRejection = async (
  validator: anchor.web3.Keypair,
  blockHash: anchor.web3.PublicKey
) => {
  await program.rpc.finalizeBlockRejection({
    accounts: {
      votableBlock: await votableBlock.pda(blockHash),
      programState: await programState.pda(),
      stakedValidator: await stakedValidator.pda(validator.publicKey),
      systemProgram: SystemProgram.programId,
      validator: validator.publicKey,
    },
    signers: [validator],
  });
};

export const collectValidatorReward = async (
  validator: anchor.web3.Keypair,
  blockHash: anchor.web3.PublicKey
) => {
  await program.rpc.collectValidatorReward({
    accounts: {
      votableBlock: await votableBlock.pda(blockHash),
      voteOnBlock: await voteOnBlock.pda(blockHash, validator.publicKey),
      programState: await programState.pda(),
      stakedValidator: await stakedValidator.pda(validator.publicKey),
      systemProgram: SystemProgram.programId,
      validator: validator.publicKey,
    },
    signers: [validator],
  });
};

// END PROGRAM INSTRUCTIONS
