import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'

import { useParams, useTelemetryProps } from 'common'
import { stripIndent } from 'common-tags'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { useSqlGenerateMutation } from 'data/ai/sql-generate-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { motion } from 'framer-motion'
import { useCheckPermissions, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import Telemetry from 'lib/telemetry'
import { useRouter } from 'next/router'
import { format } from 'sql-formatter'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIcon, IconCornerDownLeft, Input } from 'ui'
import { createSqlSnippetSkeleton } from '../SQLEditor.utils'
import SQLCard from './SQLCard'

const sqlDisclaimerComment = stripIndent`
  -- Supabase AI is experimental and may produce incorrect answers
  -- Always verify the output before executing
`

const SQLTemplates = observer(() => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const [sql, quickStart] = partition(SQL_TEMPLATES, { type: 'template' })
  const { mutateAsync: generateSql, isLoading: isSqlGenerateLoading } = useSqlGenerateMutation()

  const telemetryProps = useTelemetryProps()
  const snap = useSqlEditorStateSnapshot()
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  // [Joshen TODO] Removed optimistic query creation logic for now, need to figure out
  // how to do that after using ids as part of the URL
  const handleNewQuery = async (sql: string, name: string) => {
    if (!ref) return console.error('Project ref is required')
    if (!canCreateSQLSnippet) {
      return ui.setNotification({
        category: 'info',
        message: 'Your queries will not be saved as you do not have sufficient permissions',
      })
    }

    try {
      const snippet = createSqlSnippetSkeleton({ name, sql, owner_id: profile?.id })
      const data = { ...snippet, id: uuidv4() }
      snap.addSnippet(data as SqlSnippet, ref, true)
      router.push(`/project/${ref}/sql/${data.id}`)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    }
  }

  return (
    <div className="block h-full space-y-8 overflow-y-auto p-6">
      <div className="mt-32 mb-32 flex flex-col items-center">
        <motion.h1
          className="text-scale-1200 mb-8 text-3xl"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          What do you want to build?
        </motion.h1>
        <div className="w-full flex justify-center">
          {!isSqlGenerateLoading ? (
            <motion.div
              key="ask-ai-input"
              layoutId="ask-ai-input"
              className="w-full max-w-2xl border border-brand-900"
              initial={{
                y: -50,
                opacity: 0,
                borderRadius: 6,
              }}
              animate={{
                y: 0,
                opacity: 1,
                borderRadius: 6,
              }}
            >
              <Input
                size="xlarge"
                inputRef={(inputElement: HTMLInputElement) => inputElement?.focus()}
                icon={
                  <motion.div
                    key="ask-ai-input-icon"
                    layoutId="ask-ai-input-icon"
                    className="ml-1"
                    initial={{
                      rotate: 0,
                    }}
                    animate={{
                      rotate: 0,
                    }}
                  >
                    <AiIcon className="w-4 h-4" />
                  </motion.div>
                }
                inputClassName="w-full border-none py-4 focus:!ring-0"
                iconContainerClassName="transition text-scale-800 text-brand-900"
                placeholder="Ask Supabase AI to build a query"
                className="w-full"
                onKeyPress={async (e) => {
                  if (e.key === 'Enter') {
                    try {
                      const value = e.currentTarget.value

                      if (!value) {
                        return
                      }

                      const { title, sql } = await generateSql({ prompt: e.currentTarget.value })

                      const formattedSql =
                        sqlDisclaimerComment +
                        '\n\n' +
                        format(sql, {
                          language: 'postgresql',
                          keywordCase: 'lower',
                        })

                      await handleNewQuery(formattedSql, title)
                    } catch (error: unknown) {
                      if (
                        error &&
                        typeof error === 'object' &&
                        'message' in error &&
                        typeof error.message === 'string'
                      ) {
                        ui.setNotification({
                          category: 'error',
                          message: error.message,
                        })
                      }
                    }
                  }
                }}
                actions={
                  <div className="flex items-center space-x-1 mr-6">
                    <IconCornerDownLeft size={16} strokeWidth={1.5} />
                  </div>
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="ask-ai-loading"
              layoutId="ask-ai-input"
              className="p-5 border border-brand-900 text-brand-900"
              initial={{
                borderRadius: 50,
              }}
              animate={{
                borderRadius: 50,
              }}
              transition={{
                type: 'spring',
                mass: 0.1,
                stiffness: 200,
                damping: 30,
              }}
            >
              <motion.div
                key="ask-ai-loading-icon"
                layoutId="ask-ai-input-icon"
                animate={{
                  rotate: 360,
                  transition: {
                    delay: 0.2,
                    ease: 'linear',
                    duration: 2,
                    repeat: Infinity,
                  },
                }}
              >
                <AiIcon className="w-4 h-4" />
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
      <div>
        <div className="mb-4">
          <h1 className="text-scale-1200 mb-3 text-xl">Scripts</h1>
          <p className="text-scale-1100 text-sm">Quick scripts to run on your database.</p>
          <p className="text-scale-1100 text-sm">
            Click on any script to fill the query box, modify the script, then click
            <span className="text-code">Run</span>.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sql.map((x) => (
            <SQLCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery(sql, title)
                Telemetry.sendEvent(
                  {
                    category: 'scripts',
                    action: 'script_clicked',
                    label: x.title,
                  },
                  telemetryProps,
                  router
                )
              }}
            />
          ))}
        </div>
      </div>
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-scale-1200 mb-3 text-xl">Quick start</h1>
          <p className="text-scale-1100 text-sm">
            While we're in beta, we want to offer a quick way to explore Supabase. While we build
            importers, check out these simple starters.
          </p>
          <p className="text-scale-1100 text-sm">
            Click on any script to fill the query box, modify the script, then click
            <span className="text-code">Run</span>.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {quickStart.map((x) => (
            <SQLCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery(sql, title)
                Telemetry.sendEvent(
                  {
                    category: 'quickstart',
                    action: 'quickstart_clicked',
                    label: x.title,
                  },
                  telemetryProps,
                  router
                )
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

export default SQLTemplates
