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
import { RpcClient } from '@taquito/rpc';
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import type { Storage } from '../app/src/model';
import { err, log, stringify, warn } from './test-helpers';

// A JSON file containing metadata about the Flextesa sandbox / development environment
import config from '../.taq/config.local.development.json';

describe('Taqueria integration tests', () => {

    // Flextesa sandbox, a.k.a. local blockchain
    const FLEXTESA_PORT = 21000;
    const FLEXTESA_URI = `http://localhost:${FLEXTESA_PORT}`;

    // The owner/originator/admin/chef is alice: only she can Make tacos
    const alice = config.accounts.alice.publicKeyHash;
    // We can't use config for this value, because there is a prefix in the key for technical reasons
    const alice_sk = 'edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq';

    // A normal (i.e. non-admin) user is joe: he can Buy, but not Make, tacos
    const joe = config.accounts.joe.publicKeyHash;

    // Each time the contract is origanated to `development`, this value is dynamically updated
    const hello_tacos = config.aliases['hello-tacos'].address;

    const tezos = new TezosToolkit(FLEXTESA_URI);
    const admin_signer = new InMemorySigner(alice_sk);
    tezos.setSignerProvider(admin_signer);

    const TEST_TIME_OUT = 5000;

    // Helper
    async function taco_count(): Promise<number> {
        const contract = await tezos.contract.at(hello_tacos);
        const storage: Storage | undefined = await contract?.storage();
        !storage && fail('Could not read Contract storage');
        return storage!.available_tacos.toNumber();
    }

    // Helper
    async function make_tacos(count?: number): Promise<number> {
        //log(getAliasAddress(config, "hello-tacos"));
        await tezos.contract
            .at(hello_tacos)
            .then((contract) => contract.methods.make(count ?? TACOS_TO_MAKE).send())
            .then((op) => op.confirmation())
            .catch((error) => console.log(`Error: ${error}`));
        return await taco_count();
    }

    beforeAll(async () => {
        warn("TODO: Verify that Flextesa is active, otherwise bark loudly and exit");
        const pkh = await admin_signer.publicKeyHash();
        expect(pkh).toEqual(alice);
        // log(`Admin alice publicKeyHash is the expected ${pkh}`);
    }, TEST_TIME_OUT);

    afterAll(async () => await make_tacos(TACOS_TO_MAKE));

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
        const contract = await tezos.contract.at(hello_tacos);
        const storage: Storage | undefined = await contract?.storage();
         if (storage) {
             // log(`Admin is ${storage.admin} and available_tacos is ${storage.available_tacos}`);
             expect(storage.admin).toMatch(/tz[1-3][1-9A-HJ-NP-Za-km-z]{33}/);
             expect(storage.available_tacos.toNumber()).toBeGreaterThanOrEqual(0);
        }
        !storage && fail('Could not read Contract storage');
    }),

    test('Admin has funds for originate, Make operations', async () => {
        await tezos.tz
            .getBalance(alice)
            .then((balance) => {
                // log(`alice has ${balance} available`);
                const arbitraryThreshold = 100; // enough to originate, buy and make tacos
                expect(balance.toNumber()).toBeGreaterThan(arbitraryThreshold)
            })
            .catch((error) => err(`Error getting balance: ${stringify(error)}`));
    }, TEST_TIME_OUT);

    test('User has funds for Buy operation', async () => {
        await tezos.tz
            .getBalance(joe)
            .then((balance) => {
                // log(`joe has ${balance} available`);
                const arbitraryThreshold = 10; // enough to buy tacos
                expect(balance.toNumber()).toBeGreaterThan(arbitraryThreshold)
            })
            .catch((error) => err(`Error getting balance: ${stringify(error)}`));
    }, TEST_TIME_OUT);

    const TACOS_TO_MAKE = 42;
    test(`Admin can Make ${TACOS_TO_MAKE} tacos`, async () => {
        const taco_count_before = await taco_count();
        // log(`taco_count_before: ${taco_count_before}`);
        await tezos.wallet
            .at(hello_tacos)
            // TODO How do we set sender? How do we validate only admin/sender can Make()?
            .then((contract) => contract.methods.make(TACOS_TO_MAKE).send())
            .then((op) => op.confirmation())
            .catch((error) => console.log(`Error: ${error}`));
        const taco_count_after: number = await taco_count();
        // log(`taco_count_after: ${taco_count_after}`);
        expect(taco_count_after).toEqual(taco_count_before + TACOS_TO_MAKE);
    });

    test('Can Buy 1 taco', async () => {
        const taco_count_before = await taco_count();
        // Assert precondition
        expect(taco_count_before).toBeGreaterThan(0);
        await tezos.contract
            .at(hello_tacos)
            .then((contract) => contract.methods.buy(1).send())
            .then((op) => op.confirmation())
            .catch((error) => console.log(`Error: ${error}`));
        // Assert storage was updated
        const taco_count_after = await taco_count();
        expect(taco_count_after).toBe(taco_count_before - 1);
    });

    test('Can Buy 0 tacos', async () => {
        await make_tacos();
        const taco_count_before: number = await taco_count();
        expect(taco_count_before).toBeGreaterThan(0);
        await tezos.contract
            .at(hello_tacos)
            .then((contract) => contract.methods.buy(0).send())
            .then((op) => op.confirmation())
            .catch((error) => console.log(`Error: ${error}`));
        const taco_count_after = await taco_count();
        expect(taco_count_after).toBe(taco_count_before);
    });

    test('Can Buy all tacos', async () => {
        const taco_count_before = await taco_count();
        // log(`taco_count_before: ${taco_count_before}`);
        // Assert precondition
        expect(taco_count_before).toBeGreaterThan(0);
        await tezos.contract
            .at(hello_tacos)
            .then((contract) => contract.methods.buy(taco_count_before).send())
            .then((op) => op.confirmation())
            .catch((error) => console.log(`Error: ${error}`));
        // Assert storage was updated
        const taco_count_after = await taco_count();
        expect(taco_count_after).toBe(0);
    });

    // A lower-level way to interact with a Wallet
    test('Get balance via RpcClient', async () => {
        const client = new RpcClient(FLEXTESA_URI);
        const balance = await client.getBalance(alice);
        log(`Balance: ${balance}`);
    });

    // A lower-level way of interacting with a Contract
    test('Get storage via RpcClient', async () => {
        const client = new RpcClient(FLEXTESA_URI);
        const storage = await client.getStorage(hello_tacos);
        log(`Storage: ${stringify(storage)}`);
    });

    // TODO Finally, test a short round-trip
    test.todo('Joe can Buy(all), Alice can Make(more), and Joe can Buy(some)');
    test.todo('Check that admin can also buy tacos :shrug:');
});
