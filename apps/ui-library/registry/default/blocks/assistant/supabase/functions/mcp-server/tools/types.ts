import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { ZodTypeAny } from 'zod'

export interface ToolDefinition<Input = unknown> {
  name: string
  description: string
  inputSchema: ZodTypeAny
  authErrorMessage: string
  run: (supabase: SupabaseClient, input: Input) => Promise<any>
}
