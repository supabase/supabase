// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/// <reference path="../../core/internal.d.ts" />

import { primordials } from "ext:core/mod.js";
import { op_utf8_to_byte_string } from "ext:core/ops";
const {
  ArrayPrototypeFind,
  Number,
  NumberIsFinite,
  NumberIsNaN,
  ObjectDefineProperties,
  ObjectPrototypeIsPrototypeOf,
  StringPrototypeEndsWith,
  StringPrototypeIncludes,
  StringPrototypeIndexOf,
  StringPrototypeSlice,
  StringPrototypeStartsWith,
  StringPrototypeToLowerCase,
  SymbolFor,
} = primordials;

import * as webidl from "ext:deno_webidl/00_webidl.js";
import { createFilteredInspectProxy } from "ext:deno_console/01_console.js";
import { URL } from "ext:deno_url/00_url.js";
import { DOMException } from "ext:deno_web/01_dom_exception.js";
import {
  defineEventHandler,
  EventTarget,
  setIsTrusted,
} from "ext:deno_web/02_event.js";
import { clearTimeout, setTimeout } from "ext:deno_web/02_timers.js";
import { TransformStream } from "ext:deno_web/06_streams.js";
import { TextDecoderStream } from "ext:deno_web/08_text_encoding.js";
import { getLocationHref } from "ext:deno_web/12_location.js";
import { newInnerRequest } from "ext:deno_fetch/23_request.js";
import { mainFetch } from "ext:deno_fetch/26_fetch.js";

// Copied from https://github.com/denoland/deno_std/blob/e0753abe0c8602552862a568348c046996709521/streams/text_line_stream.ts#L20-L74
export class TextLineStream extends TransformStream {
  #allowCR;
  #buf = "";

  constructor(options) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
      flush: (controller) => {
        if (this.#buf.length > 0) {
          if (
            this.#allowCR &&
            this.#buf[this.#buf.length - 1] === "\r"
          ) controller.enqueue(StringPrototypeSlice(this.#buf, 0, -1));
          else controller.enqueue(this.#buf);
        }
      },
    });
    this.#allowCR = options?.allowCR ?? false;
  }

  #handle(chunk, controller) {
    chunk = this.#buf + chunk;

    for (;;) {
      const lfIndex = StringPrototypeIndexOf(chunk, "\n");

      if (this.#allowCR) {
        const crIndex = StringPrototypeIndexOf(chunk, "\r");

        if (
          crIndex !== -1 && crIndex !== (chunk.length - 1) &&
          (lfIndex === -1 || (lfIndex - 1) > crIndex)
        ) {
          controller.enqueue(StringPrototypeSlice(chunk, 0, crIndex));
          chunk = StringPrototypeSlice(chunk, crIndex + 1);
          continue;
        }
      }

      if (lfIndex !== -1) {
        let crOrLfIndex = lfIndex;
        if (chunk[lfIndex - 1] === "\r") {
          crOrLfIndex--;
        }
        controller.enqueue(StringPrototypeSlice(chunk, 0, crOrLfIndex));
        chunk = StringPrototypeSlice(chunk, lfIndex + 1);
        continue;
      }

      break;
    }

    this.#buf = chunk;
  }
}

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 2;

class EventSource extends EventTarget {
  /** @type {AbortController} */
  #abortController = new AbortController();

  /** @type {number | undefined} */
  #reconnectionTimerId;

  /** @type {number} */
  #reconnectionTime = 5000;

  /** @type {string} */
  #lastEventId = "";

  /** @type {number} */
  #readyState = CONNECTING;
  get readyState() {
    webidl.assertBranded(this, EventSourcePrototype);
    return this.#readyState;
  }

  get CONNECTING() {
    webidl.assertBranded(this, EventSourcePrototype);
    return CONNECTING;
  }
  get OPEN() {
    webidl.assertBranded(this, EventSourcePrototype);
    return OPEN;
  }
  get CLOSED() {
    webidl.assertBranded(this, EventSourcePrototype);
    return CLOSED;
  }

  /** @type {string} */
  #url;
  get url() {
    webidl.assertBranded(this, EventSourcePrototype);
    return this.#url;
  }

  /** @type {boolean} */
  #withCredentials;
  get withCredentials() {
    webidl.assertBranded(this, EventSourcePrototype);
    return this.#withCredentials;
  }

  constructor(url, eventSourceInitDict = { __proto__: null }) {
    super();
    this[webidl.brand] = webidl.brand;
    const prefix = "Failed to construct 'EventSource'";
    webidl.requiredArguments(arguments.length, 1, prefix);
    url = webidl.converters.USVString(url, prefix, "Argument 1");
    eventSourceInitDict = webidl.converters.EventSourceInit(
      eventSourceInitDict,
      prefix,
      "Argument 2",
    );

    try {
      url = new URL(url, getLocationHref()).href;
    } catch (e) {
      throw new DOMException(e.message, "SyntaxError");
    }

    this.#url = url;
    this.#withCredentials = eventSourceInitDict.withCredentials;

    this.#loop();
  }

  close() {
    webidl.assertBranded(this, EventSourcePrototype);
    this.#abortController.abort();
    this.#readyState = CLOSED;
    clearTimeout(this.#reconnectionTimerId);
  }

  async #loop() {
    const lastEventIdValue = this.#lastEventId;
    const req = newInnerRequest(
      "GET",
      this.#url,
      () =>
        lastEventIdValue === ""
          ? [
            ["accept", "text/event-stream"],
          ]
          : [
            ["accept", "text/event-stream"],
            ["Last-Event-Id", op_utf8_to_byte_string(lastEventIdValue)],
          ],
      null,
      false,
    );
    /** @type {InnerResponse} */
    let res;
    try {
      res = await mainFetch(req, true, this.#abortController.signal);
    } catch {
      this.#reestablishConnection();
      return;
    }

    if (res.aborted) {
      this.#failConnection();
      return;
    }
    if (res.type === "error") {
      this.#reestablishConnection();
      return;
    }
    const contentType = ArrayPrototypeFind(
      res.headerList,
      (header) => StringPrototypeToLowerCase(header[0]) === "content-type",
    );
    if (
      res.status !== 200 ||
      !contentType ||
      !StringPrototypeIncludes(
        StringPrototypeToLowerCase(contentType[1]),
        "text/event-stream",
      )
    ) {
      this.#failConnection();
      return;
    }

    if (this.#readyState === CLOSED) {
      return;
    }
    this.#readyState = OPEN;
    this.dispatchEvent(new Event("open"));

    let data = "";
    let eventType = "";
    let lastEventId = this.#lastEventId;

    try {
      for await (
        // deno-lint-ignore prefer-primordials
        const chunk of res.body.stream
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new TextLineStream({ allowCR: true }))
      ) {
        if (chunk === "") {
          this.#lastEventId = lastEventId;
          if (data === "") {
            eventType = "";
            continue;
          }
          if (StringPrototypeEndsWith(data, "\n")) {
            data = StringPrototypeSlice(data, 0, -1);
          }
          const event = new MessageEvent(eventType || "message", {
            data,
            origin: res.url(),
            lastEventId: this.#lastEventId,
          });
          setIsTrusted(event, true);
          data = "";
          eventType = "";
          if (this.#readyState !== CLOSED) {
            this.dispatchEvent(event);
          }
        } else if (StringPrototypeStartsWith(chunk, ":")) {
          continue;
        } else {
          let field = chunk;
          let value = "";
          const colonIndex = StringPrototypeIndexOf(chunk, ":");
          if (colonIndex !== -1) {
            field = StringPrototypeSlice(chunk, 0, colonIndex);
            value = StringPrototypeSlice(chunk, colonIndex + 1);
            if (StringPrototypeStartsWith(value, " ")) {
              value = StringPrototypeSlice(value, 1);
            }
          }

          switch (field) {
            case "event": {
              eventType = value;
              break;
            }
            case "data": {
              data += value + "\n";
              break;
            }
            case "id": {
              if (!StringPrototypeIncludes(value, "\0")) {
                lastEventId = value;
              }
              break;
            }
            case "retry": {
              const reconnectionTime = Number(value);
              if (
                !NumberIsNaN(reconnectionTime) &&
                NumberIsFinite(reconnectionTime)
              ) {
                this.#reconnectionTime = reconnectionTime;
              }
              break;
            }
          }
        }
      }
    } catch {
      // The connection is reestablished below
    }

    this.#reestablishConnection();
  }

  #reestablishConnection() {
    if (this.#readyState === CLOSED) {
      return;
    }
    this.#readyState = CONNECTING;
    this.dispatchEvent(new Event("error"));
    this.#reconnectionTimerId = setTimeout(() => {
      if (this.#readyState !== CONNECTING) {
        return;
      }
      this.#loop();
    }, this.#reconnectionTime);
  }

  #failConnection() {
    if (this.#readyState !== CLOSED) {
      this.#readyState = CLOSED;
      this.dispatchEvent(new Event("error"));
    }
  }

  [SymbolFor("Deno.privateCustomInspect")](inspect, inspectOptions) {
    return inspect(
      createFilteredInspectProxy({
        object: this,
        evaluate: ObjectPrototypeIsPrototypeOf(EventSourcePrototype, this),
        keys: [
          "readyState",
          "url",
          "withCredentials",
          "onopen",
          "onmessage",
          "onerror",
        ],
      }),
      inspectOptions,
    );
  }
}

const EventSourcePrototype = EventSource.prototype;

ObjectDefineProperties(EventSource, {
  CONNECTING: {
    __proto__: null,
    value: 0,
  },
  OPEN: {
    __proto__: null,
    value: 1,
  },
  CLOSED: {
    __proto__: null,
    value: 2,
  },
});

defineEventHandler(EventSource.prototype, "open");
defineEventHandler(EventSource.prototype, "message");
defineEventHandler(EventSource.prototype, "error");

webidl.converters.EventSourceInit = webidl.createDictionaryConverter(
  "EventSourceInit",
  [
    {
      key: "withCredentials",
      defaultValue: false,
      converter: webidl.converters.boolean,
    },
  ],
);

export { EventSource };
