import React, { useState, useEffect } from "react";
import { TezosToolkit } from "@taquito/taquito";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Interface from "./components/Interface";
import "./App.css";
import "./styles/Header.css";
import "./styles/Interface.css";
import "./styles/Footer.css";
import "./styles/Wallet.css";
import { getAliasAddress } from "@taqueria/toolkit";
import config from "./config.json";
import type {Storage} from "./model"

function App() {

  // Retrieve the most recent address of the deployed contract

  const [rpcUrl] = useState("https://rpc.ghostnet.teztnets.xyz");
  const [contractAddress] = useState(
    // "KT18izS1s5Hsv9tRaB8VjxdTU6MFpLviLCrS"
    // config.environment.development.aliases["hello-tacos"].address
    getAliasAddress(config, "hello-tacos")
  );
  const [contractStorage, setContractStorage] = useState<Storage | undefined>(
    undefined
  );
  const [Tezos] = useState<TezosToolkit>(new TezosToolkit(rpcUrl));
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    (async () => {
      // fetches the contract storage
      const contract = await Tezos?.wallet.at(contractAddress);
      const storage: Storage | undefined = await contract?.storage();
      if (storage) {
        setContractStorage(storage);
      } else {
        setContractStorage(undefined);
      }
    })();
  }, [Tezos, setContractStorage, contractAddress]);

  return Tezos ? (
    <div className="app">
      <Header
        Tezos={Tezos}
        rpcUrl={rpcUrl}
        setConnected={setConnected}
        connected={connected}
      ></Header>
      <div></div>
      <Interface
        contractStorage={contractStorage}
        setContractStorage={setContractStorage}
        Tezos={Tezos}
        contractAddress={contractAddress}
        connected={connected}
      ></Interface>
      <Footer contractAddress={contractAddress}></Footer>
    </div>
  ) : (
    <div></div>
  );
}

export default App;
