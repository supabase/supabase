import { Application } from "https://deno.land/x/oak@v12.3.0/mod.ts";

const MB = 1024 * 1024;
const app = new Application();

app.use(async (ctx) => {
  try {
    const body = ctx.request.body({ type: "form-data" });
    const formData = await body.value.read({
      maxSize: 10 * MB,
    });
    const file = formData.files[0];
    console.log(file.contentType);

    ctx.response.status = 201;
    ctx.response.body = "Success!";
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = "Error!";
  }
});

await app.listen({ port: 8000 });
