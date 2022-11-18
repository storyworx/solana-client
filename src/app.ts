import express from "express";
import * as bodyParser from "body-parser";
import { router as tokenServiceAPI } from "./api";

const app: express.Application = express();

app.use(bodyParser.json());
app.use("/token-service", tokenServiceAPI);

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
