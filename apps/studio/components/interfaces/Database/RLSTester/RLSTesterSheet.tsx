import {
  acceptUntrustedSql,
  safeSql,
  type SafeSqlFragment,
  type UntrustedSqlFragment,
} from '@supabase/pg-meta'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@ui/components/shadcn/ui/select'
import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { Code, ExternalLink } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { InferredSQLViewer } from './InferredSQLViewer'
import { type ParseQueryResults } from './RLSTester.types'
import { RLSTesterEmptyState } from './RLSTesterEmptyState'
import { RLSTesterResults } from './RLSTesterResults'
import { RoleSelector } from './RoleSelector'
import { SandboxManagement } from './SandboxManagement'
import { UserSelector } from './UserSelector'
import { UserSqlEditor } from './UserSqlEditor'
import { useTestQueryRLS, type TestQueryBlockedReason } from './useTestQueryRLS'
import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { PostgresSandboxProvider, usePostgresSandbox } from '@/state/postgres-sandbox/sandbox'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface RLSTesterSheetProps {
  handleSelectEditPolicy: (policy: Policy) => void
}

export const RLSTesterSheet = (props: RLSTesterSheetProps) => {
  return (
    <PostgresSandboxProvider>
      <RLSTesterSheetContents {...props} />
    </PostgresSandboxProvider>
  )
}

const RLSTesterSheetContents = ({ handleSelectEditPolicy }: RLSTesterSheetProps) => {
  const track = useTrack()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { setRole } = useRoleImpersonationStateSnapshot()
  const { startSandbox, status, isSyncing } = usePostgresSandbox()

  const sandboxEnabled = useFlag('rlsTesterSandbox')
  const sandboxIsStarting = status === 'loading'

  const [open, setOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'anon' | 'authenticated'>('anon')
  const [blockedReason, setBlockedReason] = useState<TestQueryBlockedReason>()

  const [format, setFormat] = useState<'sql' | 'lib'>('sql')
  const [inferredSQL, setInferredSQL] = useState<UntrustedSqlFragment>()

  const [value, setValue] = useState<SafeSqlFragment>(safeSql``)
  const [results, setResults] = useState<Object[] | null>(null)
  const [autoLimit, setAutoLimit] = useState(false)
  const [parseQueryResults, setParseQueryResults] = useState<ParseQueryResults>()

  const {
    testQuery,
    inferSQLFromLib,
    isLoading,
    isInferring,
    executeSqlError,
    parseQueryError,
    parseClientCodeError,
  } = useTestQueryRLS()
  const isErrorDueToRLS =
    executeSqlError?.message.includes('violates row-level security policy') ?? false
  const mutationOperation = blockedReason?.type === 'mutation' ? blockedReason.operation : undefined

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleValueChange = (sql: SafeSqlFragment) => {
    setValue(sql)
    if (format !== 'lib') return

    if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    if (!sql) return

    debounceRef.current = setTimeout(() => inferSQLFromLib(sql, setInferredSQL), 1500)
  }

  const executionCallbacks = {
    option: selectedOption,
    acknowledgeMutation: blockedReason?.type === 'mutation',
    onExecuteSQL: ({ result, isAutoLimit }: { result: Object[] | null; isAutoLimit: boolean }) => {
      setResults(result)
      setAutoLimit(isAutoLimit)
    },
    onParseQuery: setParseQueryResults,
    onValidationBlocked: setBlockedReason,
  }

  const onRunQuery = async () => {
    setBlockedReason(undefined)

    if (format === 'lib') {
      if (!inferredSQL) return
      const blocked = await testQuery({
        value: acceptUntrustedSql(inferredSQL),
        ...executionCallbacks,
      })
      if (!blocked) track('rls_tester_run_query_clicked', { type: 'inferred' })
    } else {
      const blocked = await testQuery({ value, ...executionCallbacks })
      if (!blocked) track('rls_tester_run_query_clicked', { type: 'raw' })
    }
  }

  const assistantSql = format === 'lib' && inferredSQL ? acceptUntrustedSql(inferredSQL) : value

  const getDebugPrompt = ({ includeSql = false }: { includeSql?: boolean } = {}) => {
    const prompt = `Help me fix my RLS policy based on the attached SQL snippet that gave the following error: \n\n${executeSqlError?.message}\n\nEvaluate if the problem might be query first, before checking my RLS policies.`

    return includeSql ? `${prompt}\n\nSQL Query:\n\`\`\`sql\n${assistantSql}\n\`\`\`` : prompt
  }

  const onDebugWithAssistant = () => {
    const prompt = getDebugPrompt()
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({
      name: 'Debug RLS policies',
      sqlSnippets: [assistantSql],
      initialInput: prompt,
    })
    setOpen(false)
  }

  useEffect(() => {
    setRole({ type: 'postgrest', role: 'anon' })
    return () => {
      // Flip back to service role
      setRole(undefined)
    }
    // [Joshen] Intentional - to only reset back to service role when navigating away
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="default" icon={<Code />}>
            Test
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[600px]! flex flex-col gap-y-0">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-x-4">
              <span>What data can my users access?</span>
              <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_TESTER} />
            </SheetTitle>
            <SheetDescription>
              See what data a user is allowed to read or modify based on your RLS policies
            </SheetDescription>
          </SheetHeader>

          <div className="grow overflow-y-auto flex flex-col">
            {sandboxEnabled && <SandboxManagement />}

            <SheetSection className="px-0 py-0 border-t">
              <div className="flex flex-col p-5 pt-4 gap-y-4">
                <RoleSelector onSelectRole={setSelectedOption} />
                {selectedOption === 'authenticated' && <UserSelector />}
              </div>

              <DialogSectionSeparator />

              <div className="flex items-center justify-between px-5 py-2">
                <p className="text-sm">Query</p>
                <div className="flex items-center gap-x-2">
                  <Select
                    value={format}
                    onValueChange={(x) => {
                      const newFormat = x as 'sql' | 'lib'
                      setFormat(newFormat)
                      if (newFormat !== 'lib') {
                        setInferredSQL(undefined)
                        if (debounceRef.current !== null) clearTimeout(debounceRef.current)
                      }
                    }}
                  >
                    <SelectTrigger size="tiny">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Query format</SelectLabel>
                        <SelectItem value="sql">SQL</SelectItem>
                        <SelectItem value="lib">Client library</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-40 relative">
                <UserSqlEditor
                  id="rls-tester"
                  value={value}
                  placeholder={
                    format === 'sql'
                      ? safeSql`select * from table;`
                      : safeSql`SQL will be inferred from client library code`
                  }
                  onChange={handleValueChange}
                  actions={{
                    runQuery: {
                      enabled: open,
                      callback: () => {
                        if (!isInferring && !isLoading) onRunQuery()
                      },
                    },
                  }}
                />
              </div>
            </SheetSection>

            {format === 'lib' && (
              <div>
                <DialogSectionSeparator />
                <InferredSQLViewer sql={inferredSQL} isLoading={isInferring} />
              </div>
            )}

            <DialogSectionSeparator />

            {blockedReason?.type === 'multiple-statements' ? (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title="Only a single SQL statement is supported"
                  description="Remove any additional statements and run the query again."
                />
              </div>
            ) : blockedReason?.type === 'unsupported-operation' ? (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title={`${blockedReason.operation} queries are not supported by the RLS Tester yet`}
                  description="Support for testing UPDATE and DELETE statements will be available soon."
                />
              </div>
            ) : parseQueryError ? (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title="Error parsing query"
                  description={parseQueryError.message}
                />
              </div>
            ) : parseClientCodeError ? (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title="Error parsing client code"
                  description={parseClientCodeError.message}
                />
              </div>
            ) : executeSqlError && !isErrorDueToRLS ? (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title="Error running SQL query"
                  description={executeSqlError.message}
                  actions={[
                    <AiAssistantDropdown
                      key="ai-assistant"
                      label="Ask Assistant"
                      telemetrySource="rls_tester"
                      buildPrompt={() => getDebugPrompt({ includeSql: true })}
                      onOpenAssistant={onDebugWithAssistant}
                    />,
                  ]}
                />
              </div>
            ) : isLoading ? (
              <div className="p-4">
                <GenericSkeletonLoader />
              </div>
            ) : results === null && !isErrorDueToRLS ? (
              <RLSTesterEmptyState />
            ) : !!parseQueryResults ? (
              <RLSTesterResults
                results={results ?? []}
                parseQueryResults={parseQueryResults}
                autoLimit={autoLimit}
                executeSqlError={executeSqlError}
                handleSelectEditPolicy={handleSelectEditPolicy}
              />
            ) : null}
          </div>

          <SheetFooter className="sm:justify-between">
            <Button asChild variant="default" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/orgs/supabase/discussions/45233"
              >
                Give feedback
              </a>
            </Button>
            <div className="flex items-center gap-x-2">
              <Button variant="default" disabled={isLoading} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isInferring || isLoading}
                disabled={(format === 'lib' && !inferredSQL) || sandboxIsStarting || isSyncing}
                onClick={onRunQuery}
              >
                Run query
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        visible={!!mutationOperation}
        variant="warning"
        size="medium"
        loading={isLoading}
        title="Confirm to run this query"
        confirmLabel="Run query"
        onConfirm={onRunQuery}
        onCancel={() => setBlockedReason(undefined)}
        alert={{
          title: `This ${mutationOperation} query will run against your actual database`,
          description: 'Your database may be directly modified as a result. Are you sure?',
        }}
      >
        {sandboxEnabled && (
          <>
            <p className="text-sm">
              We highly recommend using the sandbox to set up an ephemeral database environment for
              testing insert, update, or delete queries.
            </p>
            <Button
              variant="default"
              className="mt-2"
              onClick={() => {
                startSandbox()
                setBlockedReason(undefined)
              }}
            >
              Set up sandbox
            </Button>
          </>
        )}
      </ConfirmationModal>
    </>
  )
}
