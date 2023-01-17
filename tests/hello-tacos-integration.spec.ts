/*
  Run the tests in here with `$ npm run test:integration`.

  These Integration Tests verify interactions between the Dapp and Contract as deployed to the
  blockchain. They aim to test the same functionality the Dapp uses, but outside of a web context.

  Note that the Dapp has both Front-End tests that verify the user interface, and Unit Tests to
  verify core Contract functionality. Each have their place, although there are small overlaps.

  Without these integration tests, we would implicitly rely on the Front-End tests to verify
  integration with the blockchain; however, those should only really be concerned with widgets.

  All Contracts deployed (or, "originated") to Tezos have to come from a Wallet (or, "implicit")
  address. Furthermore, in order to deploy a contract, the Wallet has to have some funds in it.

  An Account that originates a Contract is the de facto administrator for that contract. For one,
  we need an admin user to test that we can call the `Make(number_of_tacos)` endpoint successfully.
  We also need a second, non-admin user in order to test buying tacos via the `Buy(number_of_tacos)`
  endpoint.

  In order to ensure that we always have funds in the originating/admin account, we use Taqueria's
  facility to dynamically create, instantiate and fund accounts in a given environment. To this end,
  the accounts are provisioned and funded in the local Flextesa sandbox on startup. This ensures
  that a representative set of tests work first time, to provide a decent basis for extension.

  Please see the top-level README file for more information.

  Copyright (c) 2023 ECAD Labs. All rights reserved.
  This software is licensed under the terms of the included LICENSE file.
*/
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { log, warn, err } from './test-helpers';

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

    beforeAll(async () => {
        warn("TODO Verify that Flextesa is active, otherwise bark loudly and exit");
        const admin_signer = await InMemorySigner.fromSecretKey(alice_sk);
        tezos.setSignerProvider(admin_signer);
        const pkh = await admin_signer.publicKeyHash();
        expect(pkh).toEqual(alice);
        log(`Admin alice publicKeyHash is the expected ${pkh}`);
    });

    test("Sanity check that jest is setup: this should always pass!", () => {
        expect(1).toEqual(1);
        err('Calling err in a test is ok!: it just prints to stderr');
    });

    test('Admin has funds for originate operation', async () => {
        await tezos.tz
            .getBalance(alice)
            .then((balance) => {
                const arbitraryThreshold = 100;
                expect(balance).toBeGreaterThan(arbitraryThreshold)
                log(`alice has ${balance} available`);
            })
            .catch((error) => err(JSON.stringify(error)));
        log('Admin has funds test is DONE');
    });

/*     test('We can get a handle to the Contract', async () => {
        await tezos.contract
            .at(hello_tacos)
            .then((c) => {
                let methods = c.parameterSchema.ExtractSignatures();
                log(JSON.stringify(methods, null, 2));
            })
            .catch((error) => err(error));
    });
 */
});
