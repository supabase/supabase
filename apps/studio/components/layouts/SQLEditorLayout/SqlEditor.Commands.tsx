import { useCommandState } from 'cmdk'
import { ArrowRight, Code } from 'lucide-react'
import { useRouter } from 'next/router'

import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { SqlSnippet, useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Breadcrumb,
  CommandHeader,
  CommandInput,
  CommandWrapper,
  generateCommandClassNames,
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuSize,
  useSetPage,
} from 'ui-patterns/CommandMenu'
import { CodeBlock, CommandGroup_Shadcn_, CommandItem_Shadcn_, CommandList_Shadcn_ } from 'ui'

export function useSqlEditorGotoCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-sql-editor',
        name: 'Go to SQL Editor',
        route: `/project/${ref}/sql`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}

const SNIPPET_PAGE_NAME = 'Snippets'

export function useSnippetCommands() {
  const setPage = useSetPage()

  useRegisterPage(SNIPPET_PAGE_NAME, {
    type: PageType.Component,
    component: () => <RunSnippetPage />,
  })

  useRegisterCommands(
    'Project tools',
    [
      {
        id: 'run-snippet',
        name: 'Run snippet',
        icon: () => <Code />,
        action: () => setPage(SNIPPET_PAGE_NAME),
      },
    ],
    {
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}

function RunSnippetPage() {
  const project = useSelectedProject()
  const { data: snippets } = useSqlSnippetsQuery(project?.ref)

  useSetCommandMenuSize('xlarge')

  return (
    <CommandWrapper>
      <CommandHeader>
        <Breadcrumb />
        <CommandInput autoFocus />
      </CommandHeader>
      {(!snippets || snippets.snippets.length === 0) && <EmptyState projectRef={project?.ref} />}
      {!!snippets && snippets.snippets.length > 0 && (
        <SnippetSelector projectRef={project?.ref} snippets={snippets.snippets} />
      )}
    </CommandWrapper>
  )
}

function EmptyState({ projectRef }: { projectRef: string | undefined }) {
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
            Create new snippet
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </div>
  )
}

function SnippetSelector({
  projectRef,
  snippets,
}: {
  projectRef: string | undefined
  snippets: Array<SqlSnippet> | undefined
}) {
  const router = useRouter()

  const selectedValue = useCommandState((state) => state.value)
  const selectedSnippet = snippets?.find((snippet) => snippetValue(snippet) === selectedValue)

  return (
    <div className="w-full h-full grid gap-4 md:grid-cols-2">
      <CommandList_Shadcn_ className="py-2">
        {!!snippets && snippets.length > 0 && (
          <>
            <CommandGroup_Shadcn_>
              {snippets.map((snippet) => (
                <CommandItem_Shadcn_
                  id={`${snippet.id}-${snippet.name}`}
                  className={generateCommandClassNames(false)}
                  value={snippetValue(snippet)}
                  onSelect={() =>
                    void router.push(`/project/${projectRef ?? '_'}/sql/${snippet.id}`)
                  }
                >
                  {snippet.name}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
            <hr className="my-4 mx-2" />
          </>
        )}
        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_
            id="create-snippet"
            className={generateCommandClassNames(false)}
            onSelect={() => router.push(`/project/${projectRef ?? '_'}/sql/new`)}
          >
            Create new snippet
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
      <CodeBlock
        language="sql"
        value={selectedSnippet?.content?.sql ?? ''}
        className="w-full h-full rounded-none [&>code]:overflow-scroll [&>code]:block [&>code]:w-full [&>code]:h-full"
        hideCopy
      />
    </div>
  )
}

function snippetValue(snippet: SqlSnippet) {
  // Lower case is needed because cmdk converts values to lower case
  return `${snippet.id}-${snippet.name}`.toLowerCase()
}
