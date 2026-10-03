import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const router = new Router();

router
  // Note: path will be prefixed with function name
  .get("/oak", (context) => {
    context.response.body =
      "This is an example Oak server running on Edge Functions!";
  })
  .get("/oak/redirect", (context) => {
    context.response.redirect("https://www.example.com");
  });

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen();
