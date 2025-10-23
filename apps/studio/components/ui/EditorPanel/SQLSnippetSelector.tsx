import { Check, ChevronDown, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import { getContentById } from 'data/content/content-id-query'
import { Snippet, useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { editorPanelState } from 'state/editor-panel-state'
import { SIDEBAR_KEYS, sidebarManagerState } from 'state/sidebar-manager-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'

interface SQLSnippetSelectorProps {
  disabled?: boolean
  currentSnippetName?: string
  currentSnippetId?: string
}

export const SQLSnippetSelector = ({
  disabled = false,
  currentSnippetName = 'SQL Editor',
  currentSnippetId,
}: SQLSnippetSelectorProps) => {
  const { ref: projectRef } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [open, setOpen] = useState(false)

  // Fetch private snippets
  const { data: privateSnippetsPages } = useSQLSnippetFoldersQuery(
    { projectRef, sort: 'inserted_at' },
    { keepPreviousData: true }
  )

  // Fetch favorite snippets
  const { data: favoriteSqlSnippetsData } = useSqlSnippetsQuery(
    {
      projectRef,
      favorite: true,
      sort: 'inserted_at',
    },
    { enabled: true, keepPreviousData: true }
  )

  // Fetch shared snippets
  const { data: sharedSqlSnippetsData } = useSqlSnippetsQuery(
    {
      projectRef,
      visibility: 'project',
      sort: 'inserted_at',
    },
    { enabled: true, keepPreviousData: true }
  )

  const privateSnippets = useMemo(
    () =>
      (privateSnippetsPages?.pages.flatMap((page) => page.contents ?? []) ?? [])
        .filter((snippet) => snippet.visibility === 'user')
        .sort((a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()),
    [privateSnippetsPages?.pages]
  )

  const favoriteSnippets = useMemo(
    () =>
      (favoriteSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? []).sort(
        (a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
      ),
    [favoriteSqlSnippetsData?.pages]
  )

  const sharedSnippets = useMemo(
    () =>
      (sharedSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? []).sort(
        (a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
      ),
    [sharedSqlSnippetsData?.pages]
  )

  const handleSelectSnippet = async (snippetId: string) => {
    // Try to find snippet from our query results
    let snippet =
      privateSnippets.find((s) => s.id === snippetId) ||
      favoriteSnippets.find((s) => s.id === snippetId) ||
      sharedSnippets.find((s) => s.id === snippetId) ||
      snapV2.snippets[snippetId]?.snippet

    if (!snippet) {
      console.error('Snippet not found:', snippetId)
      return
    }

    // Check if content is loaded in valtio state
    const stateSnippet = snapV2.snippets[snippetId]?.snippet
    let sql = ''

    if (stateSnippet && stateSnippet.content?.sql !== undefined) {
      // Use content from valtio state if available
      sql = stateSnippet.content.sql
    } else if (snippet.content?.sql !== undefined) {
      // Use content from query result if available
      sql = snippet.content.sql
    } else if (projectRef) {
      // Fetch the full snippet content
      try {
        const data = await getContentById({ projectRef, id: snippetId })
        const fullSnippet = data.content
        if (fullSnippet && fullSnippet.sql) {
          sql = fullSnippet.sql
          // Add to valtio state for future use
          snapV2.setSnippet(projectRef, { ...snippet, content: fullSnippet })
        }
      } catch (error) {
        console.error('Failed to fetch snippet content:', error)
      }
    }

    editorPanelState.configure({
      sql,
      selectedSnippetId: snippetId,
    })
    sidebarManagerState.openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    setOpen(false)
  }

  const handleNewQuery = () => {
    editorPanelState.configure({
      sql: '',
      selectedSnippetId: undefined,
    })
    sidebarManagerState.openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    setOpen(false)
  }

  const renderSnippetItem = (snippet: Snippet) => (
    <CommandItem_Shadcn_
      key={snippet.id}
      value={snippet.id}
      onSelect={() => handleSelectSnippet(snippet.id)}
      className="flex items-center justify-between gap-2 py-1 w-full overflow-hidden"
      keywords={[snippet.name]}
      disabled={disabled}
    >
      <div className="flex items-center w-full flex-1 min-w-0">
        <Check
          className={cn(
            'mr-2 h-4 w-4 flex-shrink-0',
            currentSnippetId === snippet.id ? 'opacity-100' : 'opacity-0'
          )}
        />
        <span className="truncate flex-1 min-w-0 overflow-hidden">{snippet.name}</span>
      </div>
    </CommandItem_Shadcn_>
  )

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="text"
          size="tiny"
          iconRight={<ChevronDown size={14} />}
          className="max-w-64 truncate"
          disabled={disabled}
        >
          {currentSnippetName}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[300px] p-0" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search snippets..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No snippets found.</CommandEmpty_Shadcn_>

            {favoriteSnippets.length > 0 && (
              <>
                <CommandGroup_Shadcn_ heading="Favorites">
                  <ScrollArea className={favoriteSnippets.length > 4 ? 'h-40' : ''}>
                    {favoriteSnippets.map(renderSnippetItem)}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
                <CommandSeparator_Shadcn_ />
              </>
            )}

            {sharedSnippets.length > 0 && (
              <>
                <CommandGroup_Shadcn_ heading="Shared">
                  <ScrollArea className={sharedSnippets.length > 4 ? 'h-40' : ''}>
                    {sharedSnippets.map(renderSnippetItem)}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
                <CommandSeparator_Shadcn_ />
              </>
            )}

            {privateSnippets.length > 0 && (
              <>
                <CommandGroup_Shadcn_ heading="Private">
                  <ScrollArea className={privateSnippets.length > 4 ? 'h-40' : ''}>
                    {privateSnippets.map(renderSnippetItem)}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
                <CommandSeparator_Shadcn_ />
              </>
            )}

            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                className="cursor-pointer w-full gap-x-2"
                onSelect={handleNewQuery}
                onClick={handleNewQuery}
                disabled={disabled}
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>New query</span>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
