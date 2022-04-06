import * as anchor from "@project-serum/anchor";
import { SystemProgram } from "@solana/web3.js";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  addValidator,
  castVoteOnBlock,
  finalizeBlockApproval,
  getProgramState,
  getProgramStatePDA,
  program,
  proposeBlockForVoting,
} from "../app/program";

chai.use(chaiAsPromised);

describe("realitycoin_consensus", async () => {
  const validators = Array(3)
    .fill("")
    .map(() => anchor.web3.Keypair.generate());

  it("Initializes correctly", async () => {
    const programStatePDA = await getProgramStatePDA();
    await program.rpc.initialize(new anchor.BN(5000), {
      accounts: {
        programState: programStatePDA,
        owner: program.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    const programState = await getProgramState();
    expect(programState.minStake.toString()).equal("5000");
    expect(programState.totalStaked.toString()).equal("0");
  });

  it("Can't be initialized twice", async () => {
    const programStatePDA = await getProgramStatePDA();

    await expect(
      program.rpc.initialize(new anchor.BN(5000), {
        accounts: {
          programState: programStatePDA,
          owner: program.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      })
    ).to.eventually.be.rejectedWith("already been processed");
  });

  it("Lets users sign up as validators", async () => {
    await Promise.all(validators.map((validator) => addValidator(validator, new anchor.BN(5000))));

    expect((await getProgramState()).totalStaked.toString()).to.equal(
      new anchor.BN(15000).toString()
    );
  });

  it("Proposes a block vote", async () => {
    const { blockHash, votableBlockPDA, miner } = await proposeBlockForVoting(validators[0]);

    const programState = await getProgramState();
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
    const { blockHash, votableBlockPDA } = await proposeBlockForVoting(validators[0]);

    await castVoteOnBlock(validators[0], blockHash, true);
    await castVoteOnBlock(validators[1], blockHash, false);
    await castVoteOnBlock(validators[2], blockHash, true);

    const votableBlock = await program.account.votableBlock.fetch(votableBlockPDA);

    expect(votableBlock.approveVotes.toString()).to.equal("10000");
    expect(votableBlock.rejectVotes.toString()).to.equal("5000");
  });

  it("Finalizes approved blocks", async () => {
    const { blockHash } = await proposeBlockForVoting(validators[0]);

    await castVoteOnBlock(validators[0], blockHash, true);
    await castVoteOnBlock(validators[1], blockHash, true);

    await finalizeBlockApproval(validators[0], blockHash);
  });
});
