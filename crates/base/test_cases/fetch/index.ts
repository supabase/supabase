Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const url = new URL(payload["url"]);
    const resp = await fetch(url);
    const body = await resp.text();

    return Response.json({
      status: resp.status,
      body,
    });
  } catch (e) {
    return new Response(e.toString(), { status: 500 });
  }
});
