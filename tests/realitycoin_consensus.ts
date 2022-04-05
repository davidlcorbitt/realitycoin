import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import chai, { expect } from "chai";
import { RealitycoinConsensus } from "../target/types/realitycoin_consensus";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const MIN_STAKE = new anchor.BN(5000);
anchor.setProvider(anchor.Provider.env());
const program = anchor.workspace.RealitycoinConsensus as Program<RealitycoinConsensus>;

const blockHash = anchor.web3.Keypair.generate().publicKey;

describe("realitycoin_consensus", async () => {
  const owner = program.provider.wallet;

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

  const getProgramState = async (pda: Awaited<ReturnType<typeof getPDA>>) =>
    program.account.programState.fetch(await getPDA(["program-state"]));

  const airdrop = async (account: anchor.web3.Keypair) =>
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(account.publicKey, 1000000000),
      "processed"
    );

  const validator1 = anchor.web3.Keypair.generate();

  it("Initializes correctly", async () => {
    const programStatePDA = await getPDA(["program-state"]);
    await program.rpc.initialize(MIN_STAKE, {
      accounts: {
        programState: programStatePDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    const programState = await getProgramState(programStatePDA);
    expect(programState.minStake.toString()).equal(MIN_STAKE.toString());
    expect(programState.totalStaked.toString()).equal("0");
  });

  it("Can't be initialized twice", async () => {
    const programStatePDA = await getPDA(["program-state"]);

    await expect(
      program.rpc.initialize(MIN_STAKE, {
        accounts: {
          programState: programStatePDA,
          owner: owner.publicKey,
          systemProgram: SystemProgram.programId,
        },
      })
    ).to.eventually.be.rejectedWith("already been processed");
  });

  it("Lets users sign up as validators", async () => {
    const programState = await getPDA(["program-state"]);

    await airdrop(validator1);

    const validator1PDA = await getPDA(["staked-validator", validator1.publicKey]);

    const stake: anchor.BN = new anchor.BN(5000);
    await program.rpc.addValidator(stake, {
      accounts: {
        stakedValidator: validator1PDA,
        validator: validator1.publicKey,
        systemProgram: SystemProgram.programId,
        programState,
      },
      signers: [validator1],
    });

    expect((await getProgramState(programState)).totalStaked.toString()).to.equal(
      new anchor.BN(5000).toString()
    );
  });

  it("Starts a block vote", async () => {
    const miner = anchor.web3.Keypair.generate();
    const programStatePDA = await getPDA(["program-state"]);
    const votableBlockPDA = await getPDA(["votable-block", blockHash]);

    await program.rpc.proposeBlockForVoting(blockHash, miner.publicKey, {
      accounts: {
        votableBlock: votableBlockPDA,
        programState: programStatePDA,
        systemProgram: SystemProgram.programId,
        validator: validator1.publicKey,
      },
      signers: [validator1],
    });

    const programState = await getProgramState(programStatePDA);
    expect(programState.activeVotes[0].toString()).to.equal(blockHash.toString());

    const votableBlock = await program.account.votableBlock.fetch(votableBlockPDA);

    expect(votableBlock.miner.toString()).to.equal(miner.publicKey.toString());
    expect(votableBlock.blockHash.toString()).to.equal(blockHash.toString());
    expect(votableBlock.approveVotes.toString()).to.equal("0");
    expect(votableBlock.rejectVotes.toString()).to.equal("0");
    expect(votableBlock.expiresAt.toNumber()).greaterThan(new Date().getTime() / 1000);
    expect(votableBlock.expiresAt.toNumber()).lessThan(new Date().getTime() / 1000 + 60 * 60 * 5);
  });

  it("Casts votes on a block", async () => {
    const programStatePDA = await getPDA(["program-state"]);
    const voteOnBlockPDA = await getPDA(["vote-on-block", blockHash, validator1.publicKey]);
    const validator1PDA = await getPDA(["staked-validator", validator1.publicKey]);
    const votableBlockPDA = await getPDA(["votable-block", blockHash]);

    // const

    await program.rpc.castVoteOnBlock(blockHash, true, {
      accounts: {
        voteOnBlock: voteOnBlockPDA,
        votableBlock: votableBlockPDA,
        programState: programStatePDA,
        stakedValidator: validator1PDA,
        systemProgram: SystemProgram.programId,
        validator: validator1.publicKey,
      },
      signers: [validator1],
    });

    const programState = await getProgramState(programStatePDA);
    expect(programState.activeVotes[0].toString()).to.equal(blockHash.toString());

    const votableBlock = await program.account.votableBlock.fetch(votableBlockPDA);

    expect(votableBlock.approveVotes.toString()).to.equal("5000");
    expect(votableBlock.rejectVotes.toString()).to.equal("0");
  });
});
