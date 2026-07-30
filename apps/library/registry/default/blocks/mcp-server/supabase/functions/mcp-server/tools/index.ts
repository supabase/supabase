import { echoToolset } from './echo.ts'
import { registerToolset } from './registry.ts'
import { whoamiToolset } from './whoami.ts'

export type { ToolContext } from './types.ts'

// The toolset manifest. Add each installed or custom toolset here so it is
// registered when the Edge Function starts.
//
// Called once at module scope, not per request.
export function registerToolsets(): void {
  registerToolset(echoToolset)
  registerToolset(whoamiToolset)
}
