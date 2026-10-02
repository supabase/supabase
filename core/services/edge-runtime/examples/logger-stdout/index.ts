import Logger from "https://deno.land/x/logger@v1.1.1/logger.ts";

const logger = new Logger();

Deno.serve(async () => {
  logger.info("hello from logger");

  return new Response(
    JSON.stringify({ hello: "world" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
