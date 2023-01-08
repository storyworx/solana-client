import express, { Request, Response } from "express";
import { TokenService } from "../services";

var router = express.Router();

router
  .post("/create-token", async function (req: Request, res: Response) {
    /*  
        #swagger.summary = 'Create new token.'
        #swagger.description = 'Create new token.'
        #swagger.parameters['obj'] = {
                in: 'body',
                schema: {
                    $userId: 1
                }
        } 
        #swagger.responses[200] = {
                schema: {
                    token: 'token_name',
                }
        } 
    */
    const data = req.body;
    const userId = data["userId"];

    const tokenService = new TokenService();
    const token = await tokenService.createToken(userId);
    res.status(200).send({ token: token });
  })

  .post("/mint-token", async function (req: Request, res: Response) {
    /*  
        #swagger.summary = 'Mint tokens' 
        #swagger.description = 'Mint tokens. Token has to belong to ownerId.'
        #swagger.parameters['obj'] = {
                in: 'body',
                schema: {
                    $ownerId: 1,
                    $destinationId: 2,
                    $token: 'token_name',
                    $amount: 150.0

                }
        } 
        #swagger.responses[200] = {
                schema: {
                    name: 'Jhon Doe',
                    age: 29,
                    about: ''
                }
        } 
    */
    const data = req.body;
    const ownerId = data["ownerId"];
    const destinationId = data["destinationId"];
    const token = data["token"];
    const amount = data["amount"];

    const tokenService = new TokenService();
    const mintData = await tokenService.mintToken(
      token,
      ownerId,
      destinationId,
      amount
    );
    res.status(200).send(mintData);
  })

  .post("/create-account", async function (req: Request, res: Response) {
    /*   
        #swagger.summary = 'Create new wallet.'
        #swagger.description = 'Create new wallet.'
        #swagger.parameters['obj'] = {
                in: 'body',
                schema: {
                    $userId: 1
                }
        } 
    */
    const data = req.body;
    const userId = data["userId"];
    const tokenService = new TokenService();
    const keypair = await tokenService.createAccount(userId);
    res.status(200).send(keypair);
  })

  .get("/wallet-info", async function (req: Request, res: Response) {
    /*  
        #swagger.summary = 'Get wallet info.'
        #swagger.description = 'Get all token accounts belonging to userId.'
        #swagger.parameters['userId'] = {
                in: 'query',
                required: true
        } 
        #swagger.responses[200] = {
                description: 'Some description...',
                schema: [{
                    mint: 'token_name',
                    balance: 42,
                }]
        } 
    */
    const userId = parseInt(<string>req.query.userId);
    if (!userId) {
      res.status(200).send({ error: "missing ownerPubkey" });
      return;
    }

    const tokenService = new TokenService();
    const accountData = await tokenService.getWalletInfo(userId);
    res.status(200).send(accountData);
  })

  .get("/wallets", async function (req: Request, res: Response) {
    /*    
        #swagger.summary = 'Get users with wallets.'
        #swagger.description = 'Get all users that own wallets.'
        #swagger.responses[200] = {
                description: 'Some description...',
                schema: [
                  1, 2
                ]
        }
    
    */
    const tokenService = new TokenService();
    const wallets = await tokenService.getWallets();
    res.status(200).send(wallets);
  });

export { router };
