import express from "express";
import * as bodyParser from "body-parser";
import { router as tokenServiceAPI } from "./api";
import * as dotenv from "dotenv";

dotenv.config();

const app: express.Application = express();

app.use(bodyParser.json());
app.use("/token-service", tokenServiceAPI);

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`Solana cluster: ${process.env.SOLANA_CLUSTER}`);
});
