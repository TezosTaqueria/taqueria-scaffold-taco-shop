const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");
const config = require('../.taq/config.json')

describe("JavaScript tests for Hello Tacos contract", () => {
  let Tezos;
  let signer;
  let helloTacosAddress;
  const {alice} = config.sandbox.local.accounts
  const {bob} = config.sandbox.local.accounts
  const {rpcUrl} = config.sandbox.local
  const originalNrOfTacos = 100;

  jest.setTimeout(50000);

  beforeAll(async () => {
    Tezos = new TezosToolkit(rpcUrl);
    signer = new InMemorySigner(alice.keys.secretKey.replace(/unencrypted:/, ''));
    Tezos.setSignerProvider(signer);
    const op = await Tezos.contract.transfer({ to: bob.keys.publicKey, amount: 1 });
    await op.confirmation();
  });

  test("Should originate the Hello Tacos contract", async () => {
    const {readFile} = require('fs/promises')
    const {join} = require('path')
    const contractFile = join(config.artifactsDir, 'hello-tacos.tz')
    const originationOp = await Tezos.contract.originate({
      code: await readFile(contractFile, {encoding:'utf8'}),
      storage: originalNrOfTacos
    });
    await originationOp.confirmation();

    expect(originationOp.hash).toBeDefined();
    expect(originationOp.includedInBlock).toBeLessThan(
      Number.POSITIVE_INFINITY
    );
    expect(originationOp.contractAddress).toBeDefined();

    helloTacosAddress = originationOp.contractAddress;
  });

  test("Should buy 15 tacos", async () => {
    const contract = await Tezos.contract.at(helloTacosAddress);
    const storage = await contract.storage();
    expect(+storage).toEqual(originalNrOfTacos);

    const op = await contract.methods.default(15).send();
    await op.confirmation();
    const newStorage = await contract.storage();
    expect(op.hash).toBeDefined();
    expect(op.includedInBlock).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(+newStorage).toEqual(originalNrOfTacos - 15);
  });

  test("Should prevent buying tacos if unavailable", async () => {
    const contract = await Tezos.contract.at(helloTacosAddress);
    expect(async () => {
      const op = await contract.methods.default(originalNrOfTacos).send();
      await op.confirmation();
    }).rejects.toMatchObject({ message: "NOT_ENOUGH_TACOS" });
  });
});