import { describeEnvNames } from './src/env.ts'
import { handleRequest } from './src/http/app.ts'

// Names only, never values: shows which secrets the runtime actually applied.
console.log(`assistant api worker env names: ${describeEnvNames()}`)

let loggedFetchArgs = false

const apiWorker = {
  fetch(request: Request, ...rest: unknown[]): Promise<Response> {
    if (!loggedFetchArgs) {
      loggedFetchArgs = true
      const extra = rest.map((arg) =>
        arg && typeof arg === 'object' ? `{${Object.keys(arg).sort().join(', ')}}` : typeof arg
      )
      console.log(`assistant api worker fetch extra args: [${extra.join(' | ')}]`)
    }
    return handleRequest(request)
  },
}

export default apiWorker
