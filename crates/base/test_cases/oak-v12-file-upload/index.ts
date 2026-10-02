import { Application, Router } from "https://deno.land/x/oak@v12.3.0/mod.ts";

const MB = 1024 * 1024;

const router = new Router();
const controller = new AbortController();

router
  .post("/file-upload", async (ctx) => {
    try {
      const body = ctx.request.body({ type: "form-data" });
      const formData = await body.value.read({
        // Need to set the maxSize so files will be stored in memory.
        // This is necessary as Edge Functions don't have disk write access.
        // We are setting the max size as 10MB (an Edge Function has a max memory limit of 150MB)
        // For more config options, check: https://deno.land/x/oak@v11.1.0/mod.ts?s=FormDataReadOptions
        maxSize: 1 * MB,
      });
      const file = formData.files[0];

      ctx.response.status = 201;
      ctx.response.body = `file-type: ${file.contentType}`;
    } catch (e) {
      console.log("error occurred");
      console.log(e);
      ctx.response.status = 500;
      ctx.response.body = "Error!";
    }
  });

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

addEventListener("beforeunload", () => controller.abort());

await app.listen({
  signal: controller.signal,
});
