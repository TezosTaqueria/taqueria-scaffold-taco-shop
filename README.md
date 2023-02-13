# Taco Shop

| Scaffold Details   |                                                         |
|--------------------|---------------------------------------------------------|
| Complexity         | Beginner                                                |
| Automated Tests    | Yes                                                     |
| Installed Plugins  | LIGO, Taquito, Flextesa, Jest                           |
| Frontend Dapp      | Yes                                                     |
| Wallet Integration | Yes                                                     |
| Repository         | https://github.com/ecadlabs/taqueria-scaffold-taco-shop |

## Quickstart

In a rush? You can follow the steps below to get up and running immediately:

### Scaffold and Initialize the Project

1. `taq scaffold https://github.com/ecadlabs/taqueria-scaffold-taco-shop taco-shop`
1. `cd taco-shop`
1. `npm run start:app`

## Overview

This scaffold implements a simple full stack Tezos project. It has a React dApp that interacts with a smart contract which stores the number of `available_tacos` and provides a function to buy tacos

The React dApp uses Beacon Wallet to interact with Tezos wallets in the browser and once connected, will display the number of `available_tacos` stored on-chain in the smart contract. There is also a basic interface which allows the user to buy tacos by sending a transaction to the smart contract with the `number_of_tacos_to_buy` as a parameter

The smart contract has been deployed to ghostnet at the address for demonstration purposes: `KT1KBBk3PXkKmGZn3K6FkktqyPRpEbzJoEPE`

The project comes pre-configured with the following:

- Plugins: LIGO, SmartPy, Flextesa, Taquito, Jest
- A LIGO multi-file smart contract: `hello-tacos.mligo`, `_buy.mligo`, `_make.mligo`, `_schema.mligo`. Note, the same contract is also available in SmartPy in a file called `hello-tacos.py`.
- A default environment named `development`, configured to target a local flextesa sandbox
- An environment named `testing`, configured to target the Ghostnet testnet
- Native Taqueria testing (Taqueria Jest plugin)

## Requirements

- Taqueria v0.16.0 or later
- Docker v0.9 or later
- Node.js v16 or later
- Temple Wallet (can be found [here](https://templewallet.com/))
- A funded testnet account (instructions [here](https://taqueria.io/docs/config/networks/#faucets))


## Using the Project

The intended workflow for this project is as follows:

1. Compile the LIGO multi-file source code
2. Originate the smart contract to the flextesa sandbox
3. Configure an instantiated account from your flextesa sandbox in your Wallet application, such as (Temple Wallet)[https://templewallet.com/].
4. Build and start the React dApp
5. Connect to Temple wallet
6. Buy tacos!

## Project Overview

### Scaffold the Project

This project is available as a Taqueria scaffold. To create a new project from this scaffold, run the following command:

```shell
taq scaffold https://github.com/ecadlabs/taqueria-scaffold-taco-shop taco-shop
```

This will clone the Taco Shop scaffold project into a directory called `taco-shop`

### Project Setup

To work on the project you need to get into the project directory:

```shell
cd taco-shop
```

### Project Structure

- `.taq` - This hidden folder stores the Taqueria configuration and state
- `app` - This is the React dApp 
- `contracts` - This folder contains the multiple file LIGO smart contract
- `tests` - This folder contains the automated tests
- `artifacts` - This folder contains the compiled Michelson `.tz` contracts

### Smart Contract

The smart contract `hello-tacos.mligo` is simple and straightforward. It stores the number of `available_tacos` in the contract storage, and provides an entrypoint that accepts a `tacos_to_buy` parameter which will decrease the number of available_tacos by the number of tacos_to_buy

1. `hello-tacos.mligo` file itself:
```js
#include "_buy.mligo"
#include "_make.mligo"

let main ((action, store) : (parameter * storage)) =
    match action with
    | Buy qty -> buy(qty, store)
    | Make qty -> make(qty, store)
```

2. `_buy.mligo`
```js
#include "_schema.mligo"

let buy ((tacos_to_buy, store) : (taco_quantity * storage)) =
    if tacos_to_buy > store.available_tacos
    then (failwith "NOT_ENOUGH_TACOS": operation list * storage)
    else (([], {store with available_tacos = abs(store.available_tacos - tacos_to_buy)}) :
        operation list * storage)
```

3. `_make.mligo`
```js
#include "_schema.mligo"

let make ((tacos_to_make, store) : (taco_quantity * storage)) =
    if not (Tezos.get_sender () = store.admin)
    then (failwith "NOT_ALLOWED": operation list * storage)
    else (([], {store with available_tacos = store.available_tacos + tacos_to_make}) : 
        (operation list * storage))
```

4. `_schema.mligo`
```js
type taco_quantity = nat
type admin = address

type storage = {
    available_tacos: taco_quantity;
    admin: admin
}

type parameter =
| Buy of taco_quantity
| Make of taco_quantity
```

5. `hello-tacos.storageList.mligo`
```js
#include "hello-tacos.mligo"
// All storage values must be in this file

// Define a storage variable
let storage: storage = {
    available_tacos = 42n;
    admin = ("tz1ge3zb6kC5iUZcXsjxiwwtU5MwP37T6m1z" : address)
}
```

### Compile the Contract

```shell
taq compile hello-tacos.mligo
```

This will compile multi-file contract `hello-tacos.mligo` to a file, `artifacts/hello-tacos.tz`

### Start the sandbox

We'll need a running flextesa sandbox to deploy our contract to. To start, execute the following:
```shell
taq start sandbox
```

### Originate to the Sandbox

Run the following command to originate the contract to the development environment, which is configured to use a flextesa sandbox:

```shell
taq originate hello-tacos.tz
```

This should return the address of the contract on the testnet which looks like this:

```shell
┌────────────────┬──────────────────────────────────────┬────────────────┐────────────────┐
│ Contract       │ Address                              │ Alias          │ Destination    │
├────────────────┼──────────────────────────────────────┼────────────────┤────────────────┤
│ hello-tacos.tz │ KT1KBBk3PXkKmGZn3K6FkktqyPRpEbzJoEPE │ hello-tacos    │ development    │
└────────────────┴──────────────────────────────────────┴────────────────┘────────────────┘
```

### React Dapp

The React dApp retrieves the number of available tacos from the smart contract and displays the value. It provides an interface for the user to buy tacos and looks like this:

![Hello Tacos Screenshot](/hello-tacos-screenshot.png)

### Build and Start the React Dapp

Now that the contract has been deployed, you can build and start the React dApp:
```shell
npm run start:app
```

You should now be able to access the Taco Shop dApp at [http://localhost:3000](http://localhost:3000/)

### Hot Reload Contract Address 

If at any time you re-deploy your smart contract, or change the default environment, you'll need to restart the app.

### Add a sandbox account to your Temple Wallet

Open your `.taq/config.local.development.json` file, and find the account keys for the user "Bob":

```json
 "bob": {
            "encryptedKey": "edpkurPsQ8eUApnLUJ9ZPDvu98E8VNj4KtJa1aZr16Cr5ow5VHKnz4",
            "publicKeyHash": "tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6",
            "secretKey": "unencrypted:edsk3RFfvaFaxbHx8BMtEW1rKQcPtDML3LXjNqMNLCzC3wLC1bWbAt"
        }
```

Copy the _secretKey_ of bob, which from the example above, would be: `edsk3RFfvaFaxbHx8BMtEW1rKQcPtDML3LXjNqMNLCzC3wLC1bWbAt`.

> NOTE: For all Taqueria projects, when you start a sandbox, "Bob" will always have the above key values.

Open your Temple Setting and login.

Click on your Avatar icon in the top-right corner. A menu should appear. Select _Import Account_.

Paste Bob's secret key (`edsk3RFfvaFaxbHx8BMtEW1rKQcPtDML3LXjNqMNLCzC3wLC1bWbAt`) into the text area and click _Import Account_.

Take note of the account name, which should be `Account X`, where X corresponds to number assigned to the account. The largest number would correspond to the last added account.

### Add the Sandbox Network to Temple Wallet

Open your Temple Setting and login.

Click on your Avatar icon in the top-right corner. A menu should appear. Select _Settings_ and then _Networks_.

At the bottom of the window is a section called _Add Network_ with two fields, _Name_ and _RBC base URL_.

Enter *development* into the _Name_ field and *http://localhost:20000* into the _RBC base URL_ field. Then click _Add Network_.

Beside your Avatar in Temple Wallet is a drop-down of networks, with the current network probably set to "Tezos Mainnet". From the drop-down, select the "development" network to just added to connect to your flextesa sandbox.

### Connect to Temple Wallet

Open a browser and navigate to [http://localhost:3000](http://localhost:3000/)

You should see the number of `available_tacos` displayed

Click on the `Connect wallet` button in the top right corner of the page and select `Temple Wallet`

Provide your credentials for the wallet, select a funded account, and click `connect`

### Buy Tacos using the dApp

With your wallet connected, you can now interact with the contract entrypoint

Click the `order` button and then authorize the transaction in Temple Wallet

Once completed, you will see the value of `available_tacos` decrease by the number of tacos you ordered

### Make Tacos using the taq call command

You can call contract entrypoints, such as the "make" entrypoint with the Taq CLI by executing `taq call hello-tacos --param hello-tacos.parameter.buySomeTacos.tz -e testing`


## Testing

This scaffold comes with Jest tests in the `tests` folder which has been initalized as a partition. The scaffold uses the `@taqueria/plugin-jest` plugin to run the tests

To run the tests, first make sure you have started a local sandbox by running:

```shell
taq start sandbox local
```

Then, run the Jest tests in the `tests` directory with the following command:

```shell
npm run test:integration
```
> Coming soon: We will be adjusting this scaffold to use our jest plugin at a later time.
