Deno.serve((req) => {
  console.log(req.headers.get("content-type"));
  return Response.json(<div>meow</div>);
});
