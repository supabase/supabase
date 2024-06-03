import 'core-js/actual/symbol/async-dispose'
import 'core-js/actual/symbol/dispose'

import { JSPromiseState, newAsyncRuntime } from 'quickjs-emscripten'

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
  const { modules = {}, urlModuleWhitelist = [] } = options

  using runtime = await newAsyncRuntime()

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
      newError.stack = `${error.message}\n${error.stack}`
    }

    return newError
  } else if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error(JSON.stringify(error))
}
