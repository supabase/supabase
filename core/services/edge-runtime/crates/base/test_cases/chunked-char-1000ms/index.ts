async function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(void 0);
    }, ms);
  });
}

Deno.serve(() => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const input = ["m", "e", "o", "w", "m", "e", "o", "w"];

      for (const char of input) {
        await sleep(1000);
        controller.enqueue(encoder.encode(char));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
});
