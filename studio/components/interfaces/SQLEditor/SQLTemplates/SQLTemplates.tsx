import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'

import * as Popover from '@radix-ui/react-popover'
import { useParams, useTelemetryProps } from 'common'
import {
  SQL_TEMPLATES,
  sqlAiDisclaimerComment,
} from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { useSqlGenerateMutation } from 'data/ai/sql-generate-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { isError } from 'data/utils/error-check'
import { motion } from 'framer-motion'
import {
  useCheckPermissions,
  useLocalStorageQuery,
  useSelectedOrganization,
  useSelectedProject,
  useStore,
} from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import Telemetry from 'lib/telemetry'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { format } from 'sql-formatter'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIcon, Button, IconCornerDownLeft, IconInfo, IconSettings, Input } from 'ui'
import AISettingsModal from '../AISettingsModal'
import { createSqlSnippetSkeleton } from '../SQLEditor.utils'
import SQLCard from './SQLCard'

const SQLTemplates = observer(() => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const [sql, quickStart] = partition(SQL_TEMPLATES, { type: 'template' })
  const { mutateAsync: generateSql, isLoading: isSqlGenerateLoading } = useSqlGenerateMutation()
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false)
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const isOptedInToAI =
    selectedOrganization?.opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN') ?? false
  const [isOptedInToAISchema] = useLocalStorageQuery('supabase_sql-editor-ai-schema', false)
  const [aiQueryCount, setAiQueryCount] = useLocalStorageQuery(
    'supabase_sql-editor-ai-query-count',
    0
  )
  const [isSchemaSuggestionDismissed, setIsSchemaSuggestionDismissed] = useLocalStorageQuery(
    'supabase_sql-editor-schema-suggestion-dismissed',
    false
  )
  const [isDelayComplete, setIsDelayComplete] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsDelayComplete(true)
    }, 500)

    return () => window.clearTimeout(timeout)
  })

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && isOptedInToAISchema

  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined

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
    <>
      <AISettingsModal visible={isAISettingsOpen} onCancel={() => setIsAISettingsOpen(false)} />
      <div className="block h-full space-y-8 overflow-y-auto p-6">
        <div className="mt-32 mb-32 flex flex-col items-center">
          <motion.h1
            className="text-scale-1200 mb-8 text-3xl"
            variants={{
              visible: {
                y: 0,
                opacity: 1,
              },
              hidden: {
                y: 10,
                opacity: 0,
              },
            }}
            initial="hidden"
            animate="visible"
          >
            What do you want to build?
          </motion.h1>
          <div className="w-full flex justify-center">
            {!isSqlGenerateLoading ? (
              <Popover.Root
                open={
                  isDelayComplete &&
                  !includeSchemaMetadata &&
                  aiQueryCount >= 3 &&
                  !isSchemaSuggestionDismissed
                }
              >
                <Popover.Anchor asChild>
                  <motion.div
                    key="ask-ai-input-container"
                    layoutId="ask-ai-input-container"
                    className="w-full max-w-2xl border border-brand-900"
                    variants={{
                      visible: {
                        y: 0,
                        opacity: 1,
                        borderRadius: 6,
                      },
                      hidden: {
                        y: -50,
                        opacity: 0,
                        borderRadius: 6,
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    <Input
                      size="xlarge"
                      inputRef={(inputElement: HTMLInputElement) => {
                        setTimeout(() => {
                          inputElement?.focus()
                        }, 200)
                      }}
                      icon={
                        <motion.div
                          key="ask-ai-input-icon"
                          layoutId="ask-ai-input-icon"
                          className="ml-1"
                          variants={{
                            visible: {
                              scale: 1,
                            },
                          }}
                          initial="visible"
                          animate="visible"
                        >
                          <AiIcon className="w-4 h-4" />
                        </motion.div>
                      }
                      inputClassName="w-full border-none py-4 focus:!ring-0 pr-20"
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

                            const { title, sql } = await generateSql({
                              prompt: e.currentTarget.value,
                              entityDefinitions,
                            })

                            setAiQueryCount((count) => count + 1)

                            const formattedSql =
                              sqlAiDisclaimerComment +
                              '\n\n' +
                              format(sql, {
                                language: 'postgresql',
                                keywordCase: 'lower',
                              })

                            await handleNewQuery(formattedSql, title)
                          } catch (error: unknown) {
                            if (isError(error)) {
                              ui.setNotification({
                                category: 'error',
                                message: error.message,
                              })
                            }
                          }
                        }
                      }}
                      actions={
                        <div className="flex items-center space-x-1 mr-4 gap-2">
                          <IconCornerDownLeft size={16} strokeWidth={1.5} />
                          <IconSettings
                            className="cursor-pointer"
                            onClick={() => {
                              setIsSchemaSuggestionDismissed(true)
                              setIsAISettingsOpen(true)
                            }}
                          />
                        </div>
                      }
                    />
                  </motion.div>
                </Popover.Anchor>

                <Popover.Portal>
                  <Popover.Content side="bottom" sideOffset={5}>
                    <motion.div
                      variants={{
                        visible: {
                          opacity: 1,
                          y: 0,
                        },
                        hidden: {
                          opacity: 0,
                          y: -10,
                        },
                      }}
                      initial="hidden"
                      animate="visible"
                    >
                      <Popover.Arrow className="fill-scale-300 dark:fill-scale-500" />
                      <div className="flex flex-col gap-2 border border-scale-300 dark:border-scale-500 rounded-md p-4 bg-scale-300 shadow-xl">
                        <div className="flex flex-row items-center gap-4 max-w-md">
                          <IconInfo className="w-6 h-6" />
                          <p className="text-sm">
                            Generate more relevant snippets by including database metadata in your
                            requests.
                          </p>
                        </div>
                        <div className="flex flex-row gap-2 justify-end">
                          <Button
                            type="default"
                            onClick={() => {
                              setIsSchemaSuggestionDismissed(true)
                            }}
                          >
                            Dismiss
                          </Button>
                          <Button
                            onClick={() => {
                              setIsSchemaSuggestionDismissed(true)
                              setIsAISettingsOpen(true)
                            }}
                          >
                            Open settings
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            ) : (
              <motion.div
                key="ask-ai-loading"
                layoutId="ask-ai-input-container"
                className="p-5 border border-brand-900 text-brand-900"
                variants={{
                  visible: {
                    borderRadius: 50,
                  },
                }}
                transition={{
                  type: 'spring',
                  mass: 0.1,
                  stiffness: 200,
                  damping: 30,
                }}
                initial="visible"
                animate="visible"
              >
                <motion.div
                  key="ask-ai-loading-icon"
                  layoutId="ask-ai-input-icon"
                  animate={{
                    scale: [0.9, 1.1, 0.9],
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
    </>
  )
})

export default SQLTemplates
