import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";

const router = new Router();

router
  // Note: path will be prefixed with function name
  .get("/oak-with-jsr", (context) => {
    context.response.body = "meow";
  });

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen();
