import http from "node:http";

Deno.serve((req: Request) => {
  const echoUrl = new URL(req.headers.get("x-echo-url")!);
  const userAgent = req.headers.get("x-set-user-agent");

  return new Promise((resolve) => {
    const outbound = http.request({
      hostname: echoUrl.hostname,
      port: echoUrl.port,
      path: "/",
      headers: userAgent === null ? {} : { "user-agent": userAgent },
    }, (res) => {
      let body = "";

      res.on("data", (chunk) => body += chunk);
      res.on("end", () => resolve(new Response(body)));
    });

    outbound.end();
  });
});
