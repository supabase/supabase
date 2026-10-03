Deno.serve(async (req: Request) => {
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onmessage = (ev) => {
    socket.send(ev.data);
  };

  return response;
});
