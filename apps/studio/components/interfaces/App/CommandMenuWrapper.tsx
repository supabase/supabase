import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { codeBlock } from 'common-tags'
import { PropsWithChildren, useMemo } from 'react'
import toast from 'react-hot-toast'
import { CommandMenuProvider } from 'ui-patterns/Cmdk'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectApiQuery } from 'data/config/project-api-query'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { OPT_IN_TAGS } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { createSqlSnippetSkeleton } from '../SQLEditor/SQLEditor.utils'

const CommandMenuWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const { project: selectedProject } = useProjectContext()
  const opt_in_tags = selectedOrganization?.opt_in_tags

  const snap = useSqlEditorStateSnapshot()
  const isOptedInToAI = opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const { profile } = useProfile()
  const { data: settings } = useProjectApiQuery({ projectRef: ref })
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const apiKeys = {
    anon: settings?.autoApiService?.defaultApiKey ?? undefined,
    service: settings?.autoApiService?.serviceApiKey ?? undefined,
  }
  const apiUrl = `${settings?.autoApiService.protocol}://${settings?.autoApiService.endpoint}`

  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: isOptedInToAI }
  )

  const cmdkMetadata = useMemo(() => {
    return {
      definitions: (data ?? []).map((def) => def.sql.trim()).join('\n\n'),
      flags: {},
    }
  }, [data])

  const onSaveGeneratedSQL = async (answer: string, title: string) => {
    if (!ref) return console.error('Project ref is required')
    if (!canCreateSQLSnippet) {
      toast('Unable to save query as you do not have sufficient permissions for this project')
      return
    }

    // Remove markdown syntax from returned answer
    answer = answer.replace(/`/g, '').replace(/sql\n/g, '').trim()

    const formattedSql = codeBlock`
      -- Note: This query was generated via Supabase AI, please verify the correctness of the
      -- SQL snippet before running it against your database as we are not able to guarantee it
      -- will do exactly what you requested the AI.

      ${answer}
    `

    try {
      const snippet = createSqlSnippetSkeleton({
        id: uuidv4(),
        name: title || 'Generated query',
        owner_id: profile?.id,
        project_id: selectedProject?.id,
        sql: formattedSql,
      })

      snap.addSnippet(snippet as SqlSnippet, ref)
      toast.success(`Successfully saved snippet!`)
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  return (
    <CommandMenuProvider
      site="studio"
      projectRef={ref}
      apiKeys={apiKeys}
      apiUrl={apiUrl}
      metadata={cmdkMetadata}
      isOptedInToAI={isOptedInToAI}
      saveGeneratedSQL={onSaveGeneratedSQL}
    >
      {children}
    </CommandMenuProvider>
  )
}

export default CommandMenuWrapper
