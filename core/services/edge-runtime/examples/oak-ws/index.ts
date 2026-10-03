import { Application, Router } from "https://deno.land/x/oak@v12.3.0/mod.ts";

const router = new Router();

router
  // Note: path will be prefixed with function name
  .get("/oak-ws", (ctx) => {
    if (!ctx.isUpgradable) {
      ctx.throw(501);
    }

    const ws = ctx.upgrade();

    ws.onopen = () => {
      console.log("Connected to client");
      ws.send("Hello from server!");
    };

    ws.onmessage = (m) => {
      console.log("Got message from client: ", m.data);
      ws.send(m.data as string);
      ws.close();
    };

    ws.onclose = () => console.log("Disconncted from client");
  });

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen();
