import { core, primordials } from "ext:core/mod.js";
const { SymbolAsyncIterator } = primordials;

const { op_event_accept } = core.ops;

class SupabaseEventListener {
  async nextEvent() {
    try {
      const reqEvt = await op_event_accept();
      const done = reqEvt === "Done";

      let value = undefined;
      if (!done) {
        const rawEvent = reqEvt["Event"];
        const eventType = Object.keys(rawEvent.event)[0];
        value = {
          timestamp: new Date().toISOString(),
          event_type: eventType,
          event: rawEvent.event[eventType],
          metadata: rawEvent.metadata,
        };
      }

      return { value, done };
    } catch (e) {
      // TODO: handle errors
      throw e;
    }
  }

  [SymbolAsyncIterator]() {
    const scopedClass = this;

    return {
      async next() {
        return await scopedClass.nextEvent();
      },
    };
  }
}

export { SupabaseEventListener };
