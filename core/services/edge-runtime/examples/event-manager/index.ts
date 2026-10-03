const eventManager = new globalThis.EventManager();

console.log("event manager running");

for await (const data of eventManager) {
  if (data) {
    switch (data.event_type) {
      case "Log":
        if (data.event.level === "Error") {
          console.error(data.event.msg);
        } else {
          console.dir(data.event.msg, { depth: Infinity });
        }
        break;
      default:
        console.dir(data, { depth: Infinity });
    }
  }
}

console.log("event manager exiting");
