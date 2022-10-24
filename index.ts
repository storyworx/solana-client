const express = require("express");
var bodyParser = require("body-parser");

const tokenService = require("./token-service");
const app = express();

app.use(bodyParser.json());
app.use("/token-service", tokenService);

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
