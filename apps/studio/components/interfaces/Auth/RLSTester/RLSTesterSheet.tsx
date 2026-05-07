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
import { Box, Code, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Badge,
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
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { PostgresSandboxProvider, usePostgresSandbox } from '@/state/postgres-sandbox/sandbox'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'

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
  const { status, startSandbox } = usePostgresSandbox()
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
    } else {
      await testQuery({ value, ...executionCallbacks })
    }
  }

  useEffect(() => {
    setRole({ type: 'postgrest', role: 'anon' })
    // Flip back to service role
    return () => {
      setRole(undefined)
    }
  }, [setRole])

  useEffect(() => {
    if (open && status === 'ready') {
      console.log('Sync pglite with primary DB')
    }
  }, [open, status])

  return (
    <PostgresSandboxProvider>
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
            {/* [Joshen] As clean up - this whole thing should be in its own component */}
            {status === 'idle' ? (
              <Admonition
                type="default"
                layout="horizontal"
                className="border-none"
                actions={[
                  <Button key="set-up" type="default" onClick={() => startSandbox()}>
                    Set up sandbox
                  </Button>,
                ]}
              >
                <div className="flex items-center gap-x-2">
                  <p className="!m-0">Set up sandbox for testing</p>
                  <Badge variant="success">Recommended</Badge>
                </div>
                <p className="text-foreground-light !m-0">
                  Ensure that queries do not affect your actual database
                </p>
              </Admonition>
            ) : status === 'loading' ? (
              <Admonition
                showIcon={false}
                type="default"
                className="border-none py-2 [&>div>div]:flex [&>div>div]:items-center [&>div>div]:justify-between"
              >
                <div className="flex items-center gap-x-3">
                  <div className="bg w-6 h-6 rounded border border-border flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <p className="text-xs !mb-0 font-mono uppercase tracking-tight">
                    Setting up sandbox
                  </p>
                </div>
              </Admonition>
            ) : status === 'ready' ? (
              <Admonition
                showIcon={false}
                type="default"
                className="border-none py-2 [&>div>div]:flex [&>div>div]:items-center [&>div>div]:justify-between"
              >
                <div className="flex items-center gap-x-3">
                  <div className="bg-brand-300 w-6 h-6 rounded border border-brand-500 flex items-center justify-center">
                    <Box size={14} className="text-brand" />
                  </div>
                  <p className="text-xs !mb-0 font-mono uppercase tracking-tight">Sandbox active</p>
                  <p className="text-xs text-foreground-lighter !mb-0">
                    Your database is never modified
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <ButtonTooltip
                    type="default"
                    icon={<RefreshCw />}
                    className="w-7"
                    tooltip={{ content: { side: 'bottom', text: 'Refresh schema' } }}
                  />
                </div>
              </Admonition>
            ) : (
              status === 'error' && (
                <Admonition type="warning" title="Oops" className="border-none" />
              )
            )}

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

            {parseQueryError && (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title="Error parsing query"
                  description={parseQueryError.message}
                />
              </div>
            )}

            {parseClientCodeError && (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title="Error parsing client code"
                  description={parseClientCodeError.message}
                />
              </div>
            )}

            {executeSqlError && (
              <div className="p-4">
                <Admonition
                  type="warning"
                  title="Error running SQL query"
                  description={executeSqlError.message}
                />
              </div>
            )}

            {results === null ? (
              <RLSTesterEmptyState />
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
            <Button asChild type="text">
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-light hover:text-foreground"
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
    </PostgresSandboxProvider>
  )
}
