// Copyright 2018-2025 the Deno authors. MIT license.

import { core, primordials } from "ext:core/mod.js";
import {
  op_otel_log,
  op_otel_log_foreign,
  op_otel_metric_attribute3,
  op_otel_metric_observable_record0,
  op_otel_metric_observable_record1,
  op_otel_metric_observable_record2,
  op_otel_metric_observable_record3,
  op_otel_metric_observation_done,
  op_otel_metric_record0,
  op_otel_metric_record1,
  op_otel_metric_record2,
  op_otel_metric_record3,
  op_otel_metric_wait_to_observe,
  op_otel_span_add_link,
  op_otel_span_attribute1,
  op_otel_span_attribute2,
  op_otel_span_attribute3,
  op_otel_span_update_name,
  OtelMeter,
  OtelSpan,
  OtelTracer,
} from "ext:core/ops";
import { Console } from "ext:deno_console/01_console.js";

const {
  ArrayFrom,
  ArrayIsArray,
  ArrayPrototypeFilter,
  ArrayPrototypeForEach,
  ArrayPrototypeJoin,
  ArrayPrototypeMap,
  ArrayPrototypePush,
  ArrayPrototypeReduce,
  ArrayPrototypeReverse,
  ArrayPrototypeShift,
  ArrayPrototypeSlice,
  DatePrototype,
  DatePrototypeGetTime,
  Error,
  MapPrototypeEntries,
  MapPrototypeKeys,
  Number,
  NumberParseInt,
  NumberPrototypeToString,
  ObjectAssign,
  ObjectDefineProperty,
  ObjectEntries,
  ObjectKeys,
  ObjectPrototypeIsPrototypeOf,
  ObjectValues,
  ReflectApply,
  SafeArrayIterator,
  SafeIterator,
  SafeMap,
  SafePromiseAll,
  SafeRegExp,
  SafeSet,
  SafeWeakSet,
  StringPrototypeIndexOf,
  StringPrototypeSlice,
  StringPrototypeSplit,
  StringPrototypeSubstring,
  StringPrototypeTrim,
  SymbolFor,
  TypeError,
  decodeURIComponent,
  encodeURIComponent,
} = primordials;
const { AsyncVariable, getAsyncContext, setAsyncContext } = core;

export let TRACING_ENABLED = false;
export let METRICS_ENABLED = false;
export let PROPAGATORS: TextMapPropagator[] = [];

// Note: These start at 0 in the JS library,
// but start at 1 when serialized with JSON.
enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

interface TraceState {
  set(key: string, value: string): TraceState;
  unset(key: string): TraceState;
  get(key: string): string | undefined;
  serialize(): string;
}

interface SpanContext {
  traceId: string;
  spanId: string;
  isRemote?: boolean;
  traceFlags: number;
  traceState?: TraceState;
}

enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

type AttributeValue =
  | string
  | number
  | boolean
  | Array<null | undefined | string>
  | Array<null | undefined | number>
  | Array<null | undefined | boolean>;

interface Attributes {
  [attributeKey: string]: AttributeValue | undefined;
}

type SpanAttributes = Attributes;

type TimeInput = [number, number] | number | Date;

interface SpanOptions {
  kind?: SpanKind;
  attributes?: Attributes;
  links?: Link[];
  startTime?: TimeInput;
  root?: boolean;
}

interface Link {
  context: SpanContext;
  attributes?: SpanAttributes;
  droppedAttributesCount?: number;
}

interface IArrayValue {
  values: IAnyValue[];
}

interface IAnyValue {
  stringValue?: string | null;
  boolValue?: boolean | null;
  intValue?: number | null;
  doubleValue?: number | null;
  arrayValue?: IArrayValue;
  kvlistValue?: IKeyValueList;
  bytesValue?: Uint8Array;
}

interface IKeyValueList {
  values: IKeyValue[];
}

interface IKeyValue {
  key: string;
  value: IAnyValue;
}

function hrToMs(hr: [number, number]): number {
  return (hr[0] * 1e3 + hr[1] / 1e6);
}

interface AsyncContextSnapshot {
  __brand: "AsyncContextSnapshot";
}

export function enterSpan(span: Span): AsyncContextSnapshot | undefined {
  if (!span.isRecording()) return undefined;
  const context = (CURRENT.get() ?? ROOT_CONTEXT).setValue(SPAN_KEY, span);
  return CURRENT.enter(context);
}

export const currentSnapshot = getAsyncContext;
export const restoreSnapshot = setAsyncContext;

function isDate(value: unknown): value is Date {
  return ObjectPrototypeIsPrototypeOf(value, DatePrototype);
}

interface OtelTracer {
  __key: "tracer";

  // deno-lint-ignore no-misused-new
  new (name: string, version?: string, schemaUrl?: string): OtelTracer;

  startSpan(
    parent: OtelSpan | undefined,
    name: string,
    spanKind: SpanKind,
    startTime: number | undefined,
    attributeCount: number,
  ): OtelSpan;

  startSpanForeign(
    parentTraceId: string,
    parentSpanId: string,
    name: string,
    spanKind: SpanKind,
    startTime: number | undefined,
    attributeCount: number,
  ): OtelSpan;
}

interface OtelSpan {
  __key: "span";

  spanContext(): SpanContext;
  setStatus(status: SpanStatusCode, errorDescription: string): void;
  dropEvent(): void;
  end(endTime: number): void;
}

interface TracerOptions {
  schemaUrl?: string;
}

class TracerProvider {
  constructor() {
    throw new TypeError("TracerProvider can not be constructed");
  }

  static getTracer(
    name: string,
    version?: string,
    options?: TracerOptions,
  ): Tracer {
    const tracer = new OtelTracer(name, version, options?.schemaUrl);
    return new Tracer(tracer);
  }
}

class Tracer {
  #tracer: OtelTracer;

  constructor(tracer: OtelTracer) {
    this.#tracer = tracer;
  }

  startActiveSpan<F extends (span: Span) => unknown>(
    name: string,
    fn: F,
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => unknown>(
    name: string,
    options: SpanOptions,
    fn: F,
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => unknown>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: F,
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => unknown>(
    name: string,
    optionsOrFn: SpanOptions | F,
    fnOrContext?: F | Context,
    maybeFn?: F,
  ) {
    let options;
    let context;
    let fn;
    if (typeof optionsOrFn === "function") {
      options = undefined;
      fn = optionsOrFn;
    } else if (typeof fnOrContext === "function") {
      options = optionsOrFn;
      fn = fnOrContext;
    } else if (typeof maybeFn === "function") {
      options = optionsOrFn;
      context = fnOrContext;
      fn = maybeFn;
    } else {
      throw new Error("startActiveSpan requires a function argument");
    }
    if (options?.root) {
      context = ROOT_CONTEXT;
    } else {
      context = context ?? CURRENT.get() ?? ROOT_CONTEXT;
    }
    const span = this.startSpan(name, options, context);
    const ctx = CURRENT.enter(context.setValue(SPAN_KEY, span));
    try {
      return ReflectApply(fn, undefined, [span]);
    } finally {
      setAsyncContext(ctx);
    }
  }

  startSpan(name: string, options?: SpanOptions, context?: Context): Span {
    if (options?.root) {
      context = undefined;
    } else {
      context = context ?? CURRENT.get();
    }

    let startTime = options?.startTime;
    if (startTime && ArrayIsArray(startTime)) {
      startTime = hrToMs(startTime);
    } else if (startTime && isDate(startTime)) {
      startTime = DatePrototypeGetTime(startTime);
    }

    const parentSpan = context?.getValue(SPAN_KEY) as
      | Span
      | { spanContext(): SpanContext }
      | undefined;
    const attributesCount = options?.attributes
      ? ObjectKeys(options.attributes).length
      : 0;
    const parentOtelSpan: OtelSpan | null | undefined = parentSpan !== undefined
      ? getOtelSpan(parentSpan) ?? undefined
      : undefined;
    let otelSpan: OtelSpan;
    if (parentOtelSpan || !parentSpan) {
      otelSpan = this.#tracer.startSpan(
        parentOtelSpan,
        name,
        options?.kind ?? 0,
        startTime,
        attributesCount,
      );
    } else {
      const spanContext = parentSpan.spanContext();
      otelSpan = this.#tracer.startSpanForeign(
        spanContext.traceId,
        spanContext.spanId,
        name,
        options?.kind ?? 0,
        startTime,
        attributesCount,
      );
    }
    const span = new Span(otelSpan);
    if (options?.links) span.addLinks(options?.links);
    if (options?.attributes) span.setAttributes(options?.attributes);
    return span;
  }
}

const SPAN_KEY = SymbolFor("OpenTelemetry Context Key SPAN");

let getOtelSpan: (span: object) => OtelSpan | null | undefined;

class Span {
  #otelSpan: OtelSpan | null;
  #spanContext: SpanContext | undefined;

  static {
    // deno-lint-ignore prefer-primordials
    getOtelSpan = (span) => (#otelSpan in span ? span.#otelSpan : undefined);
  }

  constructor(otelSpan: OtelSpan | null) {
    this.#otelSpan = otelSpan;
  }

  spanContext() {
    if (!this.#spanContext) {
      if (this.#otelSpan) {
        this.#spanContext = this.#otelSpan.spanContext();
      } else {
        this.#spanContext = {
          traceId: "00000000000000000000000000000000",
          spanId: "0000000000000000",
          traceFlags: 0,
        };
      }
    }
    return this.#spanContext;
  }

  addEvent(
    _name: string,
    _attributesOrStartTime?: Attributes | TimeInput,
    _startTime?: TimeInput,
  ): this {
    this.#otelSpan?.dropEvent();
    return this;
  }

  addLink(link: Link): this {
    const droppedAttributeCount = (link.droppedAttributesCount ?? 0) +
      (link.attributes ? ObjectKeys(link.attributes).length : 0);
    const valid = op_otel_span_add_link(
      this.#otelSpan,
      link.context.traceId,
      link.context.spanId,
      link.context.traceFlags,
      link.context.isRemote ?? false,
      droppedAttributeCount,
    );
    if (!valid) return this;
    return this;
  }

  addLinks(links: Link[]): this {
    for (let i = 0; i < links.length; i++) {
      this.addLink(links[i]);
    }
    return this;
  }

  end(endTime?: TimeInput): void {
    if (endTime && ArrayIsArray(endTime)) {
      endTime = hrToMs(endTime);
    } else if (endTime && isDate(endTime)) {
      endTime = DatePrototypeGetTime(endTime);
    }
    this.#otelSpan?.end(endTime || NaN);
  }

  isRecording(): boolean {
    return this.#otelSpan !== undefined;
  }

  // deno-lint-ignore no-explicit-any
  recordException(_exception: any, _time?: TimeInput): void {
    this.#otelSpan?.dropEvent();
  }

  setAttribute(key: string, value: AttributeValue): this {
    if (!this.#otelSpan) return this;
    op_otel_span_attribute1(this.#otelSpan, key, value);
    return this;
  }

  setAttributes(attributes: Attributes): this {
    if (!this.#otelSpan) return this;
    const attributeKvs = ObjectEntries(attributes);
    let i = 0;
    while (i < attributeKvs.length) {
      if (i + 2 < attributeKvs.length) {
        op_otel_span_attribute3(
          this.#otelSpan,
          attributeKvs[i][0],
          attributeKvs[i][1],
          attributeKvs[i + 1][0],
          attributeKvs[i + 1][1],
          attributeKvs[i + 2][0],
          attributeKvs[i + 2][1],
        );
        i += 3;
      } else if (i + 1 < attributeKvs.length) {
        op_otel_span_attribute2(
          this.#otelSpan,
          attributeKvs[i][0],
          attributeKvs[i][1],
          attributeKvs[i + 1][0],
          attributeKvs[i + 1][1],
        );
        i += 2;
      } else {
        op_otel_span_attribute1(
          this.#otelSpan,
          attributeKvs[i][0],
          attributeKvs[i][1],
        );
        i += 1;
      }
    }
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.#otelSpan?.setStatus(status.code, status.message ?? "");
    return this;
  }

  updateName(name: string): this {
    if (!this.#otelSpan) return this;
    op_otel_span_update_name(this.#otelSpan, name);
    return this;
  }
}

const CURRENT = new AsyncVariable();

class Context {
  // @ts-ignore __proto__ is not supported in TypeScript
  #data: Record<symbol, unknown> = { __proto__: null };

  constructor(data?: Record<symbol, unknown> | null | undefined) {
    // @ts-ignore __proto__ is not supported in TypeScript
    this.#data = { __proto__: null, ...data };
  }

  getValue(key: symbol): unknown {
    return this.#data[key];
  }

  setValue(key: symbol, value: unknown): Context {
    const c = new Context(this.#data);
    c.#data[key] = value;
    return c;
  }

  deleteValue(key: symbol): Context {
    const c = new Context(this.#data);
    delete c.#data[key];
    return c;
  }
}

// TODO(lucacasonato): @opentelemetry/api defines it's own ROOT_CONTEXT
const ROOT_CONTEXT = new Context();

// Context manager for opentelemetry js library
export class ContextManager {
  constructor() {
    throw new TypeError("ContextManager can not be constructed");
  }

  static active(): Context {
    return CURRENT.get() ?? ROOT_CONTEXT;
  }

  static with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    const ctx = CURRENT.enter(context);
    try {
      return ReflectApply(fn, thisArg, args);
    } finally {
      setAsyncContext(ctx);
    }
  }

  // deno-lint-ignore no-explicit-any
  static bind<T extends (...args: any[]) => any>(
    context: Context,
    target: T,
  ): T {
    return ((...args) => {
      const ctx = CURRENT.enter(context);
      try {
        return ReflectApply(target, this, args);
      } finally {
        setAsyncContext(ctx);
      }
    }) as T;
  }

  static enable() {
    return this;
  }

  static disable() {
    return this;
  }
}

// metrics

interface MeterOptions {
  schemaUrl?: string;
}

interface MetricOptions {
  description?: string;

  unit?: string;

  valueType?: ValueType;

  advice?: MetricAdvice;
}

enum ValueType {
  INT = 0,
  DOUBLE = 1,
}

interface MetricAdvice {
  /**
   * Hint the explicit bucket boundaries for SDK if the metric is been
   * aggregated with a HistogramAggregator.
   */
  explicitBucketBoundaries?: number[];
}

interface OtelMeter {
  __key: "meter";
  createCounter(name: string, description?: string, unit?: string): Instrument;
  createUpDownCounter(
    name: string,
    description?: string,
    unit?: string,
  ): Instrument;
  createGauge(name: string, description?: string, unit?: string): Instrument;
  createHistogram(
    name: string,
    description?: string,
    unit?: string,
    explicitBucketBoundaries?: number[],
  ): Instrument;
  createObservableCounter(
    name: string,
    description?: string,
    unit?: string,
  ): Instrument;
  createObservableUpDownCounter(
    name: string,
    description?: string,
    unit?: string,
  ): Instrument;
  createObservableGauge(
    name: string,
    description?: string,
    unit?: string,
  ): Instrument;
}

class MeterProvider {
  constructor() {
    throw new TypeError("MeterProvider can not be constructed");
  }

  static getMeter(
    name: string,
    version?: string,
    options?: MeterOptions,
  ): Meter {
    const meter = new OtelMeter(name, version, options?.schemaUrl);
    return new Meter(meter);
  }
}

type MetricAttributes = Attributes;

type Instrument = { __key: "instrument" };

let batchResultHasObservables: (
  res: BatchObservableResult,
  observables: Observable[],
) => boolean;

class BatchObservableResult {
  #observables: WeakSet<Observable>;

  constructor(observables: WeakSet<Observable>) {
    this.#observables = observables;
  }

  static {
    batchResultHasObservables = (cb, observables) => {
      for (const observable of new SafeIterator(observables)) {
        if (!cb.#observables.has(observable)) return false;
      }
      return true;
    };
  }

  observe(
    metric: Observable,
    value: number,
    attributes?: MetricAttributes,
  ): void {
    if (!this.#observables.has(metric)) return;
    getObservableResult(metric).observe(value, attributes);
  }
}

const BATCH_CALLBACKS = new SafeMap<
  BatchObservableCallback,
  BatchObservableResult
>();
const INDIVIDUAL_CALLBACKS = new SafeMap<Observable, Set<ObservableCallback>>();

class Meter {
  #meter: OtelMeter;

  constructor(meter: OtelMeter) {
    this.#meter = meter;
  }

  createCounter(name: string, options?: MetricOptions): Counter {
    if (options?.valueType !== undefined && options?.valueType !== 1) {
      throw new Error("Only valueType: DOUBLE is supported");
    }
    if (!METRICS_ENABLED) return new Counter(null, false);
    const instrument = this.#meter.createCounter(
      name,
      // deno-lint-ignore prefer-primordials
      options?.description,
      options?.unit,
    ) as Instrument;
    return new Counter(instrument, false);
  }

  createUpDownCounter(name: string, options?: MetricOptions): Counter {
    if (options?.valueType !== undefined && options?.valueType !== 1) {
      throw new Error("Only valueType: DOUBLE is supported");
    }
    if (!METRICS_ENABLED) return new Counter(null, true);
    const instrument = this.#meter.createUpDownCounter(
      name,
      // deno-lint-ignore prefer-primordials
      options?.description,
      options?.unit,
    ) as Instrument;
    return new Counter(instrument, true);
  }

  createGauge(name: string, options?: MetricOptions): Gauge {
    if (options?.valueType !== undefined && options?.valueType !== 1) {
      throw new Error("Only valueType: DOUBLE is supported");
    }
    if (!METRICS_ENABLED) return new Gauge(null);
    const instrument = this.#meter.createGauge(
      name,
      // deno-lint-ignore prefer-primordials
      options?.description,
      options?.unit,
    ) as Instrument;
    return new Gauge(instrument);
  }

  createHistogram(name: string, options?: MetricOptions): Histogram {
    if (options?.valueType !== undefined && options?.valueType !== 1) {
      throw new Error("Only valueType: DOUBLE is supported");
    }
    if (!METRICS_ENABLED) return new Histogram(null);
    const instrument = this.#meter.createHistogram(
      name,
      // deno-lint-ignore prefer-primordials
      options?.description,
      options?.unit,
      options?.advice?.explicitBucketBoundaries,
    ) as Instrument;
    return new Histogram(instrument);
  }

  createObservableCounter(name: string, options?: MetricOptions): Observable {
    if (options?.valueType !== undefined && options?.valueType !== 1) {
      throw new Error("Only valueType: DOUBLE is supported");
    }
    if (!METRICS_ENABLED) new Observable(new ObservableResult(null, true));
    const instrument = this.#meter.createObservableCounter(
      name,
      // deno-lint-ignore prefer-primordials
      options?.description,
      options?.unit,
    ) as Instrument;
    return new Observable(new ObservableResult(instrument, true));
  }

  createObservableUpDownCounter(
    name: string,
    options?: MetricOptions,
  ): Observable {
    if (options?.valueType !== undefined && options?.valueType !== 1) {
      throw new Error("Only valueType: DOUBLE is supported");
    }
    if (!METRICS_ENABLED) new Observable(new ObservableResult(null, false));
    const instrument = this.#meter.createObservableUpDownCounter(
      name,
      // deno-lint-ignore prefer-primordials
      options?.description,
      options?.unit,
    ) as Instrument;
    return new Observable(new ObservableResult(instrument, false));
  }

  createObservableGauge(name: string, options?: MetricOptions): Observable {
    if (options?.valueType !== undefined && options?.valueType !== 1) {
      throw new Error("Only valueType: DOUBLE is supported");
    }
    if (!METRICS_ENABLED) new Observable(new ObservableResult(null, false));
    const instrument = this.#meter.createObservableGauge(
      name,
      // deno-lint-ignore prefer-primordials
      options?.description,
      options?.unit,
    ) as Instrument;
    return new Observable(new ObservableResult(instrument, false));
  }

  addBatchObservableCallback(
    callback: BatchObservableCallback,
    observables: Observable[],
  ): void {
    if (!METRICS_ENABLED) return;
    const result = new BatchObservableResult(new SafeWeakSet(observables));
    startObserving();
    BATCH_CALLBACKS.set(callback, result);
  }

  removeBatchObservableCallback(
    callback: BatchObservableCallback,
    observables: Observable[],
  ): void {
    if (!METRICS_ENABLED) return;
    const result = BATCH_CALLBACKS.get(callback);
    if (result && batchResultHasObservables(result, observables)) {
      BATCH_CALLBACKS.delete(callback);
    }
  }
}

type BatchObservableCallback = (
  observableResult: BatchObservableResult,
) => void | Promise<void>;

function record(
  instrument: Instrument | null,
  value: number,
  attributes?: MetricAttributes,
) {
  if (instrument === null) return;
  if (attributes === undefined) {
    op_otel_metric_record0(instrument, value);
  } else {
    const attrs = ObjectEntries(attributes);
    if (attrs.length === 0) {
      op_otel_metric_record0(instrument, value);
    }
    let i = 0;
    while (i < attrs.length) {
      const remaining = attrs.length - i;
      if (remaining > 3) {
        op_otel_metric_attribute3(
          instrument,
          value,
          attrs[i][0],
          attrs[i][1],
          attrs[i + 1][0],
          attrs[i + 1][1],
          attrs[i + 2][0],
          attrs[i + 2][1],
        );
        i += 3;
      } else if (remaining === 3) {
        op_otel_metric_record3(
          instrument,
          value,
          attrs[i][0],
          attrs[i][1],
          attrs[i + 1][0],
          attrs[i + 1][1],
          attrs[i + 2][0],
          attrs[i + 2][1],
        );
        i += 3;
      } else if (remaining === 2) {
        op_otel_metric_record2(
          instrument,
          value,
          attrs[i][0],
          attrs[i][1],
          attrs[i + 1][0],
          attrs[i + 1][1],
        );
        i += 2;
      } else if (remaining === 1) {
        op_otel_metric_record1(instrument, value, attrs[i][0], attrs[i][1]);
        i += 1;
      }
    }
  }
}

function recordObservable(
  instrument: Instrument | null,
  value: number,
  attributes?: MetricAttributes,
) {
  if (instrument === null) return;
  if (attributes === undefined) {
    op_otel_metric_observable_record0(instrument, value);
  } else {
    const attrs = ObjectEntries(attributes);
    if (attrs.length === 0) {
      op_otel_metric_observable_record0(instrument, value);
    }
    let i = 0;
    while (i < attrs.length) {
      const remaining = attrs.length - i;
      if (remaining > 3) {
        op_otel_metric_attribute3(
          instrument,
          value,
          attrs[i][0],
          attrs[i][1],
          attrs[i + 1][0],
          attrs[i + 1][1],
          attrs[i + 2][0],
          attrs[i + 2][1],
        );
        i += 3;
      } else if (remaining === 3) {
        op_otel_metric_observable_record3(
          instrument,
          value,
          attrs[i][0],
          attrs[i][1],
          attrs[i + 1][0],
          attrs[i + 1][1],
          attrs[i + 2][0],
          attrs[i + 2][1],
        );
        i += 3;
      } else if (remaining === 2) {
        op_otel_metric_observable_record2(
          instrument,
          value,
          attrs[i][0],
          attrs[i][1],
          attrs[i + 1][0],
          attrs[i + 1][1],
        );
        i += 2;
      } else if (remaining === 1) {
        op_otel_metric_observable_record1(
          instrument,
          value,
          attrs[i][0],
          attrs[i][1],
        );
        i += 1;
      }
    }
  }
}

class Counter {
  #instrument: Instrument | null;
  #upDown: boolean;

  constructor(instrument: Instrument | null, upDown: boolean) {
    this.#instrument = instrument;
    this.#upDown = upDown;
  }

  add(value: number, attributes?: MetricAttributes, _context?: Context): void {
    if (value < 0 && !this.#upDown) {
      throw new Error("Counter can only be incremented");
    }
    record(this.#instrument, value, attributes);
  }
}

class Gauge {
  #instrument: Instrument | null;

  constructor(instrument: Instrument | null) {
    this.#instrument = instrument;
  }

  record(
    value: number,
    attributes?: MetricAttributes,
    _context?: Context,
  ): void {
    record(this.#instrument, value, attributes);
  }
}

class Histogram {
  #instrument: Instrument | null;

  constructor(instrument: Instrument | null) {
    this.#instrument = instrument;
  }

  record(
    value: number,
    attributes?: MetricAttributes,
    _context?: Context,
  ): void {
    record(this.#instrument, value, attributes);
  }
}

type ObservableCallback = (
  observableResult: ObservableResult,
) => void | Promise<void>;

let getObservableResult: (observable: Observable) => ObservableResult;

class Observable {
  #result: ObservableResult;

  constructor(result: ObservableResult) {
    this.#result = result;
  }

  static {
    getObservableResult = (observable) => observable.#result;
  }

  addCallback(callback: ObservableCallback): void {
    const res = INDIVIDUAL_CALLBACKS.get(this);
    if (res) res.add(callback);
    else INDIVIDUAL_CALLBACKS.set(this, new SafeSet([callback]));
    startObserving();
  }

  removeCallback(callback: ObservableCallback): void {
    const res = INDIVIDUAL_CALLBACKS.get(this);
    if (res) res.delete(callback);
    if (res?.size === 0) INDIVIDUAL_CALLBACKS.delete(this);
  }
}

class ObservableResult {
  #instrument: Instrument | null;
  #isRegularCounter: boolean;

  constructor(instrument: Instrument | null, isRegularCounter: boolean) {
    this.#instrument = instrument;
    this.#isRegularCounter = isRegularCounter;
  }

  observe(
    this: ObservableResult,
    value: number,
    attributes?: MetricAttributes,
  ): void {
    if (this.#isRegularCounter) {
      if (value < 0) {
        throw new Error("Observable counters can only be incremented");
      }
    }
    recordObservable(this.#instrument, value, attributes);
  }
}

async function observe(): Promise<void> {
  const promises: Promise<void>[] = [];
  // Primordials are not needed, because this is a SafeMap.
  // deno-lint-ignore prefer-primordials
  for (const { 0: observable, 1: callbacks } of INDIVIDUAL_CALLBACKS) {
    const result = getObservableResult(observable);
    // Primordials are not needed, because this is a SafeSet.
    // deno-lint-ignore prefer-primordials
    for (const callback of callbacks) {
      // PromiseTry is not in primordials?
      // deno-lint-ignore prefer-primordials
      ArrayPrototypePush(promises, Promise.try(callback, result));
    }
  }
  // Primordials are not needed, because this is a SafeMap.
  // deno-lint-ignore prefer-primordials
  for (const { 0: callback, 1: result } of BATCH_CALLBACKS) {
    // PromiseTry is not in primordials?
    // deno-lint-ignore prefer-primordials
    ArrayPrototypePush(promises, Promise.try(callback, result));
  }
  await SafePromiseAll(promises);
}

let isObserving = false;
function startObserving() {
  if (!isObserving) {
    isObserving = true;
    (async () => {
      while (true) {
        const promise = op_otel_metric_wait_to_observe();
        core.unrefOpPromise(promise);
        const ok = await promise;
        if (!ok) break;
        await observe();
        op_otel_metric_observation_done();
      }
    })();
  }
}

const otelConsoleConfig = {
  ignore: 0,
  capture: 1,
  replace: 2,
};

function otelLog(message: string, level: number) {
  const currentSpan = CURRENT.get()?.getValue(SPAN_KEY);
  const otelSpan = currentSpan !== undefined
    ? getOtelSpan(currentSpan)
    : undefined;
  if (otelSpan || currentSpan === undefined) {
    op_otel_log(message, level, otelSpan);
  } else {
    const spanContext = currentSpan.spanContext();
    op_otel_log_foreign(
      message,
      level,
      spanContext.traceId,
      spanContext.spanId,
      spanContext.traceFlags,
    );
  }
}

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const VERSION = "00";
const VERSION_PART = "(?!ff)[\\da-f]{2}";
const TRACE_ID_PART = "(?![0]{32})[\\da-f]{32}";
const PARENT_ID_PART = "(?![0]{16})[\\da-f]{16}";
const FLAGS_PART = "[\\da-f]{2}";
const TRACE_PARENT_REGEX = new SafeRegExp(
  `^\\s?(${VERSION_PART})-(${TRACE_ID_PART})-(${PARENT_ID_PART})-(${FLAGS_PART})(-.*)?\\s?$`,
);
const VALID_TRACEID_REGEX = new SafeRegExp("^([0-9a-f]{32})$", "i");
const VALID_SPANID_REGEX = new SafeRegExp("^[0-9a-f]{16}$", "i");
const MAX_TRACE_STATE_ITEMS = 32;
const MAX_TRACE_STATE_LEN = 512;
const LIST_MEMBERS_SEPARATOR = ",";
const LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
const VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
const VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
const VALID_VENDOR_KEY =
  `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
const VALID_KEY_REGEX = new SafeRegExp(
  `^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`,
);
const VALID_VALUE_BASE_REGEX = new SafeRegExp("^[ -~]{0,255}[!-~]$");
const INVALID_VALUE_COMMA_EQUAL_REGEX = new SafeRegExp(",|=");

const TRACE_PARENT_HEADER = "traceparent";
const TRACE_STATE_HEADER = "tracestate";
const INVALID_TRACEID = "00000000000000000000000000000000";
const INVALID_SPANID = "0000000000000000";
const INVALID_SPAN_CONTEXT: SpanContext = {
  traceId: INVALID_TRACEID,
  spanId: INVALID_SPANID,
  traceFlags: 0,
};
const BAGGAGE_KEY_PAIR_SEPARATOR = "=";
const BAGGAGE_PROPERTIES_SEPARATOR = ";";
const BAGGAGE_ITEMS_SEPARATOR = ",";
const BAGGAGE_HEADER = "baggage";
const BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;
const BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
const BAGGAGE_MAX_TOTAL_LENGTH = 8192;

class NonRecordingSpan implements Span {
  constructor(
    private readonly _spanContext: SpanContext = INVALID_SPAN_CONTEXT,
  ) {}

  spanContext(): SpanContext {
    return this._spanContext;
  }

  setAttribute(_key: string, _value: unknown): this {
    return this;
  }

  setAttributes(_attributes: SpanAttributes): this {
    return this;
  }

  addEvent(_name: string, _attributes?: SpanAttributes): this {
    return this;
  }

  addLink(_link: Link): this {
    return this;
  }

  addLinks(_links: Link[]): this {
    return this;
  }

  setStatus(_status: SpanStatus): this {
    return this;
  }

  updateName(_name: string): this {
    return this;
  }

  end(_endTime?: TimeInput): void {}

  isRecording(): boolean {
    return false;
  }

  // deno-lint-ignore no-explicit-any
  recordException(_exception: any, _time?: TimeInput): void {}
}

const otelPropagators = {
  traceContext: 0,
  baggage: 1,
  none: 2,
};

function parseTraceParent(traceParent: string): SpanContext | null {
  const match = TRACE_PARENT_REGEX.exec(traceParent);
  if (!match) return null;

  // According to the specification the implementation should be compatible
  // with future versions. If there are more parts, we only reject it if it's using version 00
  // See https://www.w3.org/TR/trace-context/#versioning-of-traceparent
  if (match[1] === "00" && match[5]) return null;

  return {
    traceId: match[2],
    spanId: match[3],
    traceFlags: NumberParseInt(match[4], 16),
  };
}

// deno-lint-ignore no-explicit-any
interface TextMapSetter<Carrier = any> {
  set(carrier: Carrier, key: string, value: string): void;
}

// deno-lint-ignore no-explicit-any
interface TextMapPropagator<Carrier = any> {
  inject(
    context: Context,
    carrier: Carrier,
    setter: TextMapSetter<Carrier>,
  ): void;
  extract(
    context: Context,
    carrier: Carrier,
    getter: TextMapGetter<Carrier>,
  ): Context;
  fields(): string[];
}

// deno-lint-ignore no-explicit-any
interface TextMapGetter<Carrier = any> {
  keys(carrier: Carrier): string[];
  get(carrier: Carrier, key: string): undefined | string | string[];
}

function isTracingSuppressed(context: Context): boolean {
  return context.getValue(
    SymbolFor("OpenTelemetry SDK Context Key SUPPRESS_TRACING"),
  ) === true;
}

function isValidTraceId(traceId: string): boolean {
  return VALID_TRACEID_REGEX.test(traceId) && traceId !== INVALID_TRACEID;
}

function isValidSpanId(spanId: string): boolean {
  return VALID_SPANID_REGEX.test(spanId) && spanId !== INVALID_SPANID;
}

function isSpanContextValid(spanContext: SpanContext): boolean {
  return (
    isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId)
  );
}

function validateKey(key: string): boolean {
  return VALID_KEY_REGEX.test(key);
}

function validateValue(value: string): boolean {
  return (
    VALID_VALUE_BASE_REGEX.test(value) &&
    !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value)
  );
}

class TraceStateClass implements TraceState {
  private _internalState: Map<string, string> = new SafeMap();

  constructor(rawTraceState?: string) {
    if (rawTraceState) this._parse(rawTraceState);
  }

  set(key: string, value: string): TraceStateClass {
    const traceState = this._clone();
    if (traceState._internalState.has(key)) {
      traceState._internalState.delete(key);
    }
    traceState._internalState.set(key, value);
    return traceState;
  }

  unset(key: string): TraceStateClass {
    const traceState = this._clone();
    traceState._internalState.delete(key);
    return traceState;
  }

  get(key: string): string | undefined {
    return this._internalState.get(key);
  }

  serialize(): string {
    return ArrayPrototypeJoin(
      ArrayPrototypeReduce(this._keys(), (agg: string[], key) => {
        ArrayPrototypePush(
          agg,
          key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key),
        );
        return agg;
      }, []),
      LIST_MEMBERS_SEPARATOR,
    );
  }

  private _parse(rawTraceState: string) {
    if (rawTraceState.length > MAX_TRACE_STATE_LEN) return;
    this._internalState = ArrayPrototypeReduce(
      ArrayPrototypeReverse(
        StringPrototypeSplit(rawTraceState, LIST_MEMBERS_SEPARATOR),
      ),
      (agg: Map<string, string>, part: string) => {
        const listMember = StringPrototypeTrim(part); // Optional Whitespace (OWS) handling
        const i = StringPrototypeIndexOf(
          listMember,
          LIST_MEMBER_KEY_VALUE_SPLITTER,
        );
        if (i !== -1) {
          const key = StringPrototypeSlice(listMember, 0, i);
          const value = StringPrototypeSlice(listMember, i + 1, part.length);
          if (validateKey(key) && validateValue(value)) {
            agg.set(key, value);
          }
        }
        return agg;
      },
      new SafeMap(),
    );

    // Because of the reverse() requirement, trunc must be done after map is created
    if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
      this._internalState = new SafeMap(
        ArrayPrototypeSlice(
          ArrayPrototypeReverse(
            ArrayFrom(MapPrototypeEntries(this._internalState)),
          ),
          0,
          MAX_TRACE_STATE_ITEMS,
        ),
      );
    }
  }

  private _keys(): string[] {
    return ArrayPrototypeReverse(
      ArrayFrom(MapPrototypeKeys(this._internalState)),
    );
  }

  private _clone(): TraceStateClass {
    const traceState = new TraceStateClass();
    traceState._internalState = new SafeMap(this._internalState);
    return traceState;
  }
}

class W3CTraceContextPropagator implements TextMapPropagator {
  inject(context: Context, carrier: unknown, setter: TextMapSetter): void {
    const spanContext = (context.getValue(SPAN_KEY) as Span | undefined)
      ?.spanContext();
    if (
      !spanContext ||
      isTracingSuppressed(context) ||
      !isSpanContextValid(spanContext)
    ) {
      return;
    }

    const traceParent =
      `${VERSION}-${spanContext.traceId}-${spanContext.spanId}-0${
        NumberPrototypeToString(Number(spanContext.traceFlags || 0), 16)
      }`;

    setter.set(carrier, TRACE_PARENT_HEADER, traceParent);
    if (spanContext.traceState) {
      setter.set(
        carrier,
        TRACE_STATE_HEADER,
        spanContext.traceState.serialize(),
      );
    }
  }

  extract(context: Context, carrier: unknown, getter: TextMapGetter): Context {
    const traceParentHeader = getter.get(carrier, TRACE_PARENT_HEADER);
    if (!traceParentHeader) return context;
    const traceParent = ArrayIsArray(traceParentHeader)
      ? traceParentHeader[0]
      : traceParentHeader;
    if (typeof traceParent !== "string") return context;
    const spanContext = parseTraceParent(traceParent);
    if (!spanContext) return context;

    spanContext.isRemote = true;

    const traceStateHeader = getter.get(carrier, TRACE_STATE_HEADER);
    if (traceStateHeader) {
      // If more than one `tracestate` header is found, we merge them into a
      // single header.
      const state = ArrayIsArray(traceStateHeader)
        ? ArrayPrototypeJoin(traceStateHeader, ",")
        : traceStateHeader;
      spanContext.traceState = new TraceStateClass(
        typeof state === "string" ? state : undefined,
      );
    }
    return context.setValue(SPAN_KEY, new NonRecordingSpan(spanContext));
  }

  fields(): string[] {
    return [TRACE_PARENT_HEADER, TRACE_STATE_HEADER];
  }
}

const baggageEntryMetadataSymbol = SymbolFor("BaggageEntryMetadata");

type BaggageEntryMetadata = { toString(): string } & {
  __TYPE__: typeof baggageEntryMetadataSymbol;
};

interface BaggageEntry {
  value: string;
  metadata?: BaggageEntryMetadata;
}

interface ParsedBaggageKeyValue {
  key: string;
  value: string;
  metadata: BaggageEntryMetadata | undefined;
}

interface Baggage {
  getEntry(key: string): BaggageEntry | undefined;
  getAllEntries(): [string, BaggageEntry][];
  setEntry(key: string, entry: BaggageEntry): Baggage;
  removeEntry(key: string): Baggage;
  removeEntries(...key: string[]): Baggage;
  clear(): Baggage;
}

export function baggageEntryMetadataFromString(
  str: string,
): BaggageEntryMetadata {
  if (typeof str !== "string") {
    str = "";
  }

  return {
    __TYPE__: baggageEntryMetadataSymbol,
    toString() {
      return str;
    },
  };
}

function serializeKeyPairs(keyPairs: string[]): string {
  return ArrayPrototypeReduce(keyPairs, (hValue: string, current: string) => {
    const value = `${hValue}${
      hValue !== "" ? BAGGAGE_ITEMS_SEPARATOR : ""
    }${current}`;
    return value.length > BAGGAGE_MAX_TOTAL_LENGTH ? hValue : value;
  }, "");
}

function getKeyPairs(baggage: Baggage): string[] {
  return ArrayPrototypeMap(baggage.getAllEntries(), (baggageEntry) => {
    let entry = `${encodeURIComponent(baggageEntry[0])}=${
      encodeURIComponent(baggageEntry[1].value)
    }`;

    // include opaque metadata if provided
    // NOTE: we intentionally don't URI-encode the metadata - that responsibility falls on the metadata implementation
    if (baggageEntry[1].metadata !== undefined) {
      entry += BAGGAGE_PROPERTIES_SEPARATOR +
        // deno-lint-ignore prefer-primordials
        baggageEntry[1].metadata.toString();
    }

    return entry;
  });
}

function parsePairKeyValue(
  entry: string,
): ParsedBaggageKeyValue | undefined {
  const valueProps = StringPrototypeSplit(entry, BAGGAGE_PROPERTIES_SEPARATOR);
  if (valueProps.length <= 0) return;
  const keyPairPart = ArrayPrototypeShift(valueProps);
  if (!keyPairPart) return;
  const separatorIndex = StringPrototypeIndexOf(
    keyPairPart,
    BAGGAGE_KEY_PAIR_SEPARATOR,
  );
  if (separatorIndex <= 0) return;
  let key, value;
  try {
    key = decodeURIComponent(
      StringPrototypeTrim(
        StringPrototypeSubstring(keyPairPart, 0, separatorIndex),
      ),
    );
    value = decodeURIComponent(
      StringPrototypeTrim(
        StringPrototypeSubstring(keyPairPart, separatorIndex + 1),
      ),
    );
  } catch {
    return;
  }
  let metadata;
  if (valueProps.length > 0) {
    metadata = baggageEntryMetadataFromString(
      ArrayPrototypeJoin(valueProps, BAGGAGE_PROPERTIES_SEPARATOR),
    );
  }
  return { key, value, metadata };
}

class BaggageImpl implements Baggage {
  #entries: Map<string, BaggageEntry>;

  constructor(entries?: Map<string, BaggageEntry>) {
    this.#entries = entries ? new SafeMap(entries) : new SafeMap();
  }

  getEntry(key: string): BaggageEntry | undefined {
    const entry = this.#entries.get(key);
    if (!entry) {
      return undefined;
    }

    return ObjectAssign({}, entry);
  }

  getAllEntries(): [string, BaggageEntry][] {
    return ArrayPrototypeMap(
      ArrayFrom(MapPrototypeEntries(this.#entries)),
      (entry) => [entry[0], entry[1]],
    );
  }

  setEntry(key: string, entry: BaggageEntry): BaggageImpl {
    const newBaggage = new BaggageImpl(this.#entries);
    newBaggage.#entries.set(key, entry);
    return newBaggage;
  }

  removeEntry(key: string): BaggageImpl {
    const newBaggage = new BaggageImpl(this.#entries);
    newBaggage.#entries.delete(key);
    return newBaggage;
  }

  removeEntries(...keys: string[]): BaggageImpl {
    const newBaggage = new BaggageImpl(this.#entries);
    for (const key of new SafeArrayIterator(keys)) {
      newBaggage.#entries.delete(key);
    }
    return newBaggage;
  }

  clear(): BaggageImpl {
    return new BaggageImpl();
  }
}

export class W3CBaggagePropagator implements TextMapPropagator {
  inject(context: Context, carrier: unknown, setter: TextMapSetter): void {
    const baggage = context.getValue(baggageEntryMetadataSymbol) as
      | Baggage
      | undefined;
    if (!baggage || isTracingSuppressed(context)) return;
    const keyPairs = ArrayPrototypeSlice(
      ArrayPrototypeFilter(getKeyPairs(baggage), (pair: string) => {
        return pair.length <= BAGGAGE_MAX_PER_NAME_VALUE_PAIRS;
      }),
      0,
      BAGGAGE_MAX_NAME_VALUE_PAIRS,
    );
    const headerValue = serializeKeyPairs(keyPairs);
    if (headerValue.length > 0) {
      setter.set(carrier, BAGGAGE_HEADER, headerValue);
    }
  }

  extract(context: Context, carrier: unknown, getter: TextMapGetter): Context {
    const headerValue = getter.get(carrier, BAGGAGE_HEADER);
    const baggageString = ArrayIsArray(headerValue)
      ? ArrayPrototypeJoin(headerValue, BAGGAGE_ITEMS_SEPARATOR)
      : headerValue;
    if (!baggageString) return context;
    const baggage: Record<string, BaggageEntry> = {};
    if (baggageString.length === 0) {
      return context;
    }
    const pairs = StringPrototypeSplit(baggageString, BAGGAGE_ITEMS_SEPARATOR);
    ArrayPrototypeForEach(pairs, (entry) => {
      const keyPair = parsePairKeyValue(entry);
      if (keyPair) {
        const baggageEntry: BaggageEntry = { value: keyPair.value };
        if (keyPair.metadata) {
          baggageEntry.metadata = keyPair.metadata;
        }
        baggage[keyPair.key] = baggageEntry;
      }
    });
    if (ObjectEntries(baggage).length === 0) {
      return context;
    }

    return context.setValue(
      baggageEntryMetadataSymbol,
      new BaggageImpl(new SafeMap(ObjectEntries(baggage))),
    );
  }

  fields(): string[] {
    return [BAGGAGE_HEADER];
  }
}

let builtinTracerCache: Tracer;

export function builtinTracer(): Tracer {
  if (!builtinTracerCache) {
    builtinTracerCache = new Tracer(OtelTracer.builtin());
  }
  return builtinTracerCache;
}

// We specify a very high version number, to allow any `@opentelemetry/api`
// version to load this module. This does cause @opentelemetry/api to not be
// able to register anything itself with the global registration methods.
const OTEL_API_COMPAT_VERSION = "1.999.999";

export function bootstrap(
  config: [
    0 | 1,
    0 | 1,
    (typeof otelConsoleConfig)[keyof typeof otelConsoleConfig],
    0 | 1,
    ...Array<(typeof otelPropagators)[keyof typeof otelPropagators]>,
  ],
): void {
  const {
    0: tracingEnabled,
    1: metricsEnabled,
    2: consoleConfig,
    ...propagators
  } = config;

  TRACING_ENABLED = tracingEnabled === 1;
  METRICS_ENABLED = metricsEnabled === 1;

  PROPAGATORS = ArrayPrototypeMap(
    ArrayPrototypeFilter(
      ObjectValues(propagators),
      (propagator) => propagator !== otelPropagators.none,
    ),
    (propagator) => {
      switch (propagator) {
        case otelPropagators.traceContext:
          return new W3CTraceContextPropagator();
        case otelPropagators.baggage:
          return new W3CBaggagePropagator();
      }
    },
  );

  switch (consoleConfig) {
    case otelConsoleConfig.capture:
      core.wrapConsole(globalThis.console, new Console(otelLog));
      break;
    case otelConsoleConfig.replace:
      ObjectDefineProperty(
        globalThis,
        "console",
        core.propNonEnumerable(new Console(otelLog)),
      );
      break;
    default:
      break;
  }

  if (TRACING_ENABLED || METRICS_ENABLED) {
    const otel = globalThis[SymbolFor("opentelemetry.js.api.1")] ??= {
      version: OTEL_API_COMPAT_VERSION,
    };
    if (TRACING_ENABLED) {
      otel.trace = TracerProvider;
      otel.context = ContextManager;
    }
    if (METRICS_ENABLED) {
      otel.metrics = MeterProvider;
    }
  }
}

export const telemetry = {
  tracerProvider: TracerProvider,
  contextManager: ContextManager,
  meterProvider: MeterProvider,
};
