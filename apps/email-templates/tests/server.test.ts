import { createHandler, type ServerConfig } from "../src/server.ts";

function config(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    hostname: "127.0.0.1",
    port: 8080,
    apiToken: "a".repeat(64),
    allowedOrigins: new Set(),
    maxBodyBytes: 256 * 1024,
    enableSend: false,
    renderOptions: {},
    envReader: () => undefined,
    ...overrides,
  };
}

Deno.test("health endpoint is public", async () => {
  const response = await createHandler(config())(new Request("http://local/healthz"));
  if (response.status !== 200) throw new Error(`Unexpected status ${response.status}`);
});

Deno.test("template API rejects missing token", async () => {
  const response = await createHandler(config())(new Request("http://local/v1/templates"));
  if (response.status !== 401) throw new Error(`Unexpected status ${response.status}`);
});

Deno.test("render API returns escaped HTML", async () => {
  const response = await createHandler(config())(new Request("http://local/v1/render", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${"a".repeat(64)}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      templateId: "az.azabot.ticket_created.ar.v1",
      data: { recipient_name: "<script>alert(1)</script>" },
    }),
  }));
  if (response.status !== 200) throw new Error(`Unexpected status ${response.status}`);
  const body = await response.json();
  if (String(body.html).includes("<script>")) throw new Error("HTML was not escaped");
});

Deno.test("send endpoint is disabled by default", async () => {
  const response = await createHandler(config())(new Request("http://local/v1/send", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${"a".repeat(64)}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  }));
  if (response.status !== 403) throw new Error(`Unexpected status ${response.status}`);
});
