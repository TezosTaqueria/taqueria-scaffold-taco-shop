import React, { useState, useEffect } from "react";
import { TezosToolkit } from "@taquito/taquito";
import "./App.css";
import "./styles/Header.css";
import "./styles/Interface.css";
import "./styles/Footer.css";
import "./styles/Wallet.css";
import { V2, getConfigV2, ConfigFileSetV2, isTaqError, TaqError} from "@taqueria/toolkit";
import type {Storage} from "./model"
import AppContainer from "./components/AppContainer"

const CONTRACT_NAME='hello-tacos'

type AppProps = {
  env: Record<string, string|undefined>
}

type Deps = {
  settings: ConfigFileSetV2,
  Tezos: TezosToolkit
}

function getContractAddress(contractName: string, deps: Deps) {
  if (deps.settings) {
    const env = V2.getCurrentEnv(deps.settings)
    return V2.getContractAddress(contractName, env)
  }
  return undefined
}

function getRpcUrl(deps: Deps) {
  if (deps.settings) {
    const env = V2.getCurrentEnv(deps.settings)
    return env['rpcUrl'] as string | undefined
  }
  return undefined
}

function App(props: AppProps) {
  const [deps, setDeps] = useState<Deps|undefined>(undefined)
  const contractAddress = deps ? getContractAddress(CONTRACT_NAME, deps) : undefined
  const [contractStorage, setContractStorage] = useState<Storage | undefined>(
    undefined
  );
  const [connected, setConnected] = useState(false);

  // Get the current environment and create a Tezos client based
  // on its settings
  useEffect(() => {
    (async () => {
      if (!deps) {
        try {
          const settings = await getConfigV2(props.env, 'REACT_APP_')
          const env = V2.getCurrentEnv(settings)

          // This project assumes that only one of two environment types
          // are used, flextesa or simple, both of which have an RPC url
          const rpcUrl = env['rpcUrl']
          if (rpcUrl) {
            setDeps(_ => ({
              settings,
              Tezos: new TezosToolkit(String(rpcUrl))
            })) 
          }
          else throw new TaqError("No RPC url has been configured for your environment. Check your config and try again. Note, at this time, this app only supports the following environment types: simple, flextesa")
        }
        catch (err) {
          alert(isTaqError(err) ? err.message : err)
        }
      }
    })()
  }, [deps, setDeps, props])


  // Get the current amount of tacos from the contract storage
  useEffect(() => {
    (async () => {
      if (deps && contractAddress) {
        // fetches the contract storage
        const contract = await deps.Tezos.wallet.at(contractAddress);
        const storage: Storage | undefined = await contract?.storage();
        if (storage) {
          setContractStorage(storage);
        } else {
          setContractStorage(undefined);
        }
      }
      
    })();
  }, [deps, contractAddress, setContractStorage]);



  return deps ? (
    <AppContainer
      Tezos={deps.Tezos}
      connected={connected}
      setConnected={setConnected}
      contractAddress={contractAddress ?? "No contract found"}
      contractStorage={contractStorage}
      setContractStorage={setContractStorage}
      rpcUrl={getRpcUrl(deps) ?? 'No RPC url specified in environment configuration.'}
    />
  ) : (
    <div></div>
  );
}

export default App;
