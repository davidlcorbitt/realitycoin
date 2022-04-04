import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RealitycoinConsensus } from "../target/types/realitycoin_consensus";

describe("realitycoin_consensus", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.RealitycoinConsensus as Program<RealitycoinConsensus>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
