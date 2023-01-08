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
    let ownerData;
    try {
      ownerData = await this.fetchWalletFromVault(ownerId);
      adminKeypair = await this.fetchAdminKeypairFromVault();
    } catch (e) {
      let msg = `failed fetching from vault`;
      console.error(msg);
      return {
        error: msg,
      };
    }

    console.log(`Creating token (ownerId=${ownerId})`);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(adminKeypair.secretKey)
    );

    const owner = new web3.PublicKey(ownerData.publicKey);

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
    this.mintToken(mint.toString(), ownerId, ownerId, 10);
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
    let ownerData;
    let adminKeypair;
    let destinationData;

    try {
      ownerData = await this.fetchWalletFromVault(ownerId);
      destinationData = await this.fetchWalletFromVault(destinationId);
      adminKeypair = await this.fetchAdminKeypairFromVault();
    } catch (e) {
      let msg = `failed fetching from vault`;
      console.error(msg);
      return {
        error: msg,
      };
    }
    console.log("Successfully retrieved owner secret from vault");

    const owner = web3.Keypair.fromSecretKey(bs58.decode(ownerData.secretKey));

    const destination = new web3.PublicKey(destinationData.publicKey);
    const mint = new web3.PublicKey(mintPubkey);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(adminKeypair.secretKey)
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
    let walletData = await this.fetchWalletFromVault(userId);

    if (walletData.publicKey && walletData.secretKey) {
      return {
        publicKey: walletData.publicKey,
        secretKey: walletData.secretKey,
      };
    }

    //generate keypair and airdrop 1000000000 Lamports (1 SOL)
    const myKeypair = web3.Keypair.generate();
    await this.connection.requestAirdrop(myKeypair.publicKey, 1000000000);

    console.log(
      `Created new keypair (publicKey=${myKeypair.publicKey.toString()})`
    );

    try {
      await vault({
        method: "write",
        path: `secret/wallets/${userId}`,
        data: {
          secretKey: bs58.encode(myKeypair.secretKey),
          publicKey: myKeypair.publicKey.toString(),
        },
      });
    } catch (e) {
      let msg = `failed fetching from vault`;
      console.error(msg);
      return {
        error: msg,
      };
    }

    console.log("Successfully saved keypair to vault");

    return {
      publicKey: myKeypair.publicKey.toString(),
      secretKey: bs58.encode(myKeypair.secretKey),
    };
  }

  async getWalletInfo(userId: number) {
    let walletData;
    let walletExists = true;
    try {
      walletData = await this.fetchWalletFromVault(userId);
    } catch (e) {
      walletExists = false;
    }

    if (!walletExists || Object.keys(walletData).length === 0) {
      let msg = `failed fetching from vault`;
      console.error(msg);
      return {
        error: msg,
      };
    }

    let ownerPubkey = new web3.PublicKey(walletData.publicKey);

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
      let msg = `failed fetching from vault`;
      console.error(msg);
      return {
        error: msg,
      };
    }
    return vaultData.data.keys.map(Number);
  }

  async fetchWalletFromVault(userId: number) {
    let vaultData;
    console.log(`Fetching data for userId=${userId} from vault`);
    try {
      vaultData = await vault({
        method: "read", // method paramaeter is case-sensitive.
        path: `secret/wallets/${userId}`,
      });
    } catch (e) {
      if (e.response.status == 404) {
        return {};
      } else {
        throw e;
      }
    }

    return {
      publicKey: vaultData.data.publicKey,
      secretKey: vaultData.data.secretKey,
    };
  }

  async fetchAdminKeypairFromVault() {
    console.log(`Fetching admin keypair from vault`);
    let adminKeypair = await vault({
      method: "read", // method paramaeter is case-sensitive.
      path: `secret/admin/${process.env.SOLANA_CLUSTER}`,
    });

    return {
      secretKey: adminKeypair.data.secretKey,
    };
  }
}

export default TokenService;
