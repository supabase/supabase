// --static "examples/**/*.txt"

import { join } from "https://deno.land/std/path/mod.ts";

Deno.serve((_req) => {
  return new Response(
    Deno.readTextFileSync(join(import.meta.dirname, "meow.txt")),
  );
});
