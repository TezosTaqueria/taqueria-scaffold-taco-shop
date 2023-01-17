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
import { Schema } from '@taquito/michelson-encoder';
import { InMemorySigner } from '@taquito/signer';
import { log, warn, err } from './test-helpers';
import  contract_json from './../contracts/contract.json';

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
    const hello_tacos = 'KT19otbQ8ZAv2UVDj9ZfR6ohPhXC6VgYH54t';
    const storageSchema = new Schema({ prim: 'nat' }); // number_of_tacos

    const stringify = (error) => JSON.stringify(error);

    // TODO Amalgamate into an immutable <contract,address> pair?
    let address: string;

/*     async function originateContract() {
        tezos.contract
            .originate({
                code: contract_json,
                storage: {
                    available_tacos: 42,
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
    const TIME_OUT = 10000;

    beforeAll(async () => {
        warn("TODO Verify that Flextesa is active, otherwise bark loudly and exit");
        const admin_signer = await InMemorySigner.fromSecretKey(alice_sk);
        tezos.setSignerProvider(admin_signer);
        const pkh = await admin_signer.publicKeyHash();
        expect(pkh).toEqual(alice);
        log(`Admin alice publicKeyHash is the expected ${pkh}`);
        //await originateContract();
        //log(`beforeAll is DONE, address is ${address}`);
    }, TIME_OUT);

    test("Sanity check jest setup: this should pass", () => {
        expect(1).toEqual(1);
        err('Calling err in a test is ok!: It just *prints* to stderr');
    });

    test('Admin has funds for originate operation', async () => {
        await tezos.tz
            .getBalance(alice)
            .then((balance) => {
                const arbitraryThreshold = 100; // enough for our purposes
                expect(balance).toBeGreaterThan(arbitraryThreshold)
                log(`alice has ${balance} available`);
            })
            .catch((error) => err(`Error getting balance: ${stringify(error)}`));
        log('Admin has funds test is DONE');
    }, TIME_OUT);

     test('We can get a handle to the Contract', async () => {
        await tezos.contract
            .at(hello_tacos)
            .then((c) => {
                let methods = c.parameterSchema.ExtractSignatures();
                log(JSON.stringify(methods, null, 2));
            })
            .catch((error) => err(error));
     }, TIME_OUT);

    test.todo('Alice can Make(number_of_tacos)');
    test.todo('Joe can Buy(number_of_tacos)');
    test.todo('Joe can Buy(all tacos)');
    test.todo('Joe can Buy(0 tacos)');
    test.todo('Alice can Buy(number_of_tacos)');
    test.todo('Joe can Buy(all), Alice can Make(more), and Joe can Buy(some)');
});
