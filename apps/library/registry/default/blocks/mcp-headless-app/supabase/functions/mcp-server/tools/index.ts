import { echoToolset } from './echo.ts'
import { postgrestToolset } from './postgrest/index.ts'
import { registerToolset } from './registry.ts'
import { whoamiToolset } from './whoami.ts'

export type { ToolContext } from './types.ts'

// The complete app includes the server's built-in tools and the PostgREST
// toolset installed by its registry dependency.
export function registerToolsets(): void {
  registerToolset(echoToolset)
  registerToolset(whoamiToolset)
  registerToolset(postgrestToolset)
}
