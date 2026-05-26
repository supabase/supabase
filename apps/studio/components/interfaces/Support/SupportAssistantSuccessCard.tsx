import { ArrowUpRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import {
  AiIconAnimation,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
} from 'ui'

import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_PROJECT_MARKER } from './SupportForm.utils'

interface SupportAssistantSuccessCardProps {
  request: SubmittedSupportRequest
  className?: string
}

const SupportAssistantSuccessCardContent = dynamic<SupportAssistantSuccessCardProps>(
  () =>
    import('@/components/ui/AIAssistantPanel/AIAssistant').then(
      (mod) => mod.SupportAssistantSuccessCardContent
    ),
  {
    loading: () => <SupportAssistantSuccessCardLoadingShell />,
  }
)

function hasProjectScopedAssistantContext(projectRef: string | undefined) {
  return projectRef !== undefined && projectRef !== NO_PROJECT_MARKER
}

export function SupportAssistantSuccessCard(props: SupportAssistantSuccessCardProps) {
  if (!hasProjectScopedAssistantContext(props.request.projectRef)) return null

  return <SupportAssistantSuccessCardContent {...props} />
}

function SupportAssistantSuccessCardLoadingShell({ className }: { className?: string }) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label="Open assistant response"
      className={cn(
        'group cursor-pointer bg-muted/50 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        className
      )}
    >
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background">
            <AiIconAnimation size={14} />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle>While you wait</CardTitle>
            <CardDescription>Assistant may be able to help</CardDescription>
          </div>
        </div>
        <ArrowUpRight
          size={14}
          strokeWidth={1.5}
          className="shrink-0 text-foreground-lighter transition-colors group-hover:text-foreground"
          aria-hidden
        />
      </CardHeader>
      <CardContent>
        <SupportAssistantResponseLoadingSkeleton />
      </CardContent>
    </Card>
  )
}

function SupportAssistantResponseLoadingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[82%]" />
      <Skeleton className="h-4 w-[92%]" />
      <Skeleton className="h-4 w-[68%]" />
    </div>
  )
}
