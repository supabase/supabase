import { getHelperMessage } from "helper-from-import-map";

Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({
      message: getHelperMessage(),
      success: true,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    },
  );
});
