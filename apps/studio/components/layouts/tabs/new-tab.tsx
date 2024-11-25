import { useParams } from 'common'
import { EntityTypeIcon } from 'components/explorer/entity-type-icon'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { usePostgresInUse } from 'data/database/postgres-in-use-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { AnimatePresence, LayoutGroup, motion, Variants } from 'framer-motion'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import { BaggageClaim, BarChart2, BookOpen, Box, Search, Table2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { RecentItem } from 'state/recent-items'
import { recentItemsStore } from 'state/recent-items'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { editorEntityTypes, removeNewTab } from 'state/tabs'
import {
  Badge,
  Button,
  Card,
  cn,
  Separator,
  Skeleton,
  SQL_ICON,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { AssistantChatForm } from 'ui-patterns/AssistantChat'
import { Input } from 'ui-patterns/DataInputs/Input'
import { v4 as uuidv4 } from 'uuid'
import { useSnapshot } from 'valtio'
import { useEditorType } from '../editors/editors-layout.hooks'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { ActionCard } from './actions-card'
import { partition } from 'lodash'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'

dayjs.extend(relativeTime)

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 15 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 50,
      staggerChildren: 0.08,
      delayChildren: 0.03,
    },
  },
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 50,
      staggerChildren: 0.08,
      delayChildren: 0.03,
    },
  },
}

interface AssistantChatDemoProps {
  value: string
  setValueState: (value: string) => void
  onSubmit: () => void
}

function AssistantChatDemo({ value, setValueState, onSubmit }: AssistantChatDemoProps) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [value])

  return (
    <AssistantChatForm
      textAreaRef={inputRef}
      placeholder="Ask me anything..."
      icon={<Box strokeWidth={1.5} size={24} className="text-foreground-muted" />}
      value={value}
      loading={loading}
      disabled={loading}
      onValueChange={(e) => setValueState(e.target.value)}
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)
        setTimeout(() => {
          setLoading(false)
          onSubmit()
        }, 1500)
      }}
    />
  )
}

function RecentItems() {
  const recentItemsSnap = useSnapshot(recentItemsStore)
  const router = useRouter()
  const editor = useEditorType()
  const { ref } = router.query

  if (!recentItemsSnap?.items || !ref) return null

  // Filter items based on editor type
  const filteredItems = recentItemsSnap.items
    .filter((item) => editorEntityTypes[editor].includes(item.type))
    .sort((a, b) => b.timestamp - a.timestamp)

  console.log('filteredItems', filteredItems)

  return (
    <div className="flex flex-col gap-0">
      {recentItemsSnap.items.length === 0 ? (
        <motion.div
          layout
          initial={false}
          className="flex flex-col items-center justify-center p-8 text-center"
        >
          <EntityTypeIcon type={'r' as ENTITY_TYPE} />
          <p className="text-sm text-foreground-lighter">No recent items yet</p>
          <p className="text-xs text-foreground-light">
            Items will appear here as you browse through your project
          </p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 gap-12 gap-y-0">
            {filteredItems.map((item: RecentItem, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/project/${ref}/${
                    item.type === 'sql'
                      ? `sql/${item.metadata?.sqlId}`
                      : item.type === 'r' ||
                          item.type === 'v' ||
                          item.type === 'm' ||
                          item.type === 'f' ||
                          item.type === 'p'
                        ? `editor/${item.metadata?.tableId}?schema=${item.metadata?.schema}`
                        : `explorer/${item.type}/${item.metadata?.schema}/${item.metadata?.name}`
                  }`}
                  className="flex items-center gap-4 rounded-lg bg-surface-100 py-2 transition-colors hover:bg-surface-200"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-surface-100 border">
                    <EntityTypeIcon type={item.type} />
                  </div>
                  <div className="flex flex-1 gap-5 items-center">
                    <span className="text-sm text-foreground">
                      <span className="text-foreground-lighter">{item.metadata?.schema}</span>
                      {item.metadata?.schema && <span className="text-foreground-light">.</span>}
                      <span className="text-foreground">{item.label || 'Untitled'}</span>
                    </span>
                    <div className="bg-border-muted flex grow h-px"></div>
                    <span className="text-xs text-foreground-lighter">
                      {dayjs(item.timestamp).fromNow()}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}

export function NewTab() {
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const editor = useEditorType()
  const project = useSelectedProject()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { isInUse: isPostgresInUse, isLoading: isLoadingCheckingPostgres } = usePostgresInUse()

  const [isLoading, setIsLoading] = useState(true)
  const [input, setInput] = useState('')
  const [showRightPanel, setShowRightPanel] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  //   const showRightPanel = false

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name: untitledSnippetTitle,
        owner_id: profile.id,
        project_id: project.id,
        sql: '',
      })
      snapV2.addSnippet({ projectRef: ref as string, snippet })
      removeNewTab(ref)
      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const [templates] = partition(SQL_TEMPLATES, { type: 'template' })
  const [quickstarts] = partition(SQL_TEMPLATES, { type: 'quickstart' })

  return (
    <LayoutGroup>
      <div className="flex h-full w-full">
        <motion.div className="flex-1" initial={false} animate="show" variants={containerVariants}>
          <div className="bg-surface-100 h-full overflow-y-auto py-12">
            <div className="mx-auto max-w-2xl space-y-6">
              {/* Action Cards */}
              <div className="flex flex-wrap gap-5">
                {(!isPostgresInUse
                  ? [
                      {
                        icon: <Table2 className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
                        title: 'Create your first table',
                        description: 'Design and create a new database table',
                        bgColor: 'bg-blue-500',
                        isBeta: false,
                      },
                      // {
                      //   icon: (
                      //     <SQL_ICON
                      //       className={cn('fill-foreground', 'w-4 h-4')}
                      //       strokeWidth={1.5}
                      //     />
                      //   ),
                      //   title: 'Write SQL',
                      //   description: 'Create tables and load data with SQL',
                      //   bgColor: 'bg-alternative',
                      //   isBeta: false,
                      //   onClick: handleNewQuery,
                      // },
                      {
                        icon: <Upload className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
                        title: 'Upload CSV',
                        description: 'Import data from CSV files',
                        bgColor: 'bg-green-500',
                        isBeta: false,
                        onClick: handleNewQuery,
                      },
                      // {
                      //   icon: (
                      //     <SQL_ICON
                      //       className={cn('fill-foreground', 'w-4 h-4')}
                      //       strokeWidth={1.5}
                      //     />
                      //   ),
                      //   title: 'Write SQL',
                      //   description: 'Create tables and load data with SQL',
                      //   bgColor: 'bg-alternative',
                      //   isBeta: false,
                      //   onClick: handleNewQuery,
                      // },
                    ]
                  : [
                      {
                        icon: <Table2 className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
                        title: 'New Table',
                        description: 'Create Postgres tables',
                        bgColor: 'bg-blue-500',
                        isBeta: false,
                      },
                      {
                        icon: <Upload className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
                        title: 'Upload CSV',
                        description: 'Import data from CSV files',
                        bgColor: 'bg-green-500',
                        isBeta: false,
                        onClick: handleNewQuery,
                      },
                      // {
                      //   icon: (
                      //     <SQL_ICON
                      //       className={cn('fill-foreground', 'w-4 h-4')}
                      //       strokeWidth={1.5}
                      //     />
                      //   ),
                      //   title: 'New Query',
                      //   description: 'Execute SQL queries',
                      //   bgColor: 'bg-violet-500',
                      //   isBeta: false,
                      //   onClick: handleNewQuery,
                      // },
                      // {
                      //   icon: <BarChart2 className="h-4 w-4 text-foreground" strokeWidth={2} />,
                      //   title: 'New Report',
                      //   description: 'Create data visualizations',
                      //   bgColor: 'bg-orange-500',
                      //   isBeta: true,
                      // },
                    ]
                ).map((item, i) => (
                  <ActionCard key={`action-card-${i}`} {...item} />
                ))}
              </div>

              {isLoadingCheckingPostgres ? (
                <motion.div className="w-full" variants={itemVariants}>
                  <Skeleton className="w-full h-[160px] rounded-lg" />
                </motion.div>
              ) : (
                !isPostgresInUse && (
                  <motion.div
                    className="w-full rounded-lg overflow-hidden relative border border-muted"
                    variants={itemVariants}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-background-surface-200 via-background-surface-200 to-transparent"></div>
                    <div className="relative z-10 px-5 py-4 h-full flex gap-5 items-center justify-between">
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-4">
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-300 border">
                            <BaggageClaim
                              size={14}
                              className="text-foreground-light"
                              strokeWidth={1.5}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <h2 className="text-base text-foreground">
                              Migrate your Database to Postgres
                            </h2>
                            <p className="text-xs text-foreground-light max-w-md">
                              Already have a database? Migrate any database to Supabase to access
                              backups, RESTful auto APIs, Authentication and more.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button type="default" className="rounded-full" iconRight={<BookOpen />}>
                        Migrate to Postgres
                      </Button>
                    </div>
                  </motion.div>
                )
              )}

              {isPostgresInUse && (
                <>
                  {/* Search Bar */}
                  {/* <div className="relative">
                    <Input
                      placeholder="Search all files"
                      icon={<Search size={14} className="text-foreground-light" />}
                    />
                  </div> */}

                  {/* Recent Files */}
                  <div className="space-y-4">
                    <h2 className="text-sm text-foreground">Recent files</h2>

                    <RecentItems />
                  </div>
                </>
              )}

              <Separator />

              {/* Example Prompts */}
              <AnimatePresence>
                {!showRightPanel && (
                  <motion.div
                    variants={itemVariants}
                    className="w-full"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div className="flex flex-col gap-3">
                      <motion.p
                        className="text-sm text-foreground-light"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showRightPanel ? 0 : 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Try these example prompts:
                      </motion.p>
                      {isLoading ? (
                        <>
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="h-6 bg-foreground/10 rounded animate-pulse"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 * i }}
                            />
                          ))}
                        </>
                      ) : (
                        [
                          'Create a table to store user profiles with basic information',
                          'Help me write a query to find the most active users in the last 30 days',
                          'Show me how to implement row level security for a multi-tenant application',
                          'Generate a function to calculate the distance between two geographic points',
                        ].map((prompt, i) => (
                          <motion.div
                            key={prompt}
                            className="text-sm text-foreground-light hover:text-foreground cursor-pointer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                              opacity: showRightPanel ? 0 : 1,
                              x: showRightPanel ? -20 : 0,
                            }}
                            transition={{
                              delay: showRightPanel ? 0 : 0.4 + i * 0.1,
                              duration: 0.2,
                            }}
                            onClick={() => {
                              setInput(prompt)
                              inputRef.current?.focus()
                            }}
                          >
                            "{prompt}"
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Input */}
              <motion.div
                variants={itemVariants}
                className="w-full"
                layout
                layoutId="chat-input"
                key="chat-input"
              >
                <AssistantChatDemo
                  value={input}
                  setValueState={setInput}
                  onSubmit={() => setShowRightPanel(true)}
                />
              </motion.div>
            </div>
            {editor === 'sql' && (
              <div className="flex flex-col gap-4 mx-auto py-10">
                <Tabs_Shadcn_ defaultValue="templates">
                  <TabsList_Shadcn_ className="mx-auto justify-center gap-5">
                    <TabsTrigger_Shadcn_ value="templates">Templates</TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="quickstarts">Quickstarts</TabsTrigger_Shadcn_>
                  </TabsList_Shadcn_>
                  <TabsContent_Shadcn_ value="templates" className="max-w-5xl mx-auto py-5">
                    <div className="grid grid-cols-3 gap-4">
                      {templates.map((item, i) => (
                        <ActionCard
                          bgColor="bg-alternative"
                          key={`action-card-${i}`}
                          {...item}
                          icon={
                            <SQL_ICON
                              className={cn('fill-foreground', 'w-4 h-4')}
                              strokeWidth={1.5}
                            />
                          }
                        />
                      ))}
                    </div>
                  </TabsContent_Shadcn_>
                  <TabsContent_Shadcn_ value="quickstarts" className="max-w-5xl mx-auto py-5">
                    <div className="grid grid-cols-3 gap-4">
                      {quickstarts.map((item, i) => (
                        <ActionCard
                          bgColor="bg-alternative"
                          key={`action-card-${i}`}
                          {...item}
                          icon={
                            <SQL_ICON
                              className={cn('fill-foreground', 'w-4 h-4')}
                              strokeWidth={1.5}
                            />
                          }
                        />
                      ))}
                    </div>
                  </TabsContent_Shadcn_>
                </Tabs_Shadcn_>
              </div>
            )}
          </div>
        </motion.div>
        {showRightPanel && (
          <motion.div
            className="w-[400px] border-l border-muted h-full bg-black flex flex-col"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
          >
            <div className="flex justify-between items-center p-4 border-b border-muted">
              <h3 className="text-sm font-medium">AI Assistant</h3>
              <button
                onClick={() => {
                  setShowRightPanel(false)
                  setInput('')
                }}
                className="p-1 hover:bg-surface-200 rounded-md"
              >
                <X size={16} className="text-foreground-light" />
              </button>
            </div>

            <div className="flex-1">{/* Chat content will go here */}</div>

            <motion.div
              layout
              layoutId="chat-input"
              key="chat-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border-t border-muted"
            >
              <AssistantChatDemo value={input} setValueState={setInput} onSubmit={() => {}} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  )
}
