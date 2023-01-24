import { TezosToolkit } from "@taquito/taquito";
import React from 'react'
import Header from "../components/Header";
import Footer from "../components/Footer";
import Interface from "../components/Interface";
import type {Storage} from "../model"

type Props = {
    Tezos: TezosToolkit
    rpcUrl: string
    setConnected: (value: boolean) => void
    connected: boolean,
    contractStorage: Storage | undefined,
    setContractStorage: (value: Storage) => void
    contractAddress: string
}

const AppContainer = ({Tezos, rpcUrl, setConnected, connected, contractStorage, setContractStorage, contractAddress}: Props) => (
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
) 

export default AppContainer