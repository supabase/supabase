addEventListener("message", (e) => {
  if (e.data.event === "start") {
    setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
  }
});
