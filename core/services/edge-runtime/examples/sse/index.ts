const msg = new TextEncoder().encode("data: hella\r\n\r\n");

Deno.serve(async () => {
  let timerId: number | undefined;

  const body = new ReadableStream({
    start(controller) {
      timerId = setInterval(() => {
        controller.enqueue(msg);
      }, 1000);
    },
    cancel() {
      if (typeof timerId === "number") {
        clearInterval(timerId);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
});
