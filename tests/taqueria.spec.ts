const { exec1 } = require('node:child_process');
const util = require('node:util');
const exec = util.promisify(exec1);

describe('E2E Testing for taqueria action', () => {
	test('Verify that taqueria flextesa plugin can return list of accounts from the local sandbox', async () => {
		const accounts = await exec(`taq list accounts local`, { cwd: `./` });
		expect(accounts.stdout).toContain('bob');
        expect(accounts.stdout).toContain('alice');
        expect(accounts.stdout).toContain('john');
        expect(accounts.stdout).toContain('jane');
        expect(accounts.stdout).toContain('joe');
	});

    test('Verify that taqueria can compile a previously registered contract', async () => {
		const accounts = await exec(`taq compile`, { cwd: `./` });
		expect(accounts.stdout).toContain('artifacts/hell-tacos.tz');
	});

    test('Verify that taqueria can originate a contract to the local sandbox', async () => {
        const contractName = 'hello-tacos.tz'

		const contractOriginate = await exec(`taq originate ${contractName}`, { cwd: `./` });
        expect(contractOriginate.stdout).toContain(contractName);
		expect(contractOriginate.stdout).toContain('local');

        const contractHash = contractOriginate.stdout.split('\n')
        .find(line => line.includes(contractName))
        ?.split('│')[2]
        .trim()

        const sandboxContractContents = await exec(`http://localhost:20000/chains/main/blocks/head/context/contracts/${contractHash}`)
        expect(sandboxContractContents.stdout).toContain('"storage":{"int":"42"}')

	});
});



