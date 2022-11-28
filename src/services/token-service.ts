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

  async createToken(ownerPubkey: string) {
    console.log(`Creating token (ownerPubkey=${ownerPubkey})`);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(<web3.Cluster>process.env.SOLANA_ADMIN_KEYPAIR)
    );

    const owner = new web3.PublicKey(ownerPubkey);

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
    ownerPubkey: string,
    destinationPubkey: string,
    amount: number
  ) {
    console.log(
      `Minting ${amount} tokens (${mintPubkey}) to (destinationPubkey=${destinationPubkey})`
    );
    let vaultData;
    try {
      vaultData = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/${ownerPubkey}`,
      });
    } catch (e) {
      return {
        error: `Owner ${ownerPubkey}, statusText: ${e.response.statusText}`,
      };
    }
    console.log("Successfully retrieved owner secret from vault");

    const owner = web3.Keypair.fromSecretKey(
      bs58.decode(vaultData.data.secretKey)
    );

    const destination = new web3.PublicKey(destinationPubkey);
    const mint = new web3.PublicKey(mintPubkey);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(<web3.Cluster>process.env.SOLANA_ADMIN_KEYPAIR)
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

  async createAccount() {
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
        path: `secret/${myKeypair.publicKey.toString()}`,
        data: {
          secretKey: bs58.encode(myKeypair.secretKey),
        },
      });
    } catch (e) {
      return {
        error: `statusText: ${e.response.statusText}`,
      };
    }

    console.log("Successfully saved keypair to vault");

    return {
      publicKey: myKeypair.publicKey.toString(),
      secretKey: bs58.encode(myKeypair.secretKey),
    };
  }

  async getAccounts(ownerPubkey: string) {
    const accounts = await this.connection.getTokenAccountsByOwner(
      new web3.PublicKey(ownerPubkey),
      {
        programId: splToken.TOKEN_PROGRAM_ID,
      }
    );

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
}

export default TokenService;
