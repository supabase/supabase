// https://github.com/valadaptive/server-sent-stream

/**
 * A parser for the server-sent events stream format.
 *
 * Note that this parser does not handle text decoding! To do it correctly, use a streaming text decoder, since the
 * stream could be split up mid-Unicode character, and decoding each chunk at once could lead to incorrect results.
 *
 * This parser is used by streaming chunks in using the {@link push} method, and then calling the {@link end} method
 * when the stream has ended.
 */
class EventStreamParser {
  /**
   * Construct a new parser for a single stream.
   * @param onEvent A callback which will be called for each new event parsed. The parameters in order are the
   * event data, the event type, and the last seen event ID. This may be called none, once, or many times per push()
   * call, and may be called from the end() call.
   */
  constructor(onEvent) {
    this.streamBuffer = "";
    this.lastEventId = "";
    this.onEvent = onEvent;
  }
  /**
   * Process a single incoming chunk of the event stream.
   */
  _processChunk() {
    // Events are separated by two newlines
    const events = this.streamBuffer.split(/\r\n\r\n|\r\r|\n\n/g);
    if (events.length === 0) {
      return;
    }
    // The leftover text to remain in the buffer is whatever doesn't have two newlines after it. If the buffer ended
    // with two newlines, this will be an empty string.
    this.streamBuffer = events.pop();
    for (const eventChunk of events) {
      let eventType = "";
      // Split up by single newlines.
      const lines = eventChunk.split(/\n|\r|\r\n/g);
      let eventData = "";
      for (const line of lines) {
        const lineMatch = /([^:]+)(?:: ?(.*))?/.exec(line);
        if (lineMatch) {
          const field = lineMatch[1];
          const value = lineMatch[2] || "";
          switch (field) {
            case "event":
              eventType = value;
              break;
            case "data":
              eventData += value;
              eventData += "\n";
              break;
            case "id":
              // The ID field cannot contain null, per the spec
              if (!value.includes("\0")) {
                this.lastEventId = value;
              }
              break;
              // We do nothing for the `delay` type, and other types are explicitly ignored
          }
        }
      }
      // https://html.spec.whatwg.org/multipage/server-sent-events.html#dispatchMessage
      // Skip the event if the data buffer is the empty string.
      if (eventData === "") {
        continue;
      }
      if (eventData[eventData.length - 1] === "\n") {
        eventData = eventData.slice(0, -1);
      }
      // Trim the *last* trailing newline only.
      this.onEvent(eventData, eventType || "message", this.lastEventId);
    }
  }
  /**
   * Push a new chunk of data to the parser. This may cause the {@link onEvent} callback to be called, possibly
   * multiple times depending on the number of events contained within the chunk.
   * @param chunk The incoming chunk of data.
   */
  push(chunk) {
    this.streamBuffer += chunk;
    this._processChunk();
  }
  /**
   * Indicate that the stream has ended.
   */
  end() {
    // This is a no-op
  }
}
export default EventStreamParser;
