Deno.serve(() => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const input = ["m", "e", "o", "w"];

      for (const char of input) {
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
