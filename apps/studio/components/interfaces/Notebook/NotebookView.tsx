import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Play, Plus, Trash } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn, DropdownMenuItem } from 'ui'
import { Admonition } from 'ui-patterns'

import {
  createEmbeddedSqlBlock,
  getBlockLogsDatePickerValue,
  getBlockQuerySource,
  getBlockSql,
  isNotebookSqlBlock,
  mergeBlockChartConfig,
  unmapNotebookContentForApi,
} from '@/components/interfaces/Notebook/notebookBlock.utils'
import { useNotebookLazyMigration } from '@/components/interfaces/Notebook/useNotebookLazyMigration'
import { useNotebookPersist } from '@/components/interfaces/Notebook/useNotebookPersist'
import { generateSnippetTitle } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { SqlEditorShowSqlToggle } from '@/components/interfaces/SQLEditor/SqlEditorShowSqlToggle'
import { SqlQueryBlockEditor } from '@/components/interfaces/SQLEditor/SqlQueryBlockEditor'
import type { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { type Content } from '@/data/content/content-query'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { uuidv4 } from '@/lib/helpers'
import { useProfile } from '@/lib/profile'
import {
  registerNotebookBlock,
  runAllNotebookBlocks,
  unregisterNotebookBlock,
  type NotebookBlockPersistPatch,
} from '@/state/notebook-block-registry'
import { NotebookEditorProvider } from '@/state/notebook-editor-context'
import { SnippetWithContent, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import type { Dashboards } from '@/types'

interface NotebookBlockProps {
  notebookId: string
  block: Dashboards.Chart
  projectRef: string
  canUpdateReport: boolean
  persistBlock: (blockId: string, patch: NotebookBlockPersistPatch) => void
  persistChartConfig: (blockId: string, config: ChartConfig) => void
  onRemoveBlock: (blockId: string) => void
}

const NotebookBlock = ({
  notebookId,
  block,
  projectRef,
  canUpdateReport,
  persistBlock,
  persistChartConfig,
  onRemoveBlock,
}: NotebookBlockProps) => {
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [showSql, setShowSql] = useState(false)
  const [chartConfig, setChartConfig] = useState<ChartConfig>(() =>
    mergeBlockChartConfig(block.chartConfig, block.chart_type)
  )

  useEffect(() => {
    setChartConfig(mergeBlockChartConfig(block.chartConfig, block.chart_type))
  }, [block.chartConfig, block.chart_type])

  useEffect(() => {
    if (!projectRef || !profile || !project) return

    const snippet: SnippetWithContent = createSqlSnippetSkeletonV2({
      idOverride: block.id,
      name: block.label || generateSnippetTitle(),
      sql: getBlockSql(block),
      owner_id: profile.id,
      project_id: project.id,
    })

    snapV2.setSnippet(projectRef, snippet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectRef, profile, project, block.id, block.label, block.sql])

  useEffect(() => {
    registerNotebookBlock(block.id, {
      persistBlock: (patch: NotebookBlockPersistPatch) => persistBlock(block.id, patch),
    })
    return () => unregisterNotebookBlock(block.id)
  }, [block.id, persistBlock])

  const handleChartConfigChange = useCallback(
    (config: ChartConfig) => {
      setChartConfig(config)
      persistChartConfig(block.id, config)
    },
    [block.id, persistChartConfig]
  )

  const editorContextValue = useMemo(
    () => ({
      notebookId,
      blockId: block.id,
      chartConfig,
      onChartConfigChange: handleChartConfigChange,
      persistBlock: (patch: NotebookBlockPersistPatch) => persistBlock(block.id, patch),
      querySource: getBlockQuerySource(block),
      logsDatePickerValue: getBlockLogsDatePickerValue(block),
    }),
    [notebookId, block, chartConfig, handleChartConfigChange, persistBlock]
  )

  const blockTitle =
    block.label || snapV2.snippets[block.id]?.snippet.name || generateSnippetTitle()
  const isEditorReady = block.id in snapV2.snippets && !!snapV2.snippets[block.id].snippet.content

  const blockLeadingActions = (
    <SqlEditorShowSqlToggle
      isSqlEditorVisible={showSql}
      onToggle={() => setShowSql((current) => !current)}
    />
  )

  const blockMenuItems = canUpdateReport ? (
    <DropdownMenuItem className="gap-x-2" onClick={() => onRemoveBlock(block.id)}>
      <Trash size={14} />
      <span>Delete block</span>
    </DropdownMenuItem>
  ) : undefined

  return (
    <div id={`notebook-block-${block.id}`} className="rounded-lg border bg-surface-100">
      <NotebookEditorProvider value={editorContextValue}>
        <SqlQueryBlockEditor
          id={block.id}
          snippetName={blockTitle}
          title={blockTitle}
          leadingActions={blockLeadingActions}
          actions={blockMenuItems}
          variant="block"
          isSqlEditorVisible={showSql}
          autoFocus={false}
          isLoading={!isEditorReady}
        />
      </NotebookEditorProvider>
    </div>
  )
}

export interface NotebookViewProps {
  report: Content
  reportContent: Dashboards.Content
  canUpdateReport: boolean
  /** Compact layout for project home embed */
  variant?: 'full' | 'embed'
  showHeader?: boolean
}

export const NotebookView = ({
  report,
  reportContent: initialReportContent,
  canUpdateReport,
  variant = 'full',
  showHeader = true,
}: NotebookViewProps) => {
  const { ref, notebookId: notebookIdParam, reportId: legacyReportId } = useParams()
  const notebookId = (notebookIdParam ?? legacyReportId) as string | undefined
  const [notebookContent, setNotebookContent] = useState(initialReportContent)

  useEffect(() => {
    setNotebookContent(initialReportContent)
  }, [initialReportContent])

  useNotebookLazyMigration({
    projectRef: ref,
    notebook: report,
    notebookContent,
    onMigrated: setNotebookContent,
  })

  const { persistBlock, persistChartConfig, debouncedUpsert } = useNotebookPersist({
    projectRef: ref,
    notebook: report,
    notebookContent,
    onContentChange: setNotebookContent,
  })

  const snapV2 = useSqlEditorV2StateSnapshot()
  const { mutate: upsertContent, isPending: isAddingBlock } = useContentUpsertMutation()

  const sqlBlocks = useMemo(
    () => (notebookContent?.layout ?? []).filter(isNotebookSqlBlock),
    [notebookContent?.layout]
  )

  const sqlBlockIds = useMemo(() => sqlBlocks.map((block) => block.id), [sqlBlocks])
  const [isRunningAll, setIsRunningAll] = useState(false)
  const canRunAll =
    sqlBlocks.length > 0 &&
    sqlBlocks.every((block) => {
      const snippet = snapV2.snippets[block.id]
      return !!snippet?.snippet.content
    })

  const handleRunAll = useCallback(async () => {
    if (!canRunAll || isRunningAll) return

    setIsRunningAll(true)
    try {
      await runAllNotebookBlocks(sqlBlockIds, { force: true })
    } finally {
      setIsRunningAll(false)
    }
  }, [canRunAll, isRunningAll, sqlBlockIds])

  const handleAddBlock = useCallback(() => {
    if (!ref || !report || !notebookId) return

    const blockId = uuidv4()
    const newBlock = createEmbeddedSqlBlock({
      id: blockId,
      label: generateSnippetTitle(),
    })

    const updatedContent: Dashboards.Content = {
      ...notebookContent,
      layout: [...notebookContent.layout, newBlock],
    }

    setNotebookContent(updatedContent)

    upsertContent(
      {
        projectRef: ref,
        payload: {
          ...report,
          id: notebookId,
          type: 'report',
          content: unmapNotebookContentForApi(updatedContent),
        },
      },
      {
        onSuccess: () => {
          toast.success('Block added')
          requestAnimationFrame(() => {
            document
              .getElementById(`notebook-block-${blockId}`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          })
        },
        onError: (error) => {
          toast.error(`Failed to add block: ${error.message}`)
        },
      }
    )
  }, [ref, report, notebookId, notebookContent, upsertContent])

  const handleRemoveBlock = useCallback(
    (blockId: string) => {
      if (!ref || !report || !notebookId) return

      debouncedUpsert.cancel()

      const previousContent = notebookContent
      const updatedContent: Dashboards.Content = {
        ...previousContent,
        layout: previousContent.layout.filter((item) => item.id !== blockId),
      }

      setNotebookContent(updatedContent)

      upsertContent(
        {
          projectRef: ref,
          payload: {
            ...report,
            id: notebookId,
            type: 'report',
            content: unmapNotebookContentForApi(updatedContent),
          },
        },
        {
          onSuccess: () => {
            snapV2.removeSnippet(blockId, true)
            toast.success('Block removed')
          },
          onError: (error) => {
            setNotebookContent(previousContent)
            toast.error(`Failed to remove block: ${error.message}`)
          },
        }
      )
    },
    [ref, report, notebookId, notebookContent, upsertContent, debouncedUpsert, snapV2]
  )

  const resolvedNotebookId = notebookId ?? report.id ?? ''
  const notebookDescription = report.description?.trim()

  return (
    <div className={cn('flex flex-col', variant === 'full' ? 'h-full overflow-y-auto' : 'gap-4')}>
      {showHeader && (
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-medium">{report.name}</h1>
              {notebookDescription ? (
                <p className="text-sm text-foreground-light">{notebookDescription}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {variant === 'full' && sqlBlocks.length > 0 && (
                <ButtonTooltip
                  type="default"
                  icon={<Play size={14} />}
                  loading={isRunningAll}
                  disabled={!canRunAll || isRunningAll}
                  onClick={() => void handleRunAll()}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: canRunAll ? 'Run all blocks' : 'Waiting for blocks to finish loading',
                    },
                  }}
                >
                  Run all
                </ButtonTooltip>
              )}
              {variant === 'embed' && ref && resolvedNotebookId && (
                <Button type="default" asChild>
                  <Link href={`/project/${ref}/sql/notebooks/${resolvedNotebookId}`}>
                    Open notebook
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={cn('flex flex-col gap-4', variant === 'full' ? 'flex-1 px-6 py-4' : '')}>
        {sqlBlocks.length === 0 ? (
          <Admonition type="default" title="No blocks yet">
            Add a SQL block below to start building this notebook.
          </Admonition>
        ) : (
          sqlBlocks.map((block) => (
            <NotebookBlock
              key={block.id}
              notebookId={resolvedNotebookId}
              block={block}
              projectRef={ref!}
              canUpdateReport={canUpdateReport}
              persistBlock={persistBlock}
              persistChartConfig={persistChartConfig}
              onRemoveBlock={handleRemoveBlock}
            />
          ))
        )}

        {canUpdateReport && (
          <div>
            <Button
              type="dashed"
              block
              size="large"
              icon={<Plus />}
              loading={isAddingBlock}
              onClick={handleAddBlock}
              className="w-full"
            >
              Add block
            </Button>
          </div>
        )}

        {!canUpdateReport && variant === 'full' && (
          <ButtonTooltip
            disabled
            type="dashed"
            block
            size="large"
            icon={<Plus />}
            className="w-full"
            tooltip={{
              content: {
                side: 'top',
                className: 'w-56 text-center',
                text: 'You need additional permissions to update notebooks',
              },
            }}
          >
            Add block
          </ButtonTooltip>
        )}
      </div>
    </div>
  )
}

export const useNotebookPermissions = (report: Content | undefined) => {
  const { profile } = useProfile()

  const { can: canReadReport, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'user_content',
    {
      resource: {
        type: 'report',
        visibility: report?.visibility,
        owner_id: report?.owner_id,
      },
      subject: { id: profile?.id },
    }
  )

  const { can: canUpdateReport } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'user_content',
    {
      resource: {
        type: 'report',
        visibility: report?.visibility,
        owner_id: report?.owner_id,
      },
      subject: { id: profile?.id },
    }
  )

  return { canReadReport, canUpdateReport, isLoadingPermissions }
}

export function findHomeNotebook(reports: Content[]) {
  return (
    reports.find((r) => (r.content as Dashboards.Content)?.meta?.role === 'home') ??
    reports.find((r) => r.name === 'Home')
  )
}

export function createHomeNotebookContent(): Dashboards.Content {
  return {
    schema_version: 1,
    period_start: { time_period: '7d', date: '' },
    period_end: { time_period: 'today', date: '' },
    interval: '1d',
    layout: [],
    meta: { role: 'home' },
  }
}
