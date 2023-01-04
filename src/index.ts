import express from "express";
import * as bodyParser from "body-parser";
import { router as tokenServiceAPI } from "./api";
import * as dotenv from "dotenv";

dotenv.config();

const app: express.Application = express();

app.use(bodyParser.json());
app.use("/solana-client/api/v1", tokenServiceAPI);
app.get("/solana-client/health", (req, res) => {
  // #swagger.ignore = true
  res.status(200).send("Ok");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`Solana cluster: ${process.env.SOLANA_CLUSTER}`);
});
