import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { RealitycoinConsensus } from "../target/types/realitycoin_consensus";

const MIN_STAKE = new anchor.BN(5000);
const program = anchor.workspace.RealitycoinConsensus as Program<RealitycoinConsensus>;
const owner = program.provider.wallet;

const airdrop = async (account: anchor.web3.Keypair) =>
  await program.provider.connection.confirmTransaction(
    await program.provider.connection.requestAirdrop(account.publicKey, 1000000000),
    "processed"
  );

anchor.setProvider(anchor.Provider.env());

describe("realitycoin_consensus", async () => {
  const [programDataPDA, _] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("program-data"), owner.publicKey.toBuffer()],
    program.programId
  );

  it("Initializes correctly", async () => {
    await program.rpc.initialize(MIN_STAKE, {
      accounts: {
        programData: programDataPDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    const programData = await program.account.programData.fetch(programDataPDA);
    expect(programData.minStake.toString()).equal(MIN_STAKE.toString());
  });

  it("Lets users stake", async () => {
    const validator1 = anchor.web3.Keypair.generate();
    await airdrop(validator1);

    const [stakedValidatorPDA, _] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("staked-validator"), validator1.publicKey.toBuffer()],
      program.programId
    );

    const stake: anchor.BN = new anchor.BN(5000);
    await program.rpc.addValidator(stake, {
      accounts: {
        stakedValidator: stakedValidatorPDA,
        validator: validator1.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [validator1],
    });
  });
});
