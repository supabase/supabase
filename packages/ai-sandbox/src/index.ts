import 'core-js/actual/symbol/async-dispose'
import 'core-js/actual/symbol/dispose'

import { JSPromiseState, getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten'

export type SuccessResult = {
  exports: Record<string, any>
  error: undefined
}

export type FailureResult = {
  exports: undefined
  error: Error
}

export type ExecutionResult = SuccessResult | FailureResult

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
  modules: Record<string, string> = {}
): Promise<ExecutionResult> {
  const QuickJS = await getQuickJS()

  using runtime = QuickJS.newRuntime()

  runtime.setMemoryLimit(1024 * 640)
  runtime.setMaxStackSize(1024 * 320)
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 1000))
  runtime.setModuleLoader((moduleName) => modules[moduleName])

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

  const result = context.evalCode(source, 'index.js', { type: 'module' })

  // This is normally a syntax error, but can also be any top-level error thrown in the module
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
    'stack' in error &&
    typeof error.name === 'string' &&
    typeof error.message === 'string' &&
    typeof error.stack === 'string'
  ) {
    const newError = new Error(error.message)
    Object.assign(newError, error)
    newError.stack = `${error.message}\n${error.stack}`
    return newError
  } else if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error(JSON.stringify(error))
}
