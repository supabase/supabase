const express = require("express");
const app = express();
const expressWs = require("express-ws")(app);
const port = 8080;

expressWs.app.ws("/commonjs-express-websocket", (ws) => {
  ws.send("meow");
  ws.on("message", (msg) => {
    ws.send(msg);
  });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
