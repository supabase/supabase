import { Editor } from '@monaco-editor/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { ImpersonationRole, PostgrestRole, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import {
  Button,
  Card,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'

const DEFAULT_SQL = `-- Show tables in public schema
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
ORDER BY table_schema, table_name;

-- Show RLS policies on the messages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- Show records in the messages table (this should succeed with service_role)
SELECT * FROM messages LIMIT 10;

-- Show the current role
SELECT current_user, current_setting('role');
`

const DiagnosticsPanel = () => {
  const project = useSelectedProject()
  const [sql, setSql] = useState(DEFAULT_SQL)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [roleImpersonationDebug, setRoleImpersonationDebug] = useState<any>(null)
  const [wrappedSql, setWrappedSql] = useState<string>('')
  const roleState = useRoleImpersonationStateSnapshot()

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      setResult(data.result)
      setError(null)
    },
    onError(error) {
      setError(error.message)
      toast.error(`Failed to execute SQL: ${error.message}`)
    },
  })

  const handleExecuteSql = () => {
    if (!project?.ref) {
      toast.error('No project selected')
      return
    }

    try {
      const wrapped = wrapWithRoleImpersonation(sql, {
        projectRef: project.ref,
        role: roleState.role,
      })
      setWrappedSql(wrapped)

      // Create debug info to show what we're sending
      const debug = {
        role: roleState.role,
        projectRef: project.ref,
        wrappedSqlPreview: wrapped.slice(0, 500) + (wrapped.length > 500 ? '...' : ''),
      }
      setRoleImpersonationDebug(debug)

      executeSql({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: wrapped,
        isRoleImpersonationEnabled: Boolean(roleState.role),
      })
    } catch (error: any) {
      setError(`Role impersonation error: ${error.message}`)
      toast.error(`Role impersonation error: ${error.message}`)
    }
  }

  // Regular execution without role impersonation
  const handleExecuteRawSql = () => {
    if (!project?.ref) {
      toast.error('No project selected')
      return
    }

    executeSql({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-foreground">RLS Diagnostics</h2>
        <div className="flex gap-2">
          <Button type="default" onClick={handleExecuteRawSql} disabled={isExecuting}>
            Run as Service Role
          </Button>
          <Button onClick={handleExecuteSql} disabled={isExecuting}>
            {isExecuting ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
            Run with Role Impersonation
          </Button>
        </div>
      </div>

      <Card className="border rounded-md overflow-hidden">
        <div className="h-[300px] border-b">
          <Editor
            language="sql"
            value={sql}
            onChange={(value) => setSql(value || '')}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
            }}
          />
        </div>
      </Card>

      <Tabs_Shadcn_ defaultValue="results">
        <TabsList_Shadcn_>
          <TabsTrigger_Shadcn_ value="results">Results</TabsTrigger_Shadcn_>
          <TabsTrigger_Shadcn_ value="debug">Role Impersonation Debug</TabsTrigger_Shadcn_>
          <TabsTrigger_Shadcn_ value="wrapped">Wrapped SQL</TabsTrigger_Shadcn_>
        </TabsList_Shadcn_>

        <TabsContent_Shadcn_ value="results">
          {error && (
            <Card className="border bg-destructive-100 p-4">
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <pre className="text-sm overflow-auto">{error}</pre>
            </Card>
          )}

          {result && (
            <Card className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Results</h3>
              <pre className="text-sm overflow-auto max-h-[500px]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          )}
        </TabsContent_Shadcn_>

        <TabsContent_Shadcn_ value="debug">
          {roleImpersonationDebug && (
            <Card className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Role Impersonation Debug Info</h3>
              <pre className="text-sm overflow-auto max-h-[500px]">
                {JSON.stringify(roleImpersonationDebug, null, 2)}
              </pre>
            </Card>
          )}
        </TabsContent_Shadcn_>

        <TabsContent_Shadcn_ value="wrapped">
          {wrappedSql && (
            <Card className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Wrapped SQL</h3>
              <pre className="text-sm overflow-auto max-h-[500px]">{wrappedSql}</pre>
            </Card>
          )}
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </div>
  )
}

export default DiagnosticsPanel
