import { useRef } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AiIconAnimation,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Tabs_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  TabsContent_Shadcn_,
} from 'ui'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { ExplainVisualizer } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer'
import { QueryDetail } from '../../QueryPerformance/QueryDetail'
import { QueryIndexes } from '../../QueryPerformance/QueryIndexes'
import { buildExplainOptimizationPrompt } from '../../QueryPerformance/QueryPerformance.ai'
import type { QueryPlanRow } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.types'
import type { ClassifiedQuery } from '../QueryInsightsHealth/QueryInsightsHealth.types'

interface QueryInsightsDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSheetRow: ClassifiedQuery | undefined
  sheetView: 'details' | 'indexes' | 'explain'
  onSheetViewChange: (view: 'details' | 'indexes' | 'explain') => void
  onClose: () => void
  dataGridContainerRef: React.RefObject<HTMLDivElement | null>
  triageContainerRef: React.RefObject<HTMLDivElement | null>
  explainLoadingQuery: string | null
  explainResults: Record<string, QueryPlanRow[]>
}

export const QueryInsightsDetailSheet = ({
  open,
  onOpenChange,
  activeSheetRow,
  sheetView,
  onSheetViewChange,
  onClose,
  dataGridContainerRef,
  triageContainerRef,
  explainLoadingQuery,
  explainResults,
}: QueryInsightsDetailSheetProps) => {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetTitle className="sr-only">Query details</SheetTitle>
      <SheetDescription className="sr-only">Query Insights Details &amp; Indexes</SheetDescription>
      <SheetContent
        side="right"
        className="flex flex-col h-full bg-studio border-l lg:!w-[calc(100vw-802px)] max-w-[700px] w-full"
        hasOverlay={false}
        onInteractOutside={(event) => {
          if (
            dataGridContainerRef.current?.contains(event.target as Node) ||
            triageContainerRef.current?.contains(event.target as Node)
          ) {
            event.preventDefault()
          }
        }}
      >
        <Tabs_Shadcn_
          value={sheetView}
          className="flex flex-col h-full"
          onValueChange={(v) => onSheetViewChange(v as 'details' | 'indexes' | 'explain')}
        >
          <div className="px-5 border-b">
            <TabsList_Shadcn_ className="px-0 flex gap-x-4 min-h-[46px] border-b-0 [&>button]:h-[47px]">
              <TabsTrigger_Shadcn_
                value="details"
                className="px-0 pb-0 data-[state=active]:bg-transparent !shadow-none"
              >
                Query details
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="indexes"
                className="px-0 pb-0 data-[state=active]:bg-transparent !shadow-none"
              >
                Indexes
              </TabsTrigger_Shadcn_>
              {activeSheetRow?.issueType !== 'error' && (
                <TabsTrigger_Shadcn_
                  value="explain"
                  className="px-0 pb-0 data-[state=active]:bg-transparent !shadow-none"
                >
                  Explain
                </TabsTrigger_Shadcn_>
              )}
            </TabsList_Shadcn_>
          </div>
          <TabsContent_Shadcn_ value="details" className="mt-0 flex-grow min-h-0 overflow-y-auto">
            {activeSheetRow && (
              <QueryDetail
                selectedRow={activeSheetRow}
                onClickViewSuggestion={() => onSheetViewChange('indexes')}
                onClose={onClose}
              />
            )}
          </TabsContent_Shadcn_>
          <TabsContent_Shadcn_ value="indexes" className="mt-0 flex-grow min-h-0 overflow-y-auto">
            {activeSheetRow && <QueryIndexes selectedRow={activeSheetRow} />}
          </TabsContent_Shadcn_>
          <TabsContent_Shadcn_
            value="explain"
            className="mt-0 flex-grow min-h-0 flex flex-col overflow-hidden"
          >
            {explainLoadingQuery ? (
              <div className="px-6 py-4 flex items-center gap-2 text-sm text-foreground-light">
                <Loader2 size={14} className="animate-spin" /> Running EXPLAIN ANALYZE...
              </div>
            ) : activeSheetRow && explainResults[activeSheetRow.query]?.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-5 py-2 border-b flex-shrink-0">
                  <p className="text-xs text-foreground-lighter">EXPLAIN ANALYZE output</p>
                  <Button
                    type="default"
                    size="tiny"
                    icon={<AiIconAnimation size={14} />}
                    onClick={() => {
                      const rows = explainResults[activeSheetRow.query]
                      const { query, prompt } = buildExplainOptimizationPrompt(
                        activeSheetRow.query,
                        rows,
                        {
                          mean_time: activeSheetRow.mean_time,
                          calls: activeSheetRow.calls,
                          total_time: activeSheetRow.total_time,
                        }
                      )
                      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                      aiSnap.newChat({
                        sqlSnippets: [{ label: 'Query', content: query }],
                        initialMessage: prompt,
                      })
                    }}
                  >
                    Optimize with AI
                  </Button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <ExplainVisualizer rows={explainResults[activeSheetRow.query]} />
                </div>
              </>
            ) : (
              <div className="px-6 py-4 text-sm text-foreground-lighter">
                No explain results available.
              </div>
            )}
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      </SheetContent>
    </Sheet>
  )
}
