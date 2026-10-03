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
      const input: [string, number][] = [
        ["m", 6000],
        ["e", 100],
      ];

      for (const [char, wait] of input) {
        await sleep(wait);
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
