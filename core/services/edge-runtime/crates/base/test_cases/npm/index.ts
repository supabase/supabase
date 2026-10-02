import isEven from "npm:is-even";

import { hello } from "./hello.js";
import { numbers } from "./folder1/folder2/numbers.ts";

Deno.serve(async () => {
  return new Response(
    JSON.stringify({ is_even: isEven(10), hello, numbers }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
