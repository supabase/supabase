import { assertEquals } from "jsr:@std/assert";

export default {
  async fetch(req: Request) {
    const port = parseInt(req.headers.get("x-port") ?? "");
    if (isNaN(port)) {
      return new Response(null, {
        status: 500,
      });
    }

    const caCerts = [];

    if (req.method === "POST") {
      const arr = await req.arrayBuffer();
      const dec = new TextDecoder();
      const ca = dec.decode(arr);
      caCerts.push(ca);
    }

    const client = Deno.createHttpClient({
      caCerts,
    });

    try {
      const resp = await fetch(`https://localhost:${port}`, { client });
      assertEquals(resp.status, 200);
      return new Response(await resp.text());
    } catch (ex) {
      if (ex instanceof TypeError) {
        return new Response(ex.toString(), {
          status: 500,
        });
      }

      return new Response(null, {
        status: 500,
      });
    }
  },
};
