Deno.serve(async (req: Request) => {
  const echoUrl = req.headers.get("x-echo-url")!;
  const userAgent = req.headers.get("x-set-user-agent");

  const resp = await fetch(
    echoUrl,
    userAgent === null ? {} : { headers: { "user-agent": userAgent } },
  );

  return new Response(await resp.text());
});
