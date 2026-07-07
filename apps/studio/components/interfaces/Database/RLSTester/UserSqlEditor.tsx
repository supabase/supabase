import { rawSql, type SafeSqlFragment } from '@supabase/pg-meta'
import type { ComponentProps } from 'react'

import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

interface UserSqlEditorProps {
  id: string
  value: SafeSqlFragment
  placeholder?: SafeSqlFragment
  actions?: ComponentProps<typeof CodeEditor>['actions']
  onChange: (sql: SafeSqlFragment) => void
}

/**
 * Wraps CodeEditor for user-authored SQL. The rawSql boundary lives here — any
 * text the user types is immediately promoted to SafeSqlFragment so callers
 * never handle plain strings.
 */
export const UserSqlEditor = ({ value, onChange, ...props }: UserSqlEditorProps) => {
  return (
    <CodeEditor
      language="pgsql"
      value={value}
      onInputChange={(val) => onChange(rawSql(val ?? ''))}
      {...props}
    />
  )
}
