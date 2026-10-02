interface reqPayload {
  name: string;
}

console.info("server started modified");

Deno.serve(async (req: Request) => {
  console.log("serving request");
  const rb = req.body;
  const reader = rb.getReader();

  let totalSize = 0;
  const readReq = async () => {
    const { done, value } = await reader.read();
    if (!done) {
      totalSize += value.length;
      return await readReq();
    }
    return;
  };
  await readReq();

  return new Response(
    JSON.stringify({ totalSize }),
    {
      headers: {
        "Content-Type": "application/json",
        "Connection": "keep-alive",
      },
    },
  );
});
