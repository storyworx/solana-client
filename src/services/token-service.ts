import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as bs58 from "bs58";
import * as dotenv from "dotenv";

dotenv.config();

class TokenService {
  private decimals: number = 9;
  constructor() {}

  async createToken(ownerPubkey: string) {
    const connection = new web3.Connection(
      web3.clusterApiUrl(<web3.Cluster>process.env.SOLANA_CLUSTER)
    );

    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(<web3.Cluster>process.env.SOLANA_ADMIN_KEYPAIR)
    );

    const owner = new web3.PublicKey(ownerPubkey);

    const mint = await splToken.createMint(
      connection,
      payer,
      owner,
      null,
      this.decimals
      // splToken.TOKEN_PROGRAM_ID
    );
    const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
    );
    return mint.toString();
  }

  async mintToken(mintPubkey: string, ownerPubkey: string, amount: number) {
    const connection = new web3.Connection(
      web3.clusterApiUrl(<web3.Cluster>process.env.SOLANA_CLUSTER)
    );
    const mint = new web3.PublicKey(mintPubkey);
    const owner = new web3.PublicKey(ownerPubkey);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(<web3.Cluster>process.env.SOLANA_ADMIN_KEYPAIR)
    );
    const authority = new web3.PublicKey(payer.publicKey);

    const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
    );

    await splToken.mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer.publicKey,
      amount * 10 ** this.decimals
    );
  }

  async createAccount() {
    const connection = new web3.Connection(
      web3.clusterApiUrl(<web3.Cluster>process.env.SOLANA_CLUSTER)
    );

    //generate keypair and airdrop 1000000000 Lamports (1 SOL)
    const myKeypair = web3.Keypair.generate();
    await connection.requestAirdrop(myKeypair.publicKey, 1000000000);

    return {
      publicKey: myKeypair.publicKey.toString(),
      secretKey: bs58.encode(myKeypair.secretKey),
    };
  }

  async getAccounts(ownerPubkey: string) {
    const connection = new web3.Connection(
      web3.clusterApiUrl(<web3.Cluster>process.env.SOLANA_CLUSTER)
    );

    const filters: web3.GetProgramAccountsFilter[] = [
      {
        dataSize: 165, //size of account (bytes)
      },
      {
        memcmp: {
          offset: 32, //location of our query in the account (bytes)
          bytes: ownerPubkey, //our search criteria, a base58 encoded string
        },
      },
    ];
    const accounts = await connection.getParsedProgramAccounts(
      splToken.TOKEN_PROGRAM_ID, //new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      { filters: filters }
    );

    let accountData = accounts.map((account) => {
      const parsedAccountInfo: any = account.account.data;
      const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
      const tokenBalance: number =
        parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
      return { mint: mintAddress, balance: tokenBalance };
    });

    return accountData;
  }
}

export default TokenService;
