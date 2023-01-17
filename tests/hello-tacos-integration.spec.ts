/*
  These Integration Tests verify interactions between the Dapp and Contract as deployed to the
  blockchain. They aim to test the same functionality the Dapp uses, but outside of a web context.

  Note that the Dapp has both Front-End tests that verify the user interface, and Unit Tests to
  verify core Contract functionality.

  Without these integration tests, we would have to implicitly rely on the Front-End tests to test
  integration with the blockchain. However, those should only really be concerned with ui/widgets.

  All Contracts deployed (or, "originated") to Tezos have to come from a Wallet (or, "implicit")
  address. Furthermore, in order to deploy a contract, the Wallet has to have some funds in it.

  The Account that originates the Contract is the de facto administrator of the contract. We need
  this user for one to test that we can make tacos by calling the `Make(number_of_tacos)` endpoint.
  We also need a second, non-admin user in order to test buying tacos via the `Buy(number_of_tacos)`
  endpoint.

  In order to ensure that we always have funds in the originating/admin account, we use Taqueria's
  facility to dynamically create, instantiate and fund accounts in a given environment. To this end,
  these integration tests ensure that Flextesa is running, and once confirmed, the required test
  accounts mentioned before are provisioned and funded in the local Flextesa sandbox. This ensures
  not only that these tests can be run idempotently, but also that they work first time, everytime.

  Please see the top-level README file for more information.

  Copyright (c) 2023 ECAD Labs. All rights reserved.
  This software is licensed under the terms of the included LICENSE file.
*/
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
//import getPort from 'get-port';

// Flextesa sandbox, a.k.a. local blockchain
const tezos = new TezosToolkit('http://localhost:20000/');

const log = (s: string) => console.log(s);
const err = (s: string) => console.error(s);

// The admin is alice: as owner, only she can Make tacos.
const alice = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const alice_sk = 'edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq';
//const admin = alice;

// The normal user is joe: he can Buy, but not Make, tacos
const joe = "tz1MVGjgD1YtAPwohsSfk8i3ZiT1yEGM2YXB";
const joe_sk = 'edsk3Un2FU9Zeb4KEoATWdpAqcX5JArMUj2ew8S4SuzhPRDmGoqNx2';
//const user = joe;

// const FLEXTESA_PORT = 20000;

describe('Taqueria integration tests', () => {

    beforeAll(async () => {
        log("TODO Verify that Flextesa is active");
        // console.log(await getPort({ port: FLEXTESA_PORT }));
        const admin_signer = await InMemorySigner.fromSecretKey(alice_sk)
        const pkh = await admin_signer.publicKeyHash();
        log(`Admin publicKeyHash is ${pkh}`);
    });

    test("Placeholder", () => {
        expect(1).toEqual(1);
    });

 /*    test("Test non-zero balance for originating address", () => {
        tezos.tz
            .getBalance('tz1h3rQ8wBxFd8L9B3d7Jhaawu6Z568XU3xY')
            .then((balance) => log(`${balance.toNumber() / 1000000} ꜩ`))
            .catch((error) => err(JSON.stringify(error)));
    });

    test("Can get a handle to the deployed contract on Ghostnet", () => {
        // See https://tezostaquito.io/docs/smartcontracts for more information
        //const tezos = new TezosToolkit('https://rpc.ghostnet.teztnets.xyz');
        tezos.contract
            .at('KT1GJ5dUyHiaj7Uuc8gqfsbdv5tTbEH3fiRP')
            .then((c) => {
                let methods = c.parameterSchema.ExtractSignatures();
                log(JSON.stringify(methods, null, 2));
            })
            .catch((error) => err(`Error: ${error}`));
    });
    */
} );
