import file from "./version.json" with { type: "json" };

Deno.serve(async () => {
  return new Response(
    JSON.stringify({ version: file.version }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
