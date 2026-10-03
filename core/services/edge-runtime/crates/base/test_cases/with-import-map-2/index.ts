import foo from "foo/index.ts";

console.log(foo);

Deno.serve(() => {
  return new Response(
    JSON.stringify({ message: "ok" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
