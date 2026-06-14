import { Check } from 'lucide-react'
import Link from 'next/link'
import { Button, IconDiscord } from 'ui'

import { NO_PROJECT_MARKER } from './SupportForm.utils'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useProfile } from '@/lib/profile'

interface SuccessProps {
  sentCategory?: string
  selectedProject?: string
  onFinish?: () => void
  finishLabel?: string
  showFinishAction?: boolean
}

export const Success = ({
  sentCategory: _sentCategory = '',
  selectedProject = NO_PROJECT_MARKER,
  onFinish,
  finishLabel = 'Finish',
  showFinishAction = true,
}: SuccessProps) => {
  const { profile } = useProfile()
  const respondToEmail = profile?.primary_email ?? 'your email'

  const { data: project } = useProjectDetailQuery(
    { ref: selectedProject },
    { enabled: selectedProject !== NO_PROJECT_MARKER }
  )
  const projectName = project ? project.name : 'No specific project'

  const finishAction = showFinishAction ? (
    onFinish ? (
      <Button type="default" onClick={onFinish}>
        {finishLabel}
      </Button>
    ) : (
      <Button asChild type="default">
        <Link href="/">{finishLabel}</Link>
      </Button>
    )
  ) : null

  return (
    <div className="flex w-full flex-col items-center gap-4 px-4 pt-4 text-center">
      <Check strokeWidth={1.5} size={24} className="text-brand" />

      <div className="flex max-w-[620px] flex-col items-center gap-2">
        <h3 className="text-xl">Support request sent</h3>
        <p className="text-balance text-sm text-foreground-light">
          {selectedProject !== NO_PROJECT_MARKER && (
            <>
              Your ticket has been logged for{' '}
              <span className="font-medium text-foreground">{projectName}</span>.{' '}
            </>
          )}
          We&apos;ll reach out at{' '}
          <span className="font-medium text-foreground">{respondToEmail}</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {finishAction}
        <Button
          asChild
          type="default"
          icon={<IconDiscord size={16} fill="hsl(var(--background-default))" />}
        >
          <Link href="https://discord.supabase.com/" target="_blank">
            Join Discord
          </Link>
        </Button>
      </div>
    </div>
  )
}
