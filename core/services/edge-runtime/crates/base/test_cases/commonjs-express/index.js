const express = require("express");
const app = express();
const port = 8080;

console.log(require);

app.get("/commonjs-express", (_, res) => {
  res.send("meow");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
