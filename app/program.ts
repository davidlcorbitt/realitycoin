import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RealitycoinConsensus } from "../target/types/realitycoin_consensus";
import { PublicKey, SystemProgram } from "@solana/web3.js";

anchor.setProvider(anchor.Provider.env());
export const program = anchor.workspace.RealitycoinConsensus as Program<RealitycoinConsensus>;

const getPDA = async (seeds: (string | PublicKey | Buffer)[]) => {
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

export const getProgramStatePDA = () => getPDA(["program-state"]);

export const getProgramState = async () =>
  program.account.programState.fetch(await getProgramStatePDA());

export const airdrop = async (account: anchor.web3.PublicKey) =>
  await program.provider.connection.confirmTransaction(
    await program.provider.connection.requestAirdrop(account, 100000000000),
    "processed"
  );

export const addValidator = async (validator: anchor.web3.Keypair, stake: anchor.BN) => {
  const programState = await getProgramStatePDA();
  const validatorPDA = await getPDA(["staked-validator", validator.publicKey]);

  await airdrop(validator.publicKey);
  await program.rpc.addValidator(stake, {
    accounts: {
      stakedValidator: validatorPDA,
      validator: validator.publicKey,
      systemProgram: SystemProgram.programId,
      programState,
    },
    signers: [validator],
  });
};

export const proposeBlockForVoting = async (validator: anchor.web3.Keypair) => {
  const blockHash = anchor.web3.Keypair.generate().publicKey;
  const miner = anchor.web3.Keypair.generate();
  const votableBlockPDA = await getPDA(["votable-block", blockHash]);

  await program.rpc.proposeBlockForVoting(blockHash, miner.publicKey, {
    accounts: {
      votableBlock: votableBlockPDA,
      programState: await getProgramStatePDA(),
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
  const votableBlockPDA = await getPDA(["votable-block", blockHash]);
  const voteOnBlockPDA = await getPDA(["vote-on-block", blockHash, validator.publicKey]);
  const validatorPDA = await getPDA(["staked-validator", validator.publicKey]);
  const programStatePDA = await getProgramStatePDA();

  await program.rpc.castVoteOnBlock(blockHash, approve, {
    accounts: {
      voteOnBlock: voteOnBlockPDA,
      votableBlock: votableBlockPDA,
      programState: programStatePDA,
      stakedValidator: validatorPDA,
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
  const votableBlockPDA = await getPDA(["votable-block", blockHash]);

  await program.rpc.finalizeBlockApproval({
    accounts: {
      votableBlock: votableBlockPDA,
      approvedBlock: await getPDA(["approved-block", blockHash]),
      programState: await getProgramStatePDA(),
      stakedValidator: await getPDA(["staked-validator", validator.publicKey]),
      systemProgram: SystemProgram.programId,
      validator: validator.publicKey,
    },
    signers: [validator],
  });
};
