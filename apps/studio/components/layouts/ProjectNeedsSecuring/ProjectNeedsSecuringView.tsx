import { ArrowRight, Check, ExternalLink, Lightbulb, Lock, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import {
  Button,
  Button_Shadcn_,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type {
  ProjectSecurityActionDetails,
  ProjectSecurityActionType,
  ProjectSecurityTable,
} from './ProjectNeedsSecuring.types'
import {
  buildSecurityPromptMarkdown,
  formatRlsDescription,
  getTableKey,
} from './ProjectNeedsSecuring.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import AlertError from '@/components/ui/AlertError'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const StatusCell = ({ enabled, label }: { enabled: boolean; label: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {enabled ? (
      <Check size={14} className="text-brand" aria-hidden="true" />
    ) : (
      <X size={14} className="text-destructive" aria-hidden="true" />
    )}
    <span>{label}</span>
  </div>
)

export const ProjectNeedsSecuringView = ({
  projectRef,
  issueCount,
  tables,
  isLoading,
  error,
  onDismiss,
  onTrackAction,
}: {
  projectRef: string
  issueCount: number
  tables: ProjectSecurityTable[]
  isLoading: boolean
  error?: { message: string } | null
  onDismiss: () => void
  onTrackAction: (type: ProjectSecurityActionType, details?: ProjectSecurityActionDetails) => void
}) => {
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const promptMarkdown = useMemo(
    () => buildSecurityPromptMarkdown(issueCount, tables),
    [issueCount, tables]
  )

  const handleOpenAssistant = () => {
    onTrackAction('ask_assistant')
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({
      name: 'Review project security',
      initialInput: promptMarkdown,
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderIcon>
            <div className="shrink-0 w-14 h-14 relative bg-destructive-200 border border-destructive-400 rounded-md flex items-center justify-center">
              <Lightbulb size={20} strokeWidth={1.5} className="text-destructive" />
            </div>
          </PageHeaderIcon>
          <PageHeaderSummary>
            <PageHeaderTitle>Your project needs securing</PageHeaderTitle>
            <PageHeaderDescription>{formatRlsDescription(issueCount)}</PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <AiAssistantDropdown
              label="Ask Assistant"
              size="tiny"
              buildPrompt={() => promptMarkdown}
              onOpenAssistant={handleOpenAssistant}
              onCopyPrompt={() => onTrackAction('copy_prompt')}
              copyLabel="Copy Markdown"
              disabled={isLoading}
            />
            <Button asChild type="default" iconRight={<ArrowRight />}>
              <Link
                href={`/project/${projectRef}`}
                onClick={() => {
                  onTrackAction('skip_to_home')
                  onDismiss()
                }}
              >
                Skip to home
              </Link>
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="default" className="pb-12">
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Review and fix</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            {isLoading ? (
              <GenericSkeletonLoader />
            ) : error ? (
              <AlertError
                projectRef={projectRef}
                error={error}
                subject="Failed to retrieve project tables"
              />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Schema</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1.5">
                          <span>Accessible via Data API</span>
                          <Button_Shadcn_ asChild variant="ghost" size="icon" className="h-6 w-6">
                            <Link
                              href={`/project/${projectRef}/integrations/data_api/settings`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Open Data API settings"
                            >
                              <ExternalLink size={14} aria-hidden="true" />
                            </Link>
                          </Button_Shadcn_>
                        </div>
                      </TableHead>
                      <TableHead>RLS</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.map((table) => (
                      <TableRow key={getTableKey(table)}>
                        <TableCell className="font-medium">{table.name}</TableCell>
                        <TableCell>{table.schema}</TableCell>
                        <TableCell>
                          <StatusCell
                            enabled={table.dataApiAccessible}
                            label={table.dataApiAccessible ? 'Accessible' : 'Not accessible'}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusCell
                            enabled={table.rlsEnabled}
                            label={table.rlsEnabled ? 'Enabled' : 'Disabled'}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {!table.rlsEnabled && (
                            <Button asChild type="default" size="tiny" icon={<Lock size={14} />}>
                              <Link
                                href={`/project/${projectRef}/auth/policies?schema=${table.schema}&search=${table.name}`}
                                onClick={() =>
                                  onTrackAction('view_policies', {
                                    schema: table.schema,
                                    tableName: table.name,
                                  })
                                }
                              >
                                View policies
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}
