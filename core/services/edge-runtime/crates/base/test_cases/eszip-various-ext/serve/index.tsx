Deno.serve((req: Request) => {
  console.log(req.headers.get("content-type"));
  return Response.json(<div>meow</div>);
});
