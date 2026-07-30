import { echoToolset } from './echo.ts'
import { registerToolset } from './registry.ts'
import { whoamiToolset } from './whoami.ts'

export type { ToolContext } from './types.ts'

// The toolset manifest — the one file toolset blocks replace.
//
// shadcn copies whole files, so a block that adds tools ships its own version of
// this file listing the framework's toolsets plus its own. Everything else in
// this directory (registry.ts, types.ts, result.ts) and the framework files
// (index.ts, auth.ts, deno.json) stay untouched.
//
// Called once at module scope, not per request.
export function registerToolsets(): void {
  registerToolset(echoToolset)
  registerToolset(whoamiToolset)
}
