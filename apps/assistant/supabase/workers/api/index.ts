import { describeEnvNames } from './src/env.ts'
import { app } from './src/http/app.ts'

// Names only, never values: shows which secrets the runtime actually applied.
console.log(`assistant api worker env names: ${describeEnvNames()}`)

export default app
