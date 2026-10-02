const { serve } = require("@hono/node-server");
const { Hono } = require("hono");
const app = new Hono();
const port = 8080;

app.get("/commonjs-hono", (c) => {
  return c.text("Hello, World!");
});

serve({
  fetch: app.fetch,
  port,
  overrideGlobalObjects: false,
});
