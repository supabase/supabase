Deno.serve(async (req: Request) => {
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    socket.send("meow");
  };

  socket.onmessage = (ev) => {
    socket.send(ev.data);
  };

  return response;
});
