/*
  The integration tests in this module can be run with `$ npm run test:integration`.

  These tests verify interactions between the Dapp and Contract as deployed to the blockchain. They
  largely test the same functionality the Dapp uses, but outside of a web context.

  Note that there are also Front-End tests to verify the user interface, and Unit Tests to verify core
  Contract functionality. While each have their place, there is a bit of overlap.

  Without these Integration Tests, we would implicitly rely on the Front-End tests to verify
  integration with the blockchain; however, UI tests should really be concerned with widgets.

  All Contracts deployed (or, "originated") to Tezos have to come from a Wallet (or, "implicit
  address"). Furthermore, in order to originate a Contract, the Wallet has to have funds (Tez).

  An Account that originates a Contract is the de facto administrator for that contract. In our case,
  we need an admin to test that we can call `Make(number_of_tacos)` endpoint successfully. We also
  need a second, non-admin user in order to test buying tacos via the `Buy(number_of_tacos)` endpoint.

  In order to ensure that we always have funds in the originating/admin account, we use Taqueria's
  facility to dynamically create, instantiate and fund accounts in a given environment. To this end,
  the accounts are provisioned and funded in the local Flextesa sandbox on startup. This ensures that
  a representative set of tests work first time, to provide a decent basis for extension.

  Please see the top-level README file for more information.

  Copyright (c) 2023 ECAD Labs. All rights reserved.
  This software is licensed under the terms of the included LICENSE file.
*/
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { log, warn, err, stringify } from './test-helpers';
import  contract_json from './../contracts/contract.json';
import BigNumber from 'bignumber.js';
import type { Storage } from '../app/src/model';

describe('Taqueria integration tests', () => {

    // Flextesa sandbox, a.k.a. local blockchain
    const FLEXTESA_PORT = 21000;
    const tezos = new TezosToolkit(`http://localhost:${FLEXTESA_PORT}/`);

    // The owner/originator/admin/chef is alice: only she can Make tacos
    const alice = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    const alice_sk = 'edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq';
    //const admin = alice;

    // A normal (i.e. non-admin) user is joe: he can Buy, but not Make, tacos
    const joe = "tz1MVGjgD1YtAPwohsSfk8i3ZiT1yEGM2YXB";
    const joe_sk = 'edsk3Un2FU9Zeb4KEoATWdpAqcX5JArMUj2ew8S4SuzhPRDmGoqNx2';
    //const user = joe;

    // The hello-tacos contract is originated to the Flextesa sandbox on startup
    // const hello_tacos = 'KT19otbQ8ZAv2UVDj9ZfR6ohPhXC6VgYH54t';
    // const hello_tacos = 'KT1TDeSDJTAHi2Qc9K1eEPYuiGYUYiV1qewA';
    const hello_tacos = 'KT1PC4AJRHMzsLL1S6Ry49GXRP64rFp5sP2h';

    // TODO Amalgamate into an immutable <contract,address> pair?
    let address: string;

    async function originateContract() {
        tezos.contract
            .originate({
                code: contract_json,
                storage: {
                    available_tacos: new BigNumber(42),
                    admin: alice,
                },
            })
            .then((originationOp) => {
                log(`Waiting for confirmation of origination for ${originationOp.contractAddress}...`);
                return originationOp.contract();
            })
            .then((contract) => {
                address = contract.address;
                log(`Origination succeeded to ${address}`);
            })
            .catch((error) => err(`Error originating contract: ${error}`));
    }

    const TEST_TIME_OUT = 5000;
    const ADDRESS_LENGTH = 36;

    beforeAll(async () => {
        warn("TODO Verify that Flextesa is active, otherwise bark loudly and exit");
        const admin_signer = await InMemorySigner.fromSecretKey(alice_sk);
        tezos.setSignerProvider(admin_signer);
        const pkh = await admin_signer.publicKeyHash();
        expect(pkh).toEqual(alice);
        log(`Admin alice publicKeyHash is the expected ${pkh}`);
        //await originateContract();
        //log(`beforeAll is DONE, address is ${address}`);
    }, TEST_TIME_OUT);

    test('We can see the expected methods in the hello_tacos Contract', async () => {
        await tezos.contract
            .at(hello_tacos)
            .then((c) => {
                let raw = JSON.stringify(c.parameterSchema.ExtractSignatures());
                expect(raw.includes("make"));
                expect(raw.includes("buy"));
            })
            .catch((error) => err(error));
    }, TEST_TIME_OUT);

    test('We can read the contract storage', async () => {
        const contract = await tezos.wallet.at(hello_tacos);
        const storage: Storage | undefined = await contract?.storage();
         if (storage) {
             log(`Admin is ${storage.admin} and available_tacos is ${storage.available_tacos}`);
             expect(storage.admin).toHaveLength(ADDRESS_LENGTH);
             expect(storage.admin).toMatch(/tz[1-3][1-9A-HJ-NP-Za-km-z]{33}/);
             expect(storage.available_tacos.toNumber()).toBeGreaterThan(0);
        }
        !storage && fail('Could not read Contract storage');
    }),

    test('Admin has funds for originate, Make operations', async () => {
        await tezos.tz
            .getBalance(alice)
            .then((balance) => {
                log(`alice has ${balance} available`);
                const arbitraryThreshold = 100; // enough to originate, buy and make tacos
                expect(balance.toNumber()).toBeGreaterThan(arbitraryThreshold)
            })
            .catch((error) => err(`Error getting balance: ${stringify(error)}`));
        log('Admin has funds test is DONE');
    }, TEST_TIME_OUT);

    test('User has funds for Buy operation', async () => {
        await tezos.tz
            .getBalance(joe)
            .then((balance) => {
                log(`joe has ${balance} available`);
                const arbitraryThreshold = 10; // enough to buy tacos
                expect(balance.toNumber()).toBeGreaterThan(arbitraryThreshold)
            })
            .catch((error) => err(`Error getting balance: ${stringify(error)}`));
        log('User has funds to Buy tacos is DONE');
    }, TEST_TIME_OUT);

    test('Alice can Make(number_of_tacos)', () => {
        tezos.contract
            .at(hello_tacos)
            .then((contract) => {
                contract.methods.make(42).send();
                // TODO Retrieve storage and verify we successfully made tacos
            })
            .catch((error) => console.log(`Error: ${error}`));
    });
    /*
    test('Joe can Buy(1) taco', () => {
        // TODO Verify that we have more than one taco before proceeding
        tezos.contract
            .at(hello_tacos)
            .then((contract) => {
                contract.methods.buy(1);
                // TODO Retrieve storage and verify we successfully bought 1 taco
            })
            .catch((error) => console.log(`Error: ${error}`));
    });
    test.todo('Joe can Buy(all tacos)');
    test.todo('Joe can Buy(0 tacos)');
    test.todo('Alice can Buy(number_of_tacos)');
    test.todo('Joe can Buy(all), Alice can Make(more), and Joe can Buy(some)');
 */});
