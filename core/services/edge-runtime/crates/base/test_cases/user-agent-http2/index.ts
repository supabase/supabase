import http2 from "node:http2";

Deno.serve((req: Request) => {
  const echoUrl = req.headers.get("x-echo-url")!;
  const userAgent = req.headers.get("x-set-user-agent");

  return new Promise((resolve) => {
    const client = http2.connect(echoUrl);
    const stream = client.request(
      userAgent === null ? {} : { "user-agent": userAgent },
    );

    let body = "";

    stream.setEncoding("utf8");
    stream.on("data", (chunk) => body += chunk);
    stream.on("end", () => {
      client.close();
      resolve(new Response(body));
    });
    stream.end();
  });
});
