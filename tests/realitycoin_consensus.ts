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

  const getProgramData = async (pda: Awaited<ReturnType<typeof getPDA>>) =>
    program.account.programData.fetch(await getPDA(["program-data"]));

  const airdrop = async (account: anchor.web3.Keypair) =>
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(account.publicKey, 1000000000),
      "processed"
    );

  const validator1 = anchor.web3.Keypair.generate();

  it("Initializes correctly", async () => {
    const programDataPDA = await getPDA(["program-data"]);
    await program.rpc.initialize(MIN_STAKE, {
      accounts: {
        programData: programDataPDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    const programData = await getProgramData(programDataPDA);
    expect(programData.minStake.toString()).equal(MIN_STAKE.toString());
    expect(programData.totalStaked.toString()).equal("0");
  });

  it("Can't be initialized twice", async () => {
    const programDataPDA = await getPDA(["program-data"]);

    await expect(
      program.rpc.initialize(MIN_STAKE, {
        accounts: {
          programData: programDataPDA,
          owner: owner.publicKey,
          systemProgram: SystemProgram.programId,
        },
      })
    ).to.eventually.be.rejectedWith("already been processed");
  });

  it("Lets users sign up as validators", async () => {
    const programData = await getPDA(["program-data"]);

    await airdrop(validator1);

    const validator1PDA = await getPDA(["staked-validator", validator1.publicKey]);

    const stake: anchor.BN = new anchor.BN(5000);
    await program.rpc.addValidator(stake, {
      accounts: {
        stakedValidator: validator1PDA,
        validator: validator1.publicKey,
        systemProgram: SystemProgram.programId,
        programData,
      },
      signers: [validator1],
    });

    expect((await getProgramData(programData)).totalStaked.toString()).to.equal(
      new anchor.BN(5000).toString()
    );
  });

  it("Starts a block vote", async () => {
    const miner = anchor.web3.Keypair.generate();
    const programDataPDA = await getPDA(["program-data"]);
    const blockHash = anchor.web3.Keypair.generate().publicKey;

    const blockVotePDA = await getPDA(["block-vote", blockHash]);

    await program.rpc.startBlockVote(blockHash, miner.publicKey, {
      accounts: {
        blockVote: blockVotePDA,
        programData: programDataPDA,
        systemProgram: SystemProgram.programId,
        validator: validator1.publicKey,
      },
      signers: [validator1],
    });

    const programData = await getProgramData(programDataPDA);
    expect(programData.activeVotes[0].toString()).to.equal(blockHash.toString());

    const blockVote = await program.account.blockVote.fetch(blockVotePDA);

    expect(blockVote.miner.toString()).to.equal(miner.publicKey.toString());
    expect(blockVote.blockHash.toString()).to.equal(blockHash.toString());
    expect(blockVote.approveVotes.toString()).to.equal("0");
    expect(blockVote.rejectVotes.toString()).to.equal("0");
    expect(blockVote.expiresAt.toNumber()).greaterThan(new Date().getTime() / 1000);
    expect(blockVote.expiresAt.toNumber()).lessThan(new Date().getTime() / 1000 + 60 * 60 * 5);
  });
});
