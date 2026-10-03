Deno.serve((req: Request) => {
  console.log(req.headers.get("content-type"));
  return new Response("meow");
});
