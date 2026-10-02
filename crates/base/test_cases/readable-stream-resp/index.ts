console.log("Hello from Functions!");

Deno.serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const text = "Hello world from streams";

  // Create a text encoder
  const textEncoder = new TextEncoder();

  // Convert the text to Uint8Array
  const textUint8Array = textEncoder.encode(text);

  // Create a readable stream from the Uint8Array
  const readableStream = new ReadableStream({
    start(controller) {
      controller.enqueue(textUint8Array);
      controller.close();
    },
  });

  console.log("Before stalling");

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain" },
    status: 200,
  });
});
