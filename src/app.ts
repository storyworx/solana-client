const express = require("express");
var bodyParser = require("body-parser");

const tokenServiceAPI = require("./api");
const app = express();

app.use(bodyParser.json());
app.use("/token-service", tokenServiceAPI);

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
