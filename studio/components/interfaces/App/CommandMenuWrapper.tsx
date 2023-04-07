import remarkGfm from 'remark-gfm'
import ReactMarkdown from 'react-markdown'
import { PropsWithChildren } from 'react'
import { CommandMenuProvider } from 'ui'
import { checkPermissions, useOptimisticSqlSnippetCreate, useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProfileQuery } from 'data/profile/profile-query'
import { uuidv4 } from 'lib/helpers'
import { createSqlSnippetSkeleton } from 'components/to-be-cleaned/SqlEditor/SqlEditor.utils'
import { useProjectApiQuery } from 'data/config/project-api-query'

const CommandMenuWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { content, ui } = useStore()

  const { opt_in_tags } = ui.selectedOrganization ?? {}

  const isOptedInToAI = opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN') ?? false

  const { data: profile } = useProfileQuery()
  const { data: settings } = useProjectApiQuery({ projectRef: ref })
  // const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
  //   resource: { type: 'sql', owner_id: profile?.id },
  //   subject: { id: profile?.id },
  // })

  const apiKeys = {
    anon: settings?.autoApiService?.defaultApiKey ?? undefined,
    service: settings?.autoApiService?.serviceApiKey ?? undefined,
  }

  const onSaveGeneratedSQL = async (answer: string, resolve: any) => {
    // remove backticks from returned answer
    answer = answer.replace(/`/g, '')

    const formattedOutput = `
-- Note: This query was generated via Supabase AI, please do verify the correctness of the
-- SQL snippet before running it against your database as we are not able to guarantee the
-- correctness of the snippet that was generated.

${answer}
`.trim()

    console.log('onSaveGeneratedSQL', { formattedOutput })
    const snippet = createSqlSnippetSkeleton({
      owner_id: profile?.id,
      name: 'Generated query',
      sql: formattedOutput,
    })
    const payload = { id: uuidv4(), ...snippet }
    await content.create(payload)
    resolve()
  }

  return (
    <CommandMenuProvider
      site="studio"
      projectRef={ref}
      apiKeys={apiKeys}
      MarkdownHandler={(props) => <ReactMarkdown remarkPlugins={[remarkGfm]} {...props} />}
      onSaveGeneratedSQL={onSaveGeneratedSQL}
      isOptedInToAI={isOptedInToAI}
    >
      {children}
    </CommandMenuProvider>
  )
}

export default CommandMenuWrapper
