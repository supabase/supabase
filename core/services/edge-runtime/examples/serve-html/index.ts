Deno.serve(async (req) => {
  if (req.url.endsWith("/foo")) {
    return new Response(
      await Deno.readTextFile(new URL("./foo.html", import.meta.url)),
    );
  } else {
    return new Response(
      await Deno.readTextFile(new URL("./bar.html", import.meta.url)),
    );
  }
});
