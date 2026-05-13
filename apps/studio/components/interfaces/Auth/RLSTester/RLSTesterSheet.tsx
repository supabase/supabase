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
import { LOCAL_STORAGE_KEYS } from 'common'
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
import { Admonition } from 'ui-patterns'

import { InferredSQLViewer } from './InferredSQLViewer'
import { type ParseQueryResults } from './RLSTester.types'
import { RLSTesterEmptyState } from './RLSTesterEmptyState'
import { RLSTesterResults } from './RLSTesterResults'
import { RoleSelector } from './RoleSelector'
import { UserSelector } from './UserSelector'
import { UserSqlEditor } from './UserSqlEditor'
import { useTestQueryRLS } from './useTestQueryRLS'
import type { Policy } from '@/components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface RLSTesterSheetProps {
  handleSelectEditPolicy: (policy: Policy) => void
}

export const RLSTesterSheet = ({ handleSelectEditPolicy }: RLSTesterSheetProps) => {
  const track = useTrack()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { setRole } = useRoleImpersonationStateSnapshot()

  const [open, setOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'anon' | 'authenticated'>('anon')

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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleValueChange = (sql: SafeSqlFragment) => {
    setValue(sql)
    if (format !== 'lib') return

    if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    if (!sql) return

    debounceRef.current = setTimeout(() => {
      inferSQLFromLib(sql, setInferredSQL)
    }, 1500)
  }

  const executionCallbacks = {
    option: selectedOption,
    onExecuteSQL: ({ result, isAutoLimit }: { result: Object[] | null; isAutoLimit: boolean }) => {
      setResults(result)
      setAutoLimit(isAutoLimit)
    },
    onParseQuery: setParseQueryResults,
  }

  const onRunQuery = async () => {
    if (format === 'lib') {
      if (!inferredSQL) return
      await testQuery({ value: acceptUntrustedSql(inferredSQL), ...executionCallbacks })
      track('rls_tester_run_query_clicked', { type: 'inferred' })
    } else {
      await testQuery({ value, ...executionCallbacks })
      track('rls_tester_run_query_clicked', { type: 'raw' })
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
    // Flip back to service role
    return () => {
      setRole(undefined)
    }
  }, [setRole])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="default" icon={<Code />}>
          Test
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[600px]! flex flex-col gap-y-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-x-4">
            <span>What data can my users see?</span>
            <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_TESTER} />
          </SheetTitle>
          <SheetDescription>
            See what data a user is allowed to read based on your RLS policies
          </SheetDescription>
        </SheetHeader>

        <div className="grow overflow-y-auto flex flex-col">
          <SheetSection className="px-0 py-0">
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

          {parseQueryError ? (
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
          ) : (
            executeSqlError && (
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
            )
          )}

          {results === null ? (
            !parseQueryError && !parseClientCodeError && !executeSqlError && <RLSTesterEmptyState />
          ) : !!parseQueryResults ? (
            <RLSTesterResults
              results={results}
              parseQueryResults={parseQueryResults}
              autoLimit={autoLimit}
              handleSelectEditPolicy={handleSelectEditPolicy}
            />
          ) : null}
        </div>

        <SheetFooter className="sm:justify-between">
          <Button asChild type="default" icon={<ExternalLink />}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/orgs/supabase/discussions/45233"
            >
              Give feedback
            </a>
          </Button>
          <div className="flex items-center gap-x-2">
            <Button type="default" disabled={isLoading} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isInferring || isLoading}
              disabled={format === 'lib' && !inferredSQL}
              onClick={onRunQuery}
            >
              Run query
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
