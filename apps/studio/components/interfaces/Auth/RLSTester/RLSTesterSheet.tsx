import { type PostgresPolicy } from '@supabase/postgres-meta'
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
import { Code } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { useTestQueryRLS } from './useTestQueryRLS'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'

interface RLSTesterSheetProps {
  handleSelectEditPolicy: (policy: PostgresPolicy) => void
}

export const RLSTesterSheet = ({ handleSelectEditPolicy }: RLSTesterSheetProps) => {
  const { setRole } = useRoleImpersonationStateSnapshot()

  const [open, setOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'anon' | 'authenticated'>('anon')

  const [format, setFormat] = useState<'sql' | 'lib'>('sql')
  const [inferredSQL, setInferredSQL] = useState<string>()

  const [value, setValue] = useState<string>('')
  const [results, setResults] = useState<Object[] | null>(null)
  const [autoLimit, setAutoLimit] = useState(false)
  const [parseQueryResults, setParseQueryResults] = useState<ParseQueryResults>()

  const { testQuery, isLoading, executeSqlError, parseQueryError, parseClientCodeError } =
    useTestQueryRLS()

  const onRunQuery = async () => {
    await testQuery({
      option: selectedOption,
      format,
      value,
      onInferSQL: setInferredSQL,
      onParseQuery: setParseQueryResults,
      onExecuteSQL: ({ result, isAutoLimit }) => {
        setResults(result)
        setAutoLimit(isAutoLimit)
      },
    })
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
                <Select value={format} onValueChange={(x) => setFormat(x as 'sql' | 'lib')}>
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
              <CodeEditor
                id="rls-tester"
                language="pgsql"
                value={value}
                placeholder={
                  format === 'sql'
                    ? 'select * from table;'
                    : 'SQL will be inferred from client library code'
                }
                onInputChange={(val) => setValue(val ?? '')}
                actions={{
                  runQuery: {
                    enabled: open,
                    callback: () => {
                      if (!isLoading) onRunQuery()
                    },
                  },
                }}
              />
            </div>
          </SheetSection>

          {format === 'lib' && !!inferredSQL && (
            <div>
              <DialogSectionSeparator />
              <InferredSQLViewer sql={inferredSQL} />
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
            <Button type="primary" loading={isLoading} onClick={onRunQuery}>
              Run query
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
