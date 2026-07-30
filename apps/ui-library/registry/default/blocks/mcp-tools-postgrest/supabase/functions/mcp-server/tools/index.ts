import { echoToolset } from './echo.ts'
import { postgrestToolset } from './postgrest/index.ts'
import { registerToolset } from './registry.ts'
import { whoamiToolset } from './whoami.ts'

export type { ToolContext } from './types.ts'

// The toolset manifest, replaced by this block to add the PostgREST toolset.
//
// shadcn copies whole files, so a block that adds tools ships its own version of
// this file: the framework's toolsets plus its own. If you install another
// toolset block later, or write your own, add its registerToolset call here.
//
// Called once at module scope, not per request.
export function registerToolsets(): void {
  registerToolset(echoToolset)
  registerToolset(whoamiToolset)
  registerToolset(postgrestToolset)
}
