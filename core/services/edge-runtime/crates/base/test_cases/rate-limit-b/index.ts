// Worker B: forwards back to worker A. Supports two outbound HTTP modes
// selected via the x-http-mode header: "fetch" (default) or "node".
import * as http from "node:http";

function requestViaNode(
  url: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: "GET",
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 500, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

Deno.serve(async (req: Request) => {
  if (!req.headers.has("traceparent")) {
    return new Response(
      JSON.stringify({ msg: "missing traceparent header" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const serverUrl = req.headers.get("x-test-server-url");
  if (!serverUrl) {
    return new Response(
      JSON.stringify({ msg: "missing x-test-server-url header" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const mode = req.headers.get("x-http-mode") ?? "fetch";
  const forwardHeaders: Record<string, string> = {
    "x-test-server-url": serverUrl,
    "x-http-mode": mode,
  };

  try {
    let status: number;
    let body: string;

    if (mode === "node") {
      ({ status, body } = await requestViaNode(
        `${serverUrl}/rate-limit-a`,
        forwardHeaders,
      ));
    } else {
      const resp = await fetch(`${serverUrl}/rate-limit-a`, {
        headers: forwardHeaders,
      });
      status = resp.status;
      body = await resp.text();
    }

    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ msg: e.toString() }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
