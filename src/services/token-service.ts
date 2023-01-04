import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as bs58 from "bs58";
import * as dotenv from "dotenv";
import vault from "vault-api";

dotenv.config();

class TokenService {
  private decimals: number = 9;
  private connection: web3.Connection;

  constructor() {
    this.connection = new web3.Connection(
      web3.clusterApiUrl(<web3.Cluster>process.env.SOLANA_CLUSTER)
    );
  }

  async createToken(ownerId: number) {
    let adminKeypair;
    let vaultData;
    try {
      vaultData = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/wallets/${ownerId}`,
      });
      adminKeypair = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/admin/${process.env.SOLANA_CLUSTER}`,
      });
    } catch (e) {
      return {
        error: `Owner ${ownerId}, statusText: ${e.response.statusText}`,
      };
    }

    console.log(`Creating token (ownerId=${ownerId})`);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(adminKeypair.data.secretKey)
    );

    const owner = new web3.PublicKey(vaultData.data.publicKey);

    const mint = await splToken.createMint(
      this.connection,
      payer,
      owner,
      payer.publicKey,
      this.decimals
      // splToken.TOKEN_PROGRAM_ID
    );
    console.log(`Mint (${mint.toString()}) created`);
    const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      this.connection,
      payer,
      mint,
      owner
    );
    console.log(`Token account (${tokenAccount}) created`);
    return mint.toString();
  }

  async mintToken(
    mintPubkey: string,
    ownerId: number,
    destinationId: number,
    amount: number
  ) {
    console.log(
      `Minting ${amount} tokens (${mintPubkey}) to (destinationId=${destinationId})`
    );
    let vaultData;
    let adminKeypair;
    let vaultDataDestination;
    try {
      vaultData = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/wallets/${ownerId}`,
      });
      vaultDataDestination = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/wallets/${destinationId}`,
      });

      adminKeypair = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/admin/${process.env.SOLANA_CLUSTER}`,
      });
    } catch (e) {
      return {
        error: `Owner ${ownerId}, failed fetching from vault`,
      };
    }
    console.log("Successfully retrieved owner secret from vault");

    const owner = web3.Keypair.fromSecretKey(
      bs58.decode(vaultData.data.secretKey)
    );

    const destination = new web3.PublicKey(vaultDataDestination.data.publicKey);
    const mint = new web3.PublicKey(mintPubkey);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(adminKeypair.data.secretKey)
    );

    const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      this.connection,
      payer,
      mint,
      destination,
      true
    );

    console.log(`Started minting ${amount} tokens (${mintPubkey})`);
    await splToken.mintTo(
      this.connection,
      payer,
      mint,
      tokenAccount.address,
      owner,
      amount * 10 ** this.decimals
    );
    console.log(`Done minting ${amount} ${mintPubkey}`);
    return { status: "ok" };
  }

  async createAccount(userId: number) {
    //generate keypair and airdrop 1000000000 Lamports (1 SOL)
    const myKeypair = web3.Keypair.generate();
    await this.connection.requestAirdrop(myKeypair.publicKey, 1000000000);

    console.log(
      `Created new keypair (publicKey=${myKeypair.publicKey.toString()})`
    );

    let resp;
    try {
      resp = await vault({
        method: "write",
        path: `secret/wallets/${userId}`,
        data: {
          secretKey: bs58.encode(myKeypair.secretKey),
          publicKey: myKeypair.publicKey.toString(),
        },
      });
    } catch (e) {
      return {
        error: `failed writing secret to vault`,
      };
    }

    console.log("Successfully saved keypair to vault");

    return {
      publicKey: myKeypair.publicKey.toString(),
      secretKey: bs58.encode(myKeypair.secretKey),
    };
  }

  async getWalletInfo(userId: number) {
    let vaultData;
    try {
      vaultData = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/wallets/${userId}`,
      });
    } catch (e) {
      return {
        error: `failed fetching secrets from vault`,
      };
    }

    let ownerPubkey = new web3.PublicKey(vaultData.data.publicKey);

    let accounts;
    try {
      accounts = await this.connection.getTokenAccountsByOwner(ownerPubkey, {
        programId: splToken.TOKEN_PROGRAM_ID,
      });
    } catch (e) {
      return {
        error: `error`,
      };
    }

    let accountData = accounts.value.map((account) => {
      const parsedAccountInfo = splToken.AccountLayout.decode(
        account.account.data
      );

      const mintAddress = parsedAccountInfo.mint;
      const tokenBalance = Number(
        parsedAccountInfo.amount / BigInt(10 ** this.decimals)
      );
      return { mint: mintAddress, balance: tokenBalance };
    });

    return accountData;
  }

  async getWallets() {
    let vaultData;
    try {
      vaultData = await vault({
        method: "list", // method paramaeter is case-sensitive.
        path: `secret/wallets`,
      });
    } catch (e) {
      return {
        error: `failed fetching secrets from vault`,
      };
    }
    return vaultData.data.keys.map(Number);
  }
}

export default TokenService;
