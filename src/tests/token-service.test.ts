import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as bs58 from "bs58";

require("dotenv").config();

let keypair: any;

beforeAll(() => {
  keypair = web3.Keypair.generate();
});

test("test create token", async () => {
  const testToken = "testTokenAccountPubkeyxxxxxxxxxxxxxxxxxxxxx";
  const testTokenPubkey = new web3.PublicKey(testToken);
  const testTokenAccountPubkey = new web3.PublicKey(
    "testTokenAccountPubkeyxxxxxxxxxxxxxxxxxxxxx"
  );
  const mockCreateMint = jest.fn().mockResolvedValue(testTokenPubkey);
  const testTokenAccount = {
    address: testTokenAccountPubkey,
    mint: testTokenPubkey,
    owner: keypair.publicKey,
    amount: 42,
    delegate: <any>null,
    delegatedAmount: 42,
    isInitialized: true,
    isFrozen: false,
    isNative: true,
    rentExemptReserve: <any>null,
    closeAuthority: <any>null,
    tlvData: Buffer,
  };

  const mockGetTokenAccount = jest.fn().mockResolvedValue(testTokenAccount);

  jest.mock("@solana/spl-token", () => {
    return {
      ...jest.requireActual("@solana/spl-token"),
      createMint: mockCreateMint,
      getOrCreateAssociatedTokenAccount: mockGetTokenAccount,
    };
  });

  const services = require("../services");

  const token = await new services.TokenService().createToken(
    keypair.publicKey.toString(),
    bs58.encode(keypair.secretKey)
  );

  expect(token).toBe(testToken);
});
