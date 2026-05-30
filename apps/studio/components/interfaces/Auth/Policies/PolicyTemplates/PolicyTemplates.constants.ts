import type { SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'

export interface PolicyTemplate {
  id: string
  preview: boolean
  templateName: string
  description: string
  name: string
  statement: string
  definition: SafeSqlFragment
  check: SafeSqlFragment
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles: Array<string>
}
