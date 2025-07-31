import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import { TreeView } from 'ui'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuSeparator,
} from 'ui-patterns'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { SQLEditorTreeViewItem } from './SQLEditorNavV2/SQLEditorTreeViewItem'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { partition } from 'lodash'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { uuidv4 } from 'lib/helpers'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'

const COMMUNITY_OPTIONS = [
  { id: 'templates', name: 'Templates' },
  { id: 'quickstarts', name: 'Quickstarts' },
]

export function SqlEditorMenuStaticLinks() {
  const { ref } = useParams()
  const router = useRouter()
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([])

  const [communitySectionOpen, setCommunitySectionOpen] = useLocalStorage<boolean>(
    `sql-editor-community-section-state-${ref ?? ''}`,
    true
  )

  const [templates, quickstarts] = partition(SQL_TEMPLATES, { type: 'template' })

  const { data: org } = useSelectedOrganizationQuery()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const { mutate: sendEvent } = useSendEventMutation()

  const handleNewQuery = async (sql: string, name: string, type: 'template' | 'quickstart') => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
    }

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name,
        sql,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snapV2.addSnippet({ projectRef: ref, snippet })
      snapV2.addNeedsSaving(snippet.id)

      router.push(`/project/${ref}/sql/${snippet.id}`)

      // Send telemetry event
      if (type === 'template') {
        sendEvent({
          action: 'sql_editor_template_clicked',
          properties: { templateName: name },
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
      } else {
        sendEvent({
          action: 'sql_editor_quickstart_clicked',
          properties: { quickstartName: name },
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
      }
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  const communityTreeState = [
    {
      id: 0,
      name: '',
      parent: null,
      children: COMMUNITY_OPTIONS.map((option) => option.id),
    },
    ...COMMUNITY_OPTIONS.map((option) => ({
      id: option.id,
      name: option.name,
      parent: 0,
      children:
        option.id === 'templates'
          ? templates.map((template, index) => `template-${template.id}`)
          : quickstarts.map((quickstart, index) => `quickstart-${quickstart.id}`),
      isBranch: true,
      metadata: {
        id: option.id,
        name: option.name,
        type: 'folder' as const,
      },
    })),
    // Add template items
    ...templates.map((template) => ({
      id: `template-${template.id}`,
      name: template.title,
      parent: 'templates',
      children: [],
      isBranch: false,
      metadata: {
        id: `template-${template.id}`,
        name: template.title,
        type: 'item' as const,
        sql: template.sql,
        description: template.description,
        templateType: 'template' as const,
      },
    })),
    // Add quickstart items
    ...quickstarts.map((quickstart) => ({
      id: `quickstart-${quickstart.id}`,
      name: quickstart.title,
      parent: 'quickstarts',
      children: [],
      isBranch: false,
      metadata: {
        id: `quickstart-${quickstart.id}`,
        name: quickstart.title,
        type: 'item' as const,
        sql: quickstart.sql,
        description: quickstart.description,
        templateType: 'quickstart' as const,
      },
    })),
  ]

  const communityLastItemIds = new Set([
    ...COMMUNITY_OPTIONS.map((option) => option.id),
    ...templates.map((template) => `template-${template.id}`),
    ...quickstarts.map((quickstart) => `quickstart-${quickstart.id}`),
  ])

  function isPageActive(key: string | number): boolean {
    return router.asPath === `/project/${ref}/sql/${key}`
  }

  const handleFolderExpand = (props: { element: any; isExpanded: boolean }) => {
    const folderId = props.element.id.toString()
    if (props.isExpanded && !expandedFolderIds.includes(folderId)) {
      setExpandedFolderIds([...expandedFolderIds, folderId])
    }
    if (!props.isExpanded && expandedFolderIds.includes(folderId)) {
      setExpandedFolderIds(expandedFolderIds.filter((x) => x !== folderId))
    }
  }

  return (
    <>
      <InnerSideMenuCollapsible
        className="px-0"
        open={communitySectionOpen}
        onOpenChange={(value) => {
          setCommunitySectionOpen(value)
        }}
      >
        <InnerSideMenuCollapsibleTrigger title="Community" />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          <TreeView
            data={communityTreeState}
            aria-label="community-sections"
            expandedIds={expandedFolderIds}
            onExpand={handleFolderExpand}
            nodeRenderer={({ element, getNodeProps, ...props }) => {
              const isActive = isPageActive(String(element.id))
              const isOpened = false // Community items don't have tabs
              const { className, onClick } = getNodeProps()

              return (
                <SQLEditorTreeViewItem
                  {...props}
                  element={element}
                  isSelected={isActive}
                  isOpened={isOpened}
                  isPreview={false}
                  isLastItem={communityLastItemIds.has(String(element.id))}
                  getNodeProps={() => ({ className, onClick })}
                  onClick={(e) => {
                    if (!props.isBranch) {
                      const templateType = element.metadata?.templateType
                      const sql = element.metadata?.sql
                      const name = element.metadata?.name

                      if (templateType && sql && name) {
                        handleNewQuery(
                          String(sql),
                          String(name),
                          templateType as 'template' | 'quickstart'
                        )
                      }
                    } else {
                      onClick?.(e)
                    }
                  }}
                />
              )
            }}
          />
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />
    </>
  )
}
