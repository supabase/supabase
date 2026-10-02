Deno.serve((req) => {
  console.log(req.headers.get("content-type"));
  return new Response("meow");
});
