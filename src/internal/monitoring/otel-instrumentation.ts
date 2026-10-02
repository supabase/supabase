import {
  Attributes,
  Context,
  MeterProvider,
  Span,
  SpanStatusCode,
  TracerProvider,
  trace,
} from '@opentelemetry/api'
import { Instrumentation, InstrumentationConfig } from '@opentelemetry/instrumentation'
import { ReadableSpan, Span as SdkSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base'

type InstrumentedMethod = ((...args: unknown[]) => unknown) & {
  __original?: (...args: unknown[]) => unknown
}

type InstrumentedPrototype = Record<string, unknown>

// Accepts both abstract and concrete classes; `never[]` makes any constructor
// signature assignable while still requiring a `new`-able function (which carries
// `name` and `prototype`).
type InstrumentedClass = abstract new (...args: never[]) => unknown

export class TenantSpanProcessor implements SpanProcessor {
  private readonly attributesToPropagate: string[]

  constructor(attributesToPropagate: string[] = ['tenant.ref', 'region']) {
    this.attributesToPropagate = attributesToPropagate
  }

  onStart(span: SdkSpan, parentContext: Context): void {
    const parentSpan = trace.getSpan(parentContext)
    if (!parentSpan) return

    // Cast to ReadableSpan to access attributes
    const parentReadable = parentSpan as unknown as ReadableSpan
    const parentAttributes = parentReadable.attributes

    if (!parentAttributes) return

    // Copy specified attributes from parent to child span
    for (const attr of this.attributesToPropagate) {
      const value = parentAttributes[attr]
      if (value !== undefined) {
        span.setAttribute(attr, value)
      }
    }
  }

  onEnd(_span: ReadableSpan): void {
    // No-op
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }
}

interface GenericInstrumentationConfig extends InstrumentationConfig {
  targetClass: InstrumentedClass
  methodsToInstrument: string[]
  setName?: (name: string, attrs: Attributes, targetClass: object) => string
  setAttributes?: Partial<Record<string, (...args: unknown[]) => Attributes>>
}

class ClassInstrumentation implements Instrumentation {
  readonly instrumentationName: string
  readonly instrumentationVersion = '1.0.0'

  private _config: GenericInstrumentationConfig
  private _tracerProvider?: TracerProvider
  private _meterProvider?: MeterProvider

  constructor(config: GenericInstrumentationConfig) {
    this._config = config
    this.instrumentationName = config.targetClass.name.toLowerCase()

    if (config.enabled) {
      this.enable()
    }
  }

  setTracerProvider(tracerProvider: TracerProvider): void {
    this._tracerProvider = tracerProvider
  }

  setMeterProvider(meterProvider: MeterProvider): void {
    this._meterProvider = meterProvider
  }

  getConfig(): GenericInstrumentationConfig {
    return this._config
  }

  setConfig(config: Partial<GenericInstrumentationConfig>): void {
    this._config = { ...this._config, ...config }
  }

  enable(): void {
    this.patchMethods()
  }

  disable(): void {
    this.unpatchMethods()
  }

  private patchMethods(): void {
    const { targetClass, methodsToInstrument } = this._config
    const proto = targetClass.prototype as InstrumentedPrototype

    methodsToInstrument.forEach((methodName) => {
      if (methodName in proto && typeof proto[methodName] === 'function') {
        this.patchMethod(proto, methodName)
      }
    })
  }

  private unpatchMethods(): void {
    const { targetClass, methodsToInstrument } = this._config
    const proto = targetClass.prototype as InstrumentedPrototype

    methodsToInstrument.forEach((methodName) => {
      const method = proto[methodName]
      if (methodName in proto && isInstrumentedMethod(method) && method.__original) {
        proto[methodName] = method.__original
      }
    })
  }

  private patchMethod(proto: InstrumentedPrototype, methodName: string): void {
    const original = proto[methodName]
    if (!isInstrumentedMethod(original)) {
      return
    }

    const instrumentationName = this.instrumentationName
    const instrumentation = this

    const wrappedMethod: InstrumentedMethod = function (this: object, ...args: unknown[]) {
      const tracer = trace.getTracer(instrumentationName)

      return tracer.startActiveSpan(
        `${instrumentationName}.${methodName}`,
        {
          attributes: {
            storageInternal: true,
          },
        },
        async (span: Span) => {
          try {
            const customAttrs =
              instrumentation._config.setAttributes?.[methodName]?.apply(this, args) || {}
            span.setAttributes(customAttrs)

            const spanName = instrumentation._config.setName?.(
              `${instrumentationName}.${methodName}`,
              customAttrs,
              this
            )

            if (spanName) {
              span.updateName(spanName)
            }
            const result = await original.apply(this, args)
            span.setStatus({ code: SpanStatusCode.OK })
            return result
          } catch (error) {
            if (error instanceof Error) {
              // Avoid JSON.stringify of full error/stack - just capture message
              // Stack traces can be 50KB+ and cause significant GC pressure
              span.setAttributes({
                'error.message': error.message,
                'error.name': error.name,
              })
            }

            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error instanceof Error ? error.message : String(error),
            })
            throw error
          } finally {
            span.end()
          }
        }
      )
    }

    wrappedMethod.__original = original
    proto[methodName] = wrappedMethod
  }
}

function isInstrumentedMethod(value: unknown): value is InstrumentedMethod {
  return typeof value === 'function'
}

export { ClassInstrumentation, GenericInstrumentationConfig }
