import express, { Request, Response } from "express";
import { TokenService } from "../services";

var router = express.Router();

router
  .post("/create-token", async function (req: Request, res: Response) {
    const data = req.body;
    const ownerPubkey = data["ownerPubkey"];

    const tokenService = new TokenService();
    const token = await tokenService.createToken(ownerPubkey);
    res.status(200).send({ token: token });
  })

  .post("/mint-token", async function (req: Request, res: Response) {
    const data = req.body;
    const ownerPubkey = data["ownerPubkey"];
    const destinationPubkey = data["destinationPubkey"];
    const token = data["token"];
    const amount = data["amount"];

    const tokenService = new TokenService();
    const mintData = await tokenService.mintToken(
      token,
      ownerPubkey,
      destinationPubkey,
      amount
    );
    res.status(200).send(mintData);
  })

  .post("/create-account", async function (req: Request, res: Response) {
    const tokenService = new TokenService();
    const keypair = await tokenService.createAccount();
    res.status(200).send(keypair);
  })

  .get("/account-info", async function (req: Request, res: Response) {
    const ownerPubkey = req.query.ownerPubkey;
    if (!ownerPubkey) {
      res.status(400).send();
    }

    const tokenService = new TokenService();
    const accountData = await tokenService.getAccounts(<string>ownerPubkey);
    res.status(200).send(accountData);
  });

export { router };
