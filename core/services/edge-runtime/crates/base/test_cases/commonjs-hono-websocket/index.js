const { serve } = require("@hono/node-server");
const { Hono } = require("hono");
const { createNodeWebSocket } = require("@hono/node-ws");

const app = new Hono();
const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });
const port = 8080;

app.get(
  "/commonjs-hono-websocket",
  upgradeWebSocket(() => {
    return {
      onOpen(_evt, ws) {
        ws.send("meow");
      },
      onMessage(evt, ws) {
        ws.send(evt.data);
      },
    };
  }),
);

const server = serve({
  fetch: app.fetch,
  port,
  overrideGlobalObjects: false,
});

injectWebSocket(server);
