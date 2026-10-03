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
        ["m", 500],
        ["e", 1000],
        ["o", 1000],
        ["w", 6000],
        ["m", 100],
        ["e", 100],
        ["o", 100],
        ["w", 600],
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
