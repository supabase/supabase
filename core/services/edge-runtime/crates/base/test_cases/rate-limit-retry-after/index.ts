// Worker: makes one outbound fetch to itself, catches RateLimitError, and
// returns { retryAfterMs } in JSON so the integration test can verify the field.
//
// Requests with "x-skip: 1" are terminal — they return immediately without
// making an outbound call, so the worker does not recurse indefinitely.
Deno.serve(async (req: Request) => {
  const serverUrl = req.headers.get("x-test-server-url");
  if (!serverUrl) {
    return new Response(
      JSON.stringify({ msg: "missing x-test-server-url header" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Terminal hop: just acknowledge, no outbound call.
  if (req.headers.get("x-skip") === "1") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await fetch(`${serverUrl}/rate-limit-retry-after`, {
      headers: {
        "x-test-server-url": serverUrl,
        "x-skip": "1",
      },
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Deno.errors.RateLimitError) {
      return new Response(
        JSON.stringify({ name: e.name, retryAfterMs: e.retryAfterMs }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ msg: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
