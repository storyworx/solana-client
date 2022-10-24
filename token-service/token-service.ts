const web3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");
const bs58 = require("bs58");
require("dotenv").config();

class TokenService {
  private decimals: number = 9;
  constructor() {}

  async createToken(ownerPubkey: string) {
    const connection = new web3.Connection(
      web3.clusterApiUrl(process.env.SOLANA_CLUSTER)
    );

    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(process.env.SOLANA_ADMIN_KEYPAIR)
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
      web3.clusterApiUrl(process.env.SOLANA_CLUSTER)
    );
    const mint = new web3.PublicKey(mintPubkey);
    const owner = new web3.PublicKey(ownerPubkey);
    const payer = web3.Keypair.fromSecretKey(
      bs58.decode(process.env.SOLANA_ADMIN_KEYPAIR)
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
      web3.clusterApiUrl(process.env.SOLANA_CLUSTER)
    );

    //generate keypair and airdrop 1000000000 Lamports (1 SOL)
    const myKeypair = web3.Keypair.generate();
    await connection.requestAirdrop(myKeypair.publicKey, 1000000000);

    return {
      publicKey: myKeypair.publicKey.toString(),
      secretKey: bs58.encode(myKeypair.secretKey),
    };
  }
}

export default TokenService;
