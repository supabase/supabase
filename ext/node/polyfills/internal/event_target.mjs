// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Node.js contributors. All rights reserved. MIT License.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  ERR_EVENT_RECURSION,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_THIS,
  ERR_MISSING_ARGS,
} from "ext:deno_node/internal/errors.ts";
import {
  validateObject,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { emitWarning } from "node:process";
import { nextTick } from "ext:deno_node/_next_tick.ts";
import {
  Event as WebEvent,
  EventTarget as WebEventTarget,
} from "ext:deno_web/02_event.js";

import {
  customInspectSymbol,
  kEmptyObject,
  kEnumerableProperty,
} from "ext:deno_node/internal/util.mjs";
import { inspect } from "node:util";

const kIsEventTarget = Symbol.for("nodejs.event_target");
const kIsNodeEventTarget = Symbol("kIsNodeEventTarget");

import { EventEmitter } from "node:events";
const {
  kMaxEventTargetListeners,
  kMaxEventTargetListenersWarned,
} = EventEmitter;

const kEvents = Symbol("kEvents");
const kIsBeingDispatched = Symbol("kIsBeingDispatched");
const kStop = Symbol("kStop");
const kTarget = Symbol("kTarget");
const kHandlers = Symbol("khandlers");
const kWeakHandler = Symbol("kWeak");

const kHybridDispatch = Symbol.for("nodejs.internal.kHybridDispatch");
const kCreateEvent = Symbol("kCreateEvent");
const kNewListener = Symbol("kNewListener");
const kRemoveListener = Symbol("kRemoveListener");
const kIsNodeStyleListener = Symbol("kIsNodeStyleListener");
const kTrustEvent = Symbol("kTrustEvent");

const kType = Symbol("type");
const kDetail = Symbol("detail");
const kDefaultPrevented = Symbol("defaultPrevented");
const kCancelable = Symbol("cancelable");
const kTimestamp = Symbol("timestamp");
const kBubbles = Symbol("bubbles");
const kComposed = Symbol("composed");
const kPropagationStopped = Symbol("propagationStopped");

function isEvent(value) {
  return typeof value?.[kType] === "string";
}

class Event extends WebEvent {
  /**
   * @param {string} type
   * @param {{
   *   bubbles?: boolean,
   *   cancelable?: boolean,
   *   composed?: boolean,
   * }} [options]
   */
  constructor(type, options = null) {
    super(type, options);
    if (arguments.length === 0) {
      throw new ERR_MISSING_ARGS("type");
    }
    validateObject(options, "options", {
      allowArray: true,
      allowFunction: true,
      nullable: true,
    });
    const { cancelable, bubbles, composed } = { ...options };
    this[kCancelable] = !!cancelable;
    this[kBubbles] = !!bubbles;
    this[kComposed] = !!composed;
    this[kType] = `${type}`;
    this[kDefaultPrevented] = false;
    this[kTimestamp] = performance.now();
    this[kPropagationStopped] = false;
    this[kTarget] = null;
    this[kIsBeingDispatched] = false;
  }

  [customInspectSymbol](depth, options) {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    const name = this.constructor.name;
    if (depth < 0) {
      return name;
    }

    const opts = Object.assign({}, options, {
      depth: NumberIsInteger(options.depth) ? options.depth - 1 : options.depth,
    });

    return `${name} ${
      inspect({
        type: this[kType],
        defaultPrevented: this[kDefaultPrevented],
        cancelable: this[kCancelable],
        timeStamp: this[kTimestamp],
      }, opts)
    }`;
  }

  stopImmediatePropagation() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    this[kStop] = true;
  }

  preventDefault() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    this[kDefaultPrevented] = true;
  }

  /**
   * @type {EventTarget}
   */
  get target() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kTarget];
  }

  /**
   * @type {EventTarget}
   */
  get currentTarget() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kTarget];
  }

  /**
   * @type {EventTarget}
   */
  get srcElement() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kTarget];
  }

  /**
   * @type {string}
   */
  get type() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kType];
  }

  /**
   * @type {boolean}
   */
  get cancelable() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kCancelable];
  }

  /**
   * @type {boolean}
   */
  get defaultPrevented() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kCancelable] && this[kDefaultPrevented];
  }

  /**
   * @type {number}
   */
  get timeStamp() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kTimestamp];
  }

  // The following are non-op and unused properties/methods from Web API Event.
  // These are not supported in Node.js and are provided purely for
  // API completeness.
  /**
   * @returns {EventTarget[]}
   */
  composedPath() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kIsBeingDispatched] ? [this[kTarget]] : [];
  }

  /**
   * @type {boolean}
   */
  get returnValue() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return !this.defaultPrevented;
  }

  /**
   * @type {boolean}
   */
  get bubbles() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kBubbles];
  }

  /**
   * @type {boolean}
   */
  get composed() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kComposed];
  }

  /**
   * @type {number}
   */
  get eventPhase() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kIsBeingDispatched] ? Event.AT_TARGET : Event.NONE;
  }

  /**
   * @type {boolean}
   */
  get cancelBubble() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    return this[kPropagationStopped];
  }

  /**
   * @type {boolean}
   */
  set cancelBubble(value) {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    if (value) {
      this.stopPropagation();
    }
  }

  stopPropagation() {
    if (!isEvent(this)) {
      throw new ERR_INVALID_THIS("Event");
    }
    this[kPropagationStopped] = true;
  }

  static NONE = 0;
  static CAPTURING_PHASE = 1;
  static AT_TARGET = 2;
  static BUBBLING_PHASE = 3;
}

Object.defineProperties(
  Event.prototype,
  {
    [Symbol.toStringTag]: {
      writable: true,
      enumerable: false,
      configurable: true,
      value: "Event",
    },
    stopImmediatePropagation: kEnumerableProperty,
    preventDefault: kEnumerableProperty,
    target: kEnumerableProperty,
    currentTarget: kEnumerableProperty,
    srcElement: kEnumerableProperty,
    type: kEnumerableProperty,
    cancelable: kEnumerableProperty,
    defaultPrevented: kEnumerableProperty,
    timeStamp: kEnumerableProperty,
    composedPath: kEnumerableProperty,
    returnValue: kEnumerableProperty,
    bubbles: kEnumerableProperty,
    composed: kEnumerableProperty,
    eventPhase: kEnumerableProperty,
    cancelBubble: kEnumerableProperty,
    stopPropagation: kEnumerableProperty,
  },
);

function isCustomEvent(value) {
  return isEvent(value) && (value?.[kDetail] !== undefined);
}

class CustomEvent extends Event {
  /**
   * @constructor
   * @param {string} type
   * @param {{
   *   bubbles?: boolean,
   *   cancelable?: boolean,
   *   composed?: boolean,
   *   detail?: any,
   * }} [options]
   */
  constructor(type, options = kEmptyObject) {
    if (arguments.length === 0) {
      throw new ERR_MISSING_ARGS("type");
    }
    super(type, options);
    this[kDetail] = options?.detail ?? null;
  }

  /**
   * @type {any}
   */
  get detail() {
    if (!isCustomEvent(this)) {
      throw new ERR_INVALID_THIS("CustomEvent");
    }
    return this[kDetail];
  }
}

Object.defineProperties(CustomEvent.prototype, {
  [Symbol.toStringTag]: {
    __proto__: null,
    writable: false,
    enumerable: false,
    configurable: true,
    value: "CustomEvent",
  },
  detail: kEnumerableProperty,
});

class NodeCustomEvent extends Event {
  constructor(type, options) {
    super(type, options);
    if (options?.detail) {
      this.detail = options.detail;
    }
  }
}

// Weak listener cleanup
// This has to be lazy for snapshots to work
let weakListenersState = null;
// The resource needs to retain the callback so that it doesn't
// get garbage collected now that it's weak.
let objectToWeakListenerMap = null;
function weakListeners() {
  weakListenersState ??= new FinalizationRegistry(
    (listener) => listener.remove(),
  );
  objectToWeakListenerMap ??= new WeakMap();
  return { registry: weakListenersState, map: objectToWeakListenerMap };
}

// The listeners for an EventTarget are maintained as a linked list.
// Unfortunately, the way EventTarget is defined, listeners are accounted
// using the tuple [handler,capture], and even if we don't actually make
// use of capture or bubbling, in order to be spec compliant we have to
// take on the additional complexity of supporting it. Fortunately, using
// the linked list makes dispatching faster, even if adding/removing is
// slower.
class Listener {
  constructor(
    previous,
    listener,
    once,
    capture,
    passive,
    isNodeStyleListener,
    weak,
  ) {
    this.next = undefined;
    if (previous !== undefined) {
      previous.next = this;
    }
    this.previous = previous;
    this.listener = listener;
    // TODO(benjamingr) these 4 can be 'flags' to save 3 slots
    this.once = once;
    this.capture = capture;
    this.passive = passive;
    this.isNodeStyleListener = isNodeStyleListener;
    this.removed = false;
    this.weak = Boolean(weak); // Don't retain the object

    if (this.weak) {
      this.callback = new WeakRef(listener);
      weakListeners().registry.register(listener, this, this);
      // Make the retainer retain the listener in a WeakMap
      weakListeners().map.set(weak, listener);
      this.listener = this.callback;
    } else if (typeof listener === "function") {
      this.callback = listener;
      this.listener = listener;
    } else {
      this.callback = Function.prototype.bind.call(
        listener.handleEvent,
        listener,
      );
      this.listener = listener;
    }
  }

  same(listener, capture) {
    const myListener = this.weak ? this.listener.deref() : this.listener;
    return myListener === listener && this.capture === capture;
  }

  remove() {
    if (this.previous !== undefined) {
      this.previous.next = this.next;
    }
    if (this.next !== undefined) {
      this.next.previous = this.previous;
    }
    this.removed = true;
    if (this.weak) {
      weakListeners().registry.unregister(this);
    }
  }
}

function initEventTarget(self) {
  self[kEvents] = new Map();
  self[kMaxEventTargetListeners] = EventEmitter.defaultMaxListeners;
  self[kMaxEventTargetListenersWarned] = false;
}

class EventTarget extends WebEventTarget {
  // Used in checking whether an object is an EventTarget. This is a well-known
  // symbol as EventTarget may be used cross-realm.
  // Ref: https://github.com/nodejs/node/pull/33661
  static [kIsEventTarget] = true;

  constructor() {
    super();
    initEventTarget(this);
  }

  [kNewListener](size, type, _listener, _once, _capture, _passive, _weak) {
    if (
      this[kMaxEventTargetListeners] > 0 &&
      size > this[kMaxEventTargetListeners] &&
      !this[kMaxEventTargetListenersWarned]
    ) {
      this[kMaxEventTargetListenersWarned] = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      const w = new Error(
        "Possible EventTarget memory leak detected. " +
          `${size} ${type} listeners ` +
          `added to ${inspect(this, { depth: -1 })}. Use ` +
          "events.setMaxListeners() to increase limit",
      );
      w.name = "MaxListenersExceededWarning";
      w.target = this;
      w.type = type;
      w.count = size;
      emitWarning(w);
    }
  }
  [kRemoveListener](_size, _type, _listener, _capture) {}

  /**
   * @callback EventTargetCallback
   * @param {Event} event
   */

  /**
   * @typedef {{ handleEvent: EventTargetCallback }} EventListener
   */

  /**
   * @param {string} type
   * @param {EventTargetCallback|EventListener} listener
   * @param {{
   *   capture?: boolean,
   *   once?: boolean,
   *   passive?: boolean,
   *   signal?: AbortSignal
   * }} [options]
   */
  addEventListener(type, listener, options = {}) {
    if (!isEventTarget(this)) {
      throw new ERR_INVALID_THIS("EventTarget");
    }
    if (arguments.length < 2) {
      throw new ERR_MISSING_ARGS("type", "listener");
    }

    // We validateOptions before the shouldAddListeners check because the spec
    // requires us to hit getters.
    const {
      once,
      capture,
      passive,
      signal,
      isNodeStyleListener,
      weak,
    } = validateEventListenerOptions(options);

    if (!shouldAddListener(listener)) {
      // The DOM silently allows passing undefined as a second argument
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      const w = new Error(
        `addEventListener called with ${listener}` +
          " which has no effect.",
      );
      w.name = "AddEventListenerArgumentTypeWarning";
      w.target = this;
      w.type = type;
      emitWarning(w);
      return;
    }
    type = String(type);

    if (signal) {
      if (signal.aborted) {
        return;
      }
      // TODO(benjamingr) make this weak somehow? ideally the signal would
      // not prevent the event target from GC.
      signal.addEventListener("abort", () => {
        this.removeEventListener(type, listener, options);
      }, { once: true, [kWeakHandler]: this });
    }

    let root = this[kEvents].get(type);

    if (root === undefined) {
      root = { size: 1, next: undefined };
      // This is the first handler in our linked list.
      new Listener(
        root,
        listener,
        once,
        capture,
        passive,
        isNodeStyleListener,
        weak,
      );
      this[kNewListener](
        root.size,
        type,
        listener,
        once,
        capture,
        passive,
        weak,
      );
      this[kEvents].set(type, root);
      return;
    }

    let handler = root.next;
    let previous = root;

    // We have to walk the linked list to see if we have a match
    while (handler !== undefined && !handler.same(listener, capture)) {
      previous = handler;
      handler = handler.next;
    }

    if (handler !== undefined) { // Duplicate! Ignore
      return;
    }

    new Listener(
      previous,
      listener,
      once,
      capture,
      passive,
      isNodeStyleListener,
      weak,
    );
    root.size++;
    this[kNewListener](root.size, type, listener, once, capture, passive, weak);
  }

  /**
   * @param {string} type
   * @param {EventTargetCallback|EventListener} listener
   * @param {{
   *   capture?: boolean,
   * }} [options]
   */
  removeEventListener(type, listener, options = {}) {
    if (!isEventTarget(this)) {
      throw new ERR_INVALID_THIS("EventTarget");
    }
    if (!shouldAddListener(listener)) {
      return;
    }

    type = String(type);
    const capture = options?.capture === true;

    const root = this[kEvents].get(type);
    if (root === undefined || root.next === undefined) {
      return;
    }

    let handler = root.next;
    while (handler !== undefined) {
      if (handler.same(listener, capture)) {
        handler.remove();
        root.size--;
        if (root.size === 0) {
          this[kEvents].delete(type);
        }
        this[kRemoveListener](root.size, type, listener, capture);
        break;
      }
      handler = handler.next;
    }
  }

  /**
   * @param {Event} event
   */
  dispatchEvent(event) {
    if (!isEventTarget(this)) {
      throw new ERR_INVALID_THIS("EventTarget");
    }

    if (!(event instanceof globalThis.Event)) {
      throw new ERR_INVALID_ARG_TYPE("event", "Event", event);
    }

    if (event[kIsBeingDispatched]) {
      throw new ERR_EVENT_RECURSION(event.type);
    }

    this[kHybridDispatch](event, event.type, event);

    return event.defaultPrevented !== true;
  }

  [kHybridDispatch](nodeValue, type, event) {
    const createEvent = () => {
      if (event === undefined) {
        event = this[kCreateEvent](nodeValue, type);
        event[kTarget] = this;
        event[kIsBeingDispatched] = true;
      }
      return event;
    };
    if (event !== undefined) {
      event[kTarget] = this;
      event[kIsBeingDispatched] = true;
    }

    const root = this[kEvents].get(type);
    if (root === undefined || root.next === undefined) {
      if (event !== undefined) {
        event[kIsBeingDispatched] = false;
      }
      return true;
    }

    let handler = root.next;
    let next;

    while (
      handler !== undefined &&
      (handler.passive || event?.[kStop] !== true)
    ) {
      // Cache the next item in case this iteration removes the current one
      next = handler.next;

      if (handler.removed) {
        // Deal with the case an event is removed while event handlers are
        // Being processed (removeEventListener called from a listener)
        handler = next;
        continue;
      }
      if (handler.once) {
        handler.remove();
        root.size--;
        const { listener, capture } = handler;
        this[kRemoveListener](root.size, type, listener, capture);
      }

      try {
        let arg;
        if (handler.isNodeStyleListener) {
          arg = nodeValue;
        } else {
          arg = createEvent();
        }
        const callback = handler.weak
          ? handler.callback.deref()
          : handler.callback;
        let result;
        if (callback) {
          result = callback.call(this, arg);
          if (!handler.isNodeStyleListener) {
            arg[kIsBeingDispatched] = false;
          }
        }
        if (result !== undefined && result !== null) {
          addCatch(result);
        }
      } catch (err) {
        emitUncaughtException(err);
      }

      handler = next;
    }

    if (event !== undefined) {
      event[kIsBeingDispatched] = false;
    }
  }

  [kCreateEvent](nodeValue, type) {
    return new NodeCustomEvent(type, { detail: nodeValue });
  }
  [customInspectSymbol](depth, options) {
    if (!isEventTarget(this)) {
      throw new ERR_INVALID_THIS("EventTarget");
    }
    const name = this.constructor.name;
    if (depth < 0) {
      return name;
    }

    const opts = ObjectAssign({}, options, {
      depth: Number.isInteger(options.depth)
        ? options.depth - 1
        : options.depth,
    });

    return `${name} ${inspect({}, opts)}`;
  }
}

Object.defineProperties(EventTarget.prototype, {
  addEventListener: kEnumerableProperty,
  removeEventListener: kEnumerableProperty,
  dispatchEvent: kEnumerableProperty,
  [Symbol.toStringTag]: {
    writable: true,
    enumerable: false,
    configurable: true,
    value: "EventTarget",
  },
});

function initNodeEventTarget(self) {
  initEventTarget(self);
}

class NodeEventTarget extends EventTarget {
  static [kIsNodeEventTarget] = true;
  static defaultMaxListeners = 10;

  constructor() {
    super();
    initNodeEventTarget(this);
  }

  /**
   * @param {number} n
   */
  setMaxListeners(n) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    EventEmitter.setMaxListeners(n, this);
  }

  /**
   * @returns {number}
   */
  getMaxListeners() {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    return this[kMaxEventTargetListeners];
  }

  /**
   * @returns {string[]}
   */
  eventNames() {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    return Array.from(this[kEvents].keys());
  }

  /**
   * @param {string} [type]
   * @returns {number}
   */
  listenerCount(type) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    const root = this[kEvents].get(String(type));
    return root !== undefined ? root.size : 0;
  }

  /**
   * @param {string} type
   * @param {EventTargetCallback|EventListener} listener
   * @param {{
   *   capture?: boolean,
   * }} [options]
   * @returns {NodeEventTarget}
   */
  off(type, listener, options) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    this.removeEventListener(type, listener, options);
    return this;
  }

  /**
   * @param {string} type
   * @param {EventTargetCallback|EventListener} listener
   * @param {{
   *   capture?: boolean,
   * }} [options]
   * @returns {NodeEventTarget}
   */
  removeListener(type, listener, options) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    this.removeEventListener(type, listener, options);
    return this;
  }

  /**
   * @param {string} type
   * @param {EventTargetCallback|EventListener} listener
   * @returns {NodeEventTarget}
   */
  on(type, listener) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    this.addEventListener(type, listener, { [kIsNodeStyleListener]: true });
    return this;
  }

  /**
   * @param {string} type
   * @param {EventTargetCallback|EventListener} listener
   * @returns {NodeEventTarget}
   */
  addListener(type, listener) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    this.addEventListener(type, listener, { [kIsNodeStyleListener]: true });
    return this;
  }

  /**
   * @param {string} type
   * @param {any} arg
   * @returns {boolean}
   */
  emit(type, arg) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    validateString(type, "type");
    const hadListeners = this.listenerCount(type) > 0;
    this[kHybridDispatch](arg, type);
    return hadListeners;
  }

  /**
   * @param {string} type
   * @param {EventTargetCallback|EventListener} listener
   * @returns {NodeEventTarget}
   */
  once(type, listener) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    this.addEventListener(type, listener, {
      once: true,
      [kIsNodeStyleListener]: true,
    });
    return this;
  }

  /**
   * @param {string} type
   * @returns {NodeEventTarget}
   */
  removeAllListeners(type) {
    if (!isNodeEventTarget(this)) {
      throw new ERR_INVALID_THIS("NodeEventTarget");
    }
    if (type !== undefined) {
      this[kEvents].delete(String(type));
    } else {
      this[kEvents].clear();
    }

    return this;
  }
}

Object.defineProperties(NodeEventTarget.prototype, {
  setMaxListeners: kEnumerableProperty,
  getMaxListeners: kEnumerableProperty,
  eventNames: kEnumerableProperty,
  listenerCount: kEnumerableProperty,
  off: kEnumerableProperty,
  removeListener: kEnumerableProperty,
  on: kEnumerableProperty,
  addListener: kEnumerableProperty,
  once: kEnumerableProperty,
  emit: kEnumerableProperty,
  removeAllListeners: kEnumerableProperty,
});

// EventTarget API

function shouldAddListener(listener) {
  if (
    typeof listener === "function" ||
    typeof listener?.handleEvent === "function"
  ) {
    return true;
  }

  if (listener == null) {
    return false;
  }

  throw new ERR_INVALID_ARG_TYPE("listener", "EventListener", listener);
}

function validateEventListenerOptions(options) {
  if (typeof options === "boolean") {
    return { capture: options };
  }

  if (options === null) {
    return {};
  }
  validateObject(options, "options", {
    allowArray: true,
    allowFunction: true,
  });
  return {
    once: Boolean(options.once),
    capture: Boolean(options.capture),
    passive: Boolean(options.passive),
    signal: options.signal,
    weak: options[kWeakHandler],
    isNodeStyleListener: Boolean(options[kIsNodeStyleListener]),
  };
}

function isEventTarget(obj) {
  return obj instanceof globalThis.EventTarget;
}

function isNodeEventTarget(obj) {
  return obj?.constructor?.[kIsNodeEventTarget];
}

function addCatch(promise) {
  const then = promise.then;
  if (typeof then === "function") {
    then.call(promise, undefined, function (err) {
      // The callback is called with nextTick to avoid a follow-up
      // rejection from this promise.
      emitUncaughtException(err);
    });
  }
}

function emitUncaughtException(err) {
  nextTick(() => {
    throw err;
  });
}

function makeEventHandler(handler) {
  // Event handlers are dispatched in the order they were first set
  // See https://github.com/nodejs/node/pull/35949#issuecomment-722496598
  function eventHandler(...args) {
    if (typeof eventHandler.handler !== "function") {
      return;
    }
    return Reflect.apply(eventHandler.handler, this, args);
  }
  eventHandler.handler = handler;
  return eventHandler;
}

function defineEventHandler(emitter, name) {
  // 8.1.5.1 Event handlers - basically `on[eventName]` attributes
  Object.defineProperty(emitter, `on${name}`, {
    get() {
      return this[kHandlers]?.get(name)?.handler ?? null;
    },
    set(value) {
      if (!this[kHandlers]) {
        this[kHandlers] = new Map();
      }
      let wrappedHandler = this[kHandlers]?.get(name);
      if (wrappedHandler) {
        if (typeof wrappedHandler.handler === "function") {
          this[kEvents].get(name).size--;
          const size = this[kEvents].get(name).size;
          this[kRemoveListener](size, name, wrappedHandler.handler, false);
        }
        wrappedHandler.handler = value;
        if (typeof wrappedHandler.handler === "function") {
          this[kEvents].get(name).size++;
          const size = this[kEvents].get(name).size;
          this[kNewListener](size, name, value, false, false, false, false);
        }
      } else {
        wrappedHandler = makeEventHandler(value);
        this.addEventListener(name, wrappedHandler);
      }
      this[kHandlers].set(name, wrappedHandler);
    },
    configurable: true,
    enumerable: true,
  });
}

const EventEmitterMixin = (Superclass) => {
  class MixedEventEmitter extends Superclass {
    constructor(...args) {
      super(...args);
      EventEmitter.call(this);
    }
  }
  const protoProps = Object.getOwnPropertyDescriptors(EventEmitter.prototype);
  delete protoProps.constructor;
  Object.defineProperties(MixedEventEmitter.prototype, protoProps);
  return MixedEventEmitter;
};

export {
  CustomEvent,
  defineEventHandler,
  Event,
  EventEmitterMixin,
  EventTarget,
  initEventTarget,
  initNodeEventTarget,
  isEventTarget,
  kCreateEvent,
  kEvents,
  kNewListener,
  kRemoveListener,
  kTrustEvent,
  kWeakHandler,
  NodeEventTarget,
};

export default {
  CustomEvent,
  Event,
  EventEmitterMixin,
  EventTarget,
  NodeEventTarget,
  defineEventHandler,
  initEventTarget,
  initNodeEventTarget,
  kCreateEvent,
  kNewListener,
  kTrustEvent,
  kRemoveListener,
  kEvents,
  kWeakHandler,
  isEventTarget,
};
