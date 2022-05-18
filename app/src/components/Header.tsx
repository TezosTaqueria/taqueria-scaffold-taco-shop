import Wallet from "./Wallet";
import type { TezosToolkit } from "@taquito/taquito";

const Header = ({
  Tezos,
  rpcUrl,
  setConnected,
  connected
}: {
  Tezos: TezosToolkit | undefined;
  rpcUrl: string;
  setConnected: (p: boolean) => void;
  connected: boolean;
}) => {
  return (
    <header>
      <div className="header__logo">
        <img src="images/logo.png" alt="logo" />
      </div>
      <div className="header__title">
        <h1>Hello Tacos</h1>
      </div>
      <div className="header__connection-status">
        <Wallet
          Tezos={Tezos}
          rpcUrl={rpcUrl}
          setConnected={setConnected}
          connected={connected}
        />
      </div>
    </header>
  );
};

export default Header;
