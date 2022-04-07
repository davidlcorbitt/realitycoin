import "./App.css";
import { useEffect, useState } from "react";
import { addValidator, airdrop, program, programState } from "./programClient";
import * as anchor from "@project-serum/anchor";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

const initialize = async () => {
  console.log("initializing");
  await airdrop(program.provider.wallet.publicKey);
  console.log("adding");

  // @ts-ignore
  await addValidator(program.provider.wallet.payer, new anchor.BN(5000));
  console.log("Validator added");
};

initialize();

export default function App() {
  const [value, setValue] = useState(null);

  return (
    <div className="App">
      <div>
        {value && value >= Number(0) ? <h2>{value}</h2> : <h3>Please create the counter.</h3>}
      </div>
    </div>
  );
}
