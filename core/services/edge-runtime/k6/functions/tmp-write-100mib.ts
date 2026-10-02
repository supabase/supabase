const path = "/tmp/100mb_zero_file.bin";
const file = Deno.openSync(path, { write: true, create: true });
const chunk = new Uint8Array(1024 * 1024);

for (let i = 0; i < 100; i++) {
  file.writeSync(chunk);
}

file.close();
Deno.serve((_req) => new Response("Hello, world"));
