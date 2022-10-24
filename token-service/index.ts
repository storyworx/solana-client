import express, { Request, Response } from "express";
import TokenService from "./token-service";

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
    const token = data["token"];
    const amount = data["amount"];

    const tokenService = new TokenService();
    await tokenService.mintToken(token, ownerPubkey, amount);
    res.status(200).send();
  })

  .post("/create-account", async function (req: Request, res: Response) {
    const tokenService = new TokenService();
    const keypair = await tokenService.createAccount();
    res.status(200).send(keypair);
  });

module.exports = router;
