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

    // TODO Replace this with the address of the deployed contract on Flextesa
    const hello_tacos = 'KT1PC4AJRHMzsLL1S6Ry49GXRP64rFp5sP2h';

    // TODO Amalgamate into an immutable <contract,address> pair?
    let address: string;
/*
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
*/
    const TEST_TIME_OUT = 5000;

    // Helper
    async function taco_count(): Promise<number> {
        const contract = await tezos.wallet.at(hello_tacos);
        const storage: Storage | undefined = await contract?.storage();
        !storage && fail('Could not read Contract storage');
        return storage!.available_tacos.toNumber();
    }

    // Helper
    async function make_tacos(count?: number): Promise<number> {
        tezos.contract
            .at(hello_tacos)
            .then((contract) => {
                contract.methods.make(count ?? TACOS_TO_MAKE).send();
            })
            .catch((error) => console.log(`Error: ${error}`));
        return await taco_count();
    }

    beforeAll(async () => {
        warn("TODO Verify that Flextesa is active, otherwise bark loudly and exit");
        const admin_signer = await InMemorySigner.fromSecretKey(alice_sk);
        tezos.setSignerProvider(admin_signer);
        const pkh = await admin_signer.publicKeyHash();
        expect(pkh).toEqual(alice);
        log(`Admin alice publicKeyHash is the expected ${pkh}`);
        // await originateContract(); // Try dynamically so we get an idempotent setup?
        log(`beforeAll is DONE, address is ${address}`);
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
             expect(storage.admin).toMatch(/tz[1-3][1-9A-HJ-NP-Za-km-z]{33}/);
             expect(storage.available_tacos.toNumber()).toBeGreaterThanOrEqual(0);
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

    const TACOS_TO_MAKE = 42;
    test(`Admin can Make ${TACOS_TO_MAKE} tacos`, async () => {
        const taco_count_before = await taco_count();
        log(`taco_count_before: ${taco_count_before}`);
        tezos.contract
            .at(hello_tacos)
            .then((contract) => {
                // TODO How do we set sender? How do we validate only admin/sender can Make()?
                contract.methods.make(TACOS_TO_MAKE).send();
            })
            .catch((error) => console.log(`Error: ${error}`));
        const taco_count_after = await taco_count();
        log(`taco_count_after: ${taco_count_after}`);
        expect(taco_count_after).toEqual(taco_count_before + TACOS_TO_MAKE);
    });

    test('Can Buy 1 taco', async () => {
        const taco_count_before: number = await taco_count();
        // Assert precondition
        expect(taco_count_before).toBeGreaterThan(0);
        tezos.contract
            .at(hello_tacos)
            .then((contract) => {
                contract.methods.buy(1).send();
            })
            .catch((error) => console.log(`Error: ${error}`));
        // Assert storage was updated
        const taco_count_after = await taco_count();
        expect(taco_count_after).toBe(taco_count_before - 1);
    });

    test('Can Buy all tacos', async () => {
        const taco_count_before: number = await taco_count();
        // Assert precondition
        expect(taco_count_before).toBeGreaterThan(0);
        tezos.contract
            .at(hello_tacos)
            .then((contract) => {
                contract.methods.buy(taco_count_before).send();
            })
            .catch((error) => console.log(`Error: ${error}`));
        // Assert storage was updated
        const taco_count_after = await taco_count();
        expect(taco_count_after).toBe(0);
    });

    test('Can Buy 0 tacos', async () => {
        await make_tacos(TACOS_TO_MAKE);
        const taco_count_before: number = await taco_count();
        expect(taco_count_before).toBeGreaterThan(0);
        tezos.contract
            .at(hello_tacos)
            .then((contract) => {
                contract.methods.buy(0).send();
            })
            .catch((error) => console.log(`Error: ${error}`));
        const taco_count_after = await taco_count();
        expect(taco_count_after).toBe(taco_count_before);
    });

    // TODO Finally, test a short round-trip
    test.todo('Joe can Buy(all), Alice can Make(more), and Joe can Buy(some)');
    test.todo('Check that admin can also buy tacos :shrug:');
});
