import { promisify } from "node:util";
import { brotliCompress, brotliDecompress } from "node:zlib";

Deno.serve(async () => {
  const meow = "meow";

  const meowCompressed = await promisify(brotliCompress)(meow);
  const meowDecompressed = await promisify(brotliDecompress)(meowCompressed);

  return new Response(meowDecompressed.toString(), { status: 200 });
});
