Deno.serve(async (req: Request) => {
  const url = new URL(req.headers.get("x-echo-url")!);

  url.protocol = "ws:";

  // The echo server answers the handshake with a plain response, so the socket
  // never opens. All this has to do is get the handshake sent, and the server
  // records the `User-Agent` it arrived with.
  await new Promise((resolve) => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      socket.close();
      resolve(null);
    };
    socket.onerror = () => resolve(null);
    socket.onclose = () => resolve(null);
  });

  return new Response("ok");
});
