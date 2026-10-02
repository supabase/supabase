// Worker that echoes back the trace ID from the AsyncVariable context.
// Exposed via globalThis.getRequestTraceId when exposeRequestTraceId context
// flag is set.  Used to verify AsyncVariable isolation across concurrent
// requests.
Deno.serve(async (_req: Request) => {
  // Small delay so concurrent requests actually overlap inside the event loop.
  await new Promise((resolve) => setTimeout(resolve, 30));

  const traceId = (globalThis as any).getRequestTraceId?.() ?? null;

  return new Response(
    JSON.stringify({ traceId }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
