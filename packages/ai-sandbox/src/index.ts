import 'core-js/actual/symbol/async-dispose'
import 'core-js/actual/symbol/dispose'

import {
  JSPromiseState,
  QuickJSAsyncContext,
  QuickJSHandle,
  RELEASE_ASYNC,
  newQuickJSAsyncWASMModuleFromVariant,
} from 'quickjs-emscripten'

export type SuccessResult = {
  exports: Record<string, any>
  error: undefined
}

export type FailureResult = {
  exports: undefined
  error: Error
}

export type ExecutionResult = SuccessResult | FailureResult

export type ExecuteOptions = {
  modules?: Record<string, string>
  urlModuleWhitelist?: string[]
  expose?: Record<string, (...args: any) => any>
}

/**
 * Executes JavaScript source code in a secure sandbox via an
 * embedded runtime (powered by QuickJS running in WebAssembly).
 *
 * The VM's runtime is completely isolated from the host's by default.
 * The only interface between the VM and the host are the ones you create
 * through modules and functions.
 *
 * The `source` is expected to be an ES module (with imports and exports).
 * Async modules are supported.
 *
 * All exports will be returned after execution via the `exports` property.
 * Any error that is thrown will be returned via the `error` property.
 */
export async function executeJS(
  source: string,
  options: ExecuteOptions = {}
): Promise<ExecutionResult> {
  const { modules = {}, urlModuleWhitelist = [], expose = {} } = options

  const quickjs = await newQuickJSAsyncWASMModuleFromVariant(RELEASE_ASYNC)
  using runtime = quickjs.newRuntime()

  runtime.setMemoryLimit(1024 * 640)
  runtime.setMaxStackSize(1024 * 320)
  runtime.setInterruptHandler(shouldInterruptAfter(1000))
  runtime.setModuleLoader(
    async (moduleName) => {
      const url = getUrl(moduleName)

      if (url) {
        const isInWhitelist = urlModuleWhitelist.some((url) => moduleName.startsWith(url))
        if (!isInWhitelist) {
          throw new Error(`URL module '${moduleName}' not in whitelist`)
        }

        const response = await fetch(url, {
          headers: {
            'user-agent': 'es2020',
          },
        })

        const source = await response.text()

        return source
      }

      return modules[moduleName]
    },
    async (baseName: string, name: string) => {
      try {
        const url = new URL(name, baseName)
        return url.toString()
      } catch (err) {
        return name
      }
    }
  )

  using context = runtime.newContext()

  for (const functionName in expose) {
    bindFunction(context, functionName, expose[functionName])
  }

  using setTimeoutHandle = context.newFunction('setTimeout', (fnHandle, timeoutHandle) => {
    // Make a copy because otherwise fnHandle does not live long enough to call after the timeout
    const fnHandleCopy = fnHandle.dup()
    const timeout = context.dump(timeoutHandle)

    // Node.js implementations of `setTimeout` return a `Timer` instead of a `number`
    // Wrapping the result in `Number()` implicitly calls `[Symbol.toPrimitive]()` on the `Timer`
    const timeoutId = Number(
      setTimeout(() => {
        // callFunction() will call the function handle within the VM
        // we pass context.undefined because we need to pass something for the "this" argument
        context.callFunction(fnHandleCopy, context.undefined)
        fnHandleCopy.dispose()
      }, timeout)
    )

    return context.newNumber(timeoutId)
  })

  context.setProp(context.global, 'setTimeout', setTimeoutHandle)

  const result = await context.evalCodeAsync(source, 'index.js', { type: 'module' })

  // This could be a syntax error, interrupt, or synchronous error thrown
  if (result.error) {
    using errorHandle = result.error
    const error = context.dump(errorHandle)

    return {
      exports: undefined,
      error: deserializeError(error),
    }
  }

  using valueHandle = result.value
  let promiseState: JSPromiseState

  // Continuously execute pending jobs until the module has resolved (if async)
  do {
    // If we're proxying async functions through the host runtime (eg. fetch),
    // we need to defer execution until those functions have completed.
    // Choosing `setTimeout` over `queueMicrotask` since it runs after I/O.
    await new Promise((r) => setTimeout(r, 0))

    runtime.executePendingJobs()
    promiseState = context.getPromiseState(valueHandle)
  } while (promiseState.type === 'pending')

  // Promise state will be 'fulfilled' even for non-promises, so
  // this covers both sync and async modules
  if (promiseState.type === 'fulfilled') {
    const promiseValueHandle = promiseState.value
    const moduleExports = context.dump(promiseValueHandle)

    // These handles are equal when the module is sync, so only
    // dispose when it's async (or else it will get disposed twice)
    if (promiseValueHandle !== valueHandle) {
      promiseValueHandle.dispose()
    }

    return {
      exports: moduleExports,
      error: undefined,
    }
  } else if (promiseState.type === 'rejected') {
    using promiseErrorHandle = promiseState.error
    const error = context.dump(promiseErrorHandle)

    return {
      exports: undefined,
      error: deserializeError(error),
    }
  } else {
    throw new Error('Something went wrong, please report this error')
  }
}

export type SerializableValue =
  | Promise<SerializableValue>
  | { [key: string]: SerializableValue }
  | SerializableValue[]
  | string
  | number
  | boolean
  | undefined
  | null

function bindFunction<Args extends any[], ReturnValue extends any>(
  context: QuickJSAsyncContext,
  name: string,
  fn: (...args: Args) => ReturnValue
) {
  using functionHandle = context.newFunction(name, (...argHandles) => {
    const args = argHandles.map((handle) => retrieveVariable(context, handle)) as Args

    const result: any = fn(...args)

    if (result instanceof Promise) {
      const promise = context.newPromise()

      result
        .then((result) => {
          using varHandle = createVariable(context, result)
          promise.resolve(varHandle)
        })
        .catch((err) => {
          using errorHandle = context.newError(err)
          promise.reject(errorHandle)
        })

      return promise.handle
    }

    return createVariable(context, result)
  })

  context.setProp(context.global, name, functionHandle)
}

function createVariable(context: QuickJSAsyncContext, value: SerializableValue): QuickJSHandle {
  if (typeof value === 'function') {
    throw new Error(`Value '${value}' cannot be serialized for the VM`)
  }

  if (typeof value === 'string') {
    return context.newString(value)
  }

  if (typeof value === 'number') {
    return context.newNumber(value)
  }

  if (typeof value === 'boolean') {
    return value ? context.true : context.false
  }

  if (value === undefined) {
    return context.undefined
  }

  if (value === null) {
    return context.null
  }

  if (Array.isArray(value)) {
    const arrayHandle = context.newArray()
    value.forEach((v, i) => {
      createVariable(context, v).consume((handle) => context.setProp(arrayHandle, i, handle))
    })
    return arrayHandle
  }

  if (typeof value === 'object') {
    const obj = context.newObject()
    Object.entries(value).forEach(([key, v]) => {
      createVariable(context, v).consume((handle) => context.setProp(obj, key, handle))
    })
    return obj
  }

  throw new Error(`Value '${value}' cannot be serialized for the VM`)
}

function retrieveVariable(context: QuickJSAsyncContext, value: QuickJSHandle): SerializableValue {
  context.runtime.assertOwned(value)

  const type = context.typeof(value)

  if (type === 'function') {
    const dumpedValue = context.dump(value)
    throw new Error(`Function '${dumpedValue}' cannot be serialized from the VM`)
  }

  // `value` can be a regular value or a promise
  // Despite its name, `getPromiseState` covers both sync and async values
  // Sync values will always be fulfilled
  const promiseState = context.getPromiseState(value)

  if (promiseState.type === 'pending') {
    const promise = context.resolvePromise(value)

    return promise.then((result) => {
      if (result.error) {
        using errorHandle = result.error
        throw retrieveVariable(context, errorHandle)
      }

      using valueHandle = result.value
      return retrieveVariable(context, valueHandle)
    })
  } else if (promiseState.type === 'fulfilled') {
    using promiseValue = promiseState.value
    const dumpedValue = context.dump(promiseValue)
    return promiseState.notAPromise ? dumpedValue : Promise.resolve(dumpedValue)
  } else if (promiseState.type === 'rejected') {
    using promiseError = promiseState.error
    const dumpedError = context.dump(promiseError)
    return Promise.reject(dumpedError)
  }
}

function shouldInterruptAfter(timeout: number) {
  let initialTime: number | undefined

  return () => {
    // Execution starts the first time this callback is called
    if (!initialTime) {
      initialTime = Date.now()
    }
    return Date.now() > initialTime + timeout
  }
}

function getUrl(url: string) {
  try {
    return new URL(url)
  } catch (err) {
    return undefined
  }
}

/**
 * Deserializes an error from the VM.
 */
function deserializeError(error: unknown): Error {
  if (
    error !== undefined &&
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    'message' in error &&
    typeof error.name === 'string' &&
    typeof error.message === 'string'
  ) {
    const newError = new Error(error.message)
    Object.assign(newError, error)

    if ('stack' in error && typeof error.stack === 'string') {
      newError.stack = `${error.name}: ${error.message}\n${error.stack}`
    }

    return newError
  } else if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error(JSON.stringify(error))
}
