import type { MCPServerDefinition } from './types.ts'
import { supabaseMcpServer } from './supabase.ts'

export const mcpServerRegistry: MCPServerDefinition[] = [supabaseMcpServer]
