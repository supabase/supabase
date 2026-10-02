interface reqPayload {
  name: string;
}

console.info("server started modified");

Deno.serve(async (req: Request) => {
  const { name }: reqPayload = await req.json();
  const data = {
    message: `Hello ${name} from foo!`,
  };

  return new Response(
    JSON.stringify(data),
    {
      headers: {
        "Content-Type": "application/json",
        "Connection": "keep-alive",
      },
    },
  );
});
