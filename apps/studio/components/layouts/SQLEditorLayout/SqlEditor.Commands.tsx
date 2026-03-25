import { type PostgresColumn } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useSqlSnippetsQuery, type SqlSnippet } from 'data/content/sql-snippets-query'
import { usePrefetchTables, useTablesQuery, type TablesData } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { useProfile } from 'lib/profile'
import { AlertTriangle, Code, Loader2, Table2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'
import {
  cn,
  CodeBlock,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import {
  Breadcrumb,
  CommandHeader,
  CommandInput,
  CommandWrapper,
  escapeAttributeSelector,
  generateCommandClassNames,
  PageType,
  useCommandFilterState,
  useCommandMenuOpen,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuSize,
  useSetPage,
} from 'ui-patterns/CommandMenu'

export function useSqlEditorGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-sql-editor',
        name: 'SQL Editor',
        route: `/project/${ref}/sql`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}

const SNIPPET_PAGE_NAME = 'Snippets'

export function useSnippetCommands() {
  const { data: project } = useSelectedProjectQuery()
  const setPage = useSetPage()

  useRegisterPage(
    SNIPPET_PAGE_NAME,
    {
      type: PageType.Component,
      component: () => <RunSnippetPage />,
    },
    { enabled: !!project }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.SQL,
    [
      {
        id: 'run-snippet',
        name: 'Run snippet...',
        icon: () => <Code />,
        action: () => setPage(SNIPPET_PAGE_NAME),
      },
    ],
    {
      enabled: !!project,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}

function RunSnippetPage() {
  const { ref } = useParams()
  const {
    data: snippetPages,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useSqlSnippetsQuery({
    projectRef: ref,
  })

  const snippets = snippetPages?.pages.flatMap((page) => page.contents)

  const { profile } = useProfile()
  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  useSetCommandMenuSize('xlarge')

  return (
    <CommandWrapper>
      <CommandHeader>
        <Breadcrumb />
        <CommandInput autoFocus />
      </CommandHeader>
      {isLoading && <LoadingState />}
      {isError && <ErrorState />}
      {isSuccess && (!snippets || snippets.length === 0) && (
        <EmptyState projectRef={ref} canCreateNew={canCreateSQLSnippet} />
      )}
      {isSuccess && !!snippets && snippets.length > 0 && (
        <SnippetSelector projectRef={ref} canCreateNew={canCreateSQLSnippet} snippets={snippets} />
      )}
    </CommandWrapper>
  )
}

function LoadingState() {
  return (
    <div className="p-6">
      <p className="text-center">
        <Loader2 className="inline-block mr-2 animate-spin" />
        Loading...
      </p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="p-6">
      <p className="text-center">
        <AlertTriangle className="inline-block mr-2" />
        Couldn&apos;t load snippets
      </p>
    </div>
  )
}

function EmptyState({
  projectRef,
  canCreateNew,
}: {
  projectRef: string | undefined
  canCreateNew: boolean
}) {
  const router = useRouter()

  return (
    <div className="p-6">
      <p className="mb-2 text-center">No snippets found.</p>
      <CommandList_Shadcn_ className="py-2">
        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_
            id="create-snippet"
            className={generateCommandClassNames(false)}
            onSelect={() => router.push(`/project/${projectRef ?? '_'}/sql/new`)}
          >
            {canCreateNew ? 'Create new snippet' : 'Run new SQL'}
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </div>
  )
}

function SnippetSelector({
  projectRef,
  snippets,
  canCreateNew,
}: {
  projectRef: string | undefined
  snippets: Array<SqlSnippet> | undefined
  canCreateNew: boolean
}) {
  const router = useRouter()

  const selectedValue = useCommandFilterState((state) => state.value)
  const selectedSnippet = snippets?.find((snippet) => snippetValue(snippet) === selectedValue)
  const isSQLSnippet = selectedSnippet?.type === 'sql'

  return (
    <div className="w-full flex-grow min-h-0 grid gap-4 md:grid-cols-2">
      <CommandList_Shadcn_
        className={cn(
          '!h-full min-h-0 max-h-[unset] py-2 overflow-hidden',
          '[&>[cmdk-list-sizer]]:h-full [&>[cmdk-list-sizer]]:flex [&>[cmdk-list-sizer]]:flex-col'
        )}
      >
        {!!snippets && snippets.length > 0 && (
          <CommandGroup_Shadcn_ className="flex-grow min-h-0 overflow-auto">
            {snippets.map((snippet) => (
              <CommandItem_Shadcn_
                key={snippet.id}
                id={`${snippet.id}-${snippet.name}`}
                className={generateCommandClassNames(false)}
                value={snippetValue(snippet)}
                onSelect={() => void router.push(`/project/${projectRef ?? '_'}/sql/${snippet.id}`)}
              >
                {snippet.name}
              </CommandItem_Shadcn_>
            ))}
          </CommandGroup_Shadcn_>
        )}
        {canCreateNew && (
          <div className="min-h-fit flex-grow-0">
            <hr className="mt-4 mb-2 mx-2" />
            <CommandGroup_Shadcn_ forceMount={true}>
              <CommandItem_Shadcn_
                id="create-snippet"
                className={generateCommandClassNames(false)}
                onSelect={() => router.push(`/project/${projectRef ?? '_'}/sql/new`)}
                forceMount={true}
              >
                Create new snippet
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </div>
        )}
      </CommandList_Shadcn_>
      <CodeBlock
        language="sql"
        value={isSQLSnippet ? selectedSnippet?.content?.sql : ''}
        wrapperClassName="hidden md:block"
        className="w-full h-full border-0 [&>code]:overflow-scroll [&>code]:block [&>code]:w-full [&>code]:h-full"
        hideCopy
      />
    </div>
  )
}

function snippetValue(snippet: SqlSnippet) {
  if (snippet.type !== 'sql') return ''
  return escapeAttributeSelector(
    `${snippet.id}-${snippet.name}-${snippet?.content?.sql.slice(0, 30)}`
  ).toLowerCase()
}

const QUERY_TABLE_PAGE_NAME = 'Query a table'

export function useQueryTableCommands(options?: CommandOptions) {
  const { data: project } = useSelectedProjectQuery()
  const setPage = useSetPage()

  const commandMenuOpen = useCommandMenuOpen()
  const commandMenuPreviouslyOpen = useRef(commandMenuOpen)
  const commandMenuJustOpened = commandMenuOpen && !commandMenuPreviouslyOpen.current
  commandMenuPreviouslyOpen.current = commandMenuOpen

  const prefetchTables = usePrefetchTables({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  useEffect(() => {
    if (project && commandMenuJustOpened) {
      prefetchTables(undefined, true)
    }
  }, [project, prefetchTables, commandMenuJustOpened])

  useRegisterPage(
    QUERY_TABLE_PAGE_NAME,
    {
      type: PageType.Component,
      component: TableSelector,
    },
    { enabled: !!project }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.SQL,
    [
      {
        id: 'query-table',
        name: 'Query a table...',
        icon: () => <Table2 />,
        action: () => setPage(QUERY_TABLE_PAGE_NAME),
      },
    ],
    { ...options, enabled: (options?.enabled ?? true) && !!project }
  )
}

function TableSelector() {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: protectedSchemas } = useProtectedSchemas()
  const {
    data: tablesData,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    includeColumns: true,
  })
  const tables = useMemo(() => {
    return tablesData?.filter((table) => !protectedSchemas.find((s) => s.name === table.schema))
  }, [tablesData, protectedSchemas])

  return (
    <CommandWrapper>
      <CommandHeader>
        <Breadcrumb />
        <CommandInput autoFocus />
      </CommandHeader>
      <CommandList_Shadcn_>
        {isLoading && <LoadingState />}
        {isError && <ErrorState />}
        {isSuccess && (
          <>
            <CommandEmpty_Shadcn_ />
            <CommandGroup_Shadcn_>
              {tables?.map((table) => (
                <CommandItem_Shadcn_
                  key={table.id}
                  className={generateCommandClassNames(false)}
                  value={escapeAttributeSelector(`${table.schema}.${table.name}`)}
                  onSelect={() => {
                    router.push(
                      `/project/${project?.ref ?? '_'}/sql/new?content=${encodeURIComponent(generateSelectStatement(table))}`
                    )
                  }}
                >
                  {`${table.schema}.${table.name}`}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </>
        )}
      </CommandList_Shadcn_>
    </CommandWrapper>
  )
}

function generateSelectStatement(table: TablesData[number] & { columns?: Array<PostgresColumn> }) {
  return `
select ${
    !table.columns
      ? '*'
      : `
${table.columns.map((column, index, array) => `\t${column.name}`).join(',\n')}`
  }
from ${formatTableIdentifier(table)}
-- where
-- order by
-- limit
;
  `.trim()
}

// Not a perfectly spec-compliant regex , since Postgres also allows non-Latin
// letters and letters with diacritical marks, but quoting them defensively
// is easier than writing the regex. ¯\_(ツ)_/¯
const VALID_UNQUOTED_IDENTIFIER_REGEX = /^[a-z_][a-z0-9_$]*$/
function formatTableIdentifier(table: TablesData[number]) {
  const schema = VALID_UNQUOTED_IDENTIFIER_REGEX.test(table.schema)
    ? table.schema
    : `"${table.schema}"`
  const tableName = VALID_UNQUOTED_IDENTIFIER_REGEX.test(table.name)
    ? table.name
    : `"${table.name}"`
  return `${schema}.${tableName}`
}
