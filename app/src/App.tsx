import React, { useState, useEffect } from "react";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Interface from "./components/Interface";
import "./App.css";
import "./styles/Header.css";
import "./styles/Interface.css";
import "./styles/Footer.css";
import "./styles/Wallet.css";

function App() {
  const [rpcUrl, setRpcUrl] = useState("https://ithacanet.ecadinfra.com");
  const [contractAddress, setContractAddress] = useState(
    "KT1EHAXNQ1oeh2ZNTkvvcU6PfzQvGPLsgJx3"
  );
  const [contractStorage, setContractStorage] = useState<number | undefined>(
    undefined
  );
  const [Tezos, setTezos] = useState<TezosToolkit>();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    (async () => {
      const tezos = new TezosToolkit(rpcUrl);
      setTezos(tezos);
      // fetches the contract storage
      const contract = await tezos?.wallet.at(contractAddress);
      const storage: BigNumber | undefined = await contract?.storage();
      if (storage) {
        setContractStorage(storage.toNumber());
      } else {
        setContractStorage(undefined);
      }
    })();
  }, []);

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
