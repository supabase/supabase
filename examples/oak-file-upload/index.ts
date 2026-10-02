import { Application } from "https://deno.land/x/oak@v12.3.1/mod.ts";

const MB = 1024 * 1024;

const app = new Application();

app.use(async (ctx) => {
  try {
    const body = ctx.request.body({ type: "form-data" });
    const formData = await body.value.read({
      // Need to set the maxSize so files will be stored in memory.
      // This is necessary as Edge Functions don't have disk write access.
      // We are setting the max size as 10MB (an Edge Function has a max memory limit of 150MB)
      // For more config options, check: https://deno.land/x/oak@v11.1.0/mod.ts?s=FormDataReadOptions
      maxSize: 10 * MB,
    });
    const file = formData.files[0];
    console.log(file.contentType);

    ctx.response.status = 201;
    ctx.response.body = "Success!";
  } catch (e) {
    console.error(e);
    if ("status" in e) {
      ctx.response.headers.set("Connection", "close");
      ctx.response.status = e.status;
      ctx.response.body = e.message;
    } else {
      ctx.response.status = 500;
      ctx.response.body = "Error!";
    }
  }
});

await app.listen({ port: 8000 });
