import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FilePlus, FolderPlus, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import {
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
  InnerSideBarFilters,
  InnerSideMenuItem,
} from 'ui-patterns/InnerSideMenu'
import { SQLEditorNav as SQLEditorNavV2 } from './SQLEditorNavV2/SQLEditorNav'

interface SQLEditorMenuProps {
  onViewOngoingQueries: () => void
}

export const SQLEditorMenu = ({ onViewOngoingQueries }: SQLEditorMenuProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref } = useParams()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const [searchText, setSearchText] = useState('')

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const createNewFolder = () => {
    // [Joshen] LEFT OFF: We need to figure out a good UX for creating folders
    // - Modal? Directly chuck into the tree view like storage explorer?
    if (!ref) return console.error('Project ref is required')
    snapV2.addNewFolder({ projectRef: ref })
    // createFolder({ projectRef: ref, name: 'test' })
  }

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')
    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
    }

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name: untitledSnippetTitle,
        owner_id: profile.id,
        project_id: project.id,
        sql: '',
      })
      snapV2.addSnippet({ projectRef: ref, snippet })
      router.push(`/project/${ref}/sql/${snippet.id}`)
      setSearchText('')
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="mt-4 mb-2 flex flex-col gap-y-4">
        <div className="mx-4 flex items-center justify-between gap-x-2">
          <InnerSideBarFilters className="w-full p-0 gap-0">
            <InnerSideBarFilterSearchInput
              name="search-queries"
              placeholder="Search queries..."
              aria-labelledby="Search queries"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            >
              <InnerSideBarFilterSortDropdown
                value={snapV2.order}
                onValueChange={(value: any) => snapV2.setOrder(value)}
              >
                <InnerSideBarFilterSortDropdownItem key="name" value="name">
                  Alphabetical
                </InnerSideBarFilterSortDropdownItem>
                <InnerSideBarFilterSortDropdownItem key="inserted_at" value="inserted_at">
                  Created At
                </InnerSideBarFilterSortDropdownItem>
              </InnerSideBarFilterSortDropdown>
            </InnerSideBarFilterSearchInput>
          </InnerSideBarFilters>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                icon={<Plus className="text-foreground" />}
                className="w-[26px]"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-48">
              <DropdownMenuItem className="gap-x-2" onClick={() => handleNewQuery()}>
                <FilePlus size={14} />
                Create a new snippet
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-x-2" onClick={() => createNewFolder()}>
                <FolderPlus size={14} />
                Create a new folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-2">
          <InnerSideMenuItem
            title="Templates"
            isActive={router.asPath === `/project/${ref}/sql/templates`}
            href={`/project/${ref}/sql/templates`}
          >
            Templates
          </InnerSideMenuItem>
          <InnerSideMenuItem
            title="Quickstarts"
            isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
            href={`/project/${ref}/sql/quickstarts`}
          >
            Quickstarts
          </InnerSideMenuItem>
        </div>

        <SQLEditorNavV2 searchText={searchText} />
      </div>

      <div className="p-4 border-t sticky bottom-0 bg-studio">
        <Button block type="default" onClick={onViewOngoingQueries}>
          View running queries
        </Button>
      </div>
    </div>
  )
}
