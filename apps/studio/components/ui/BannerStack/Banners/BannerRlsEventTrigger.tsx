import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import { AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL } from '@/components/interfaces/Database/Triggers/EventTriggersList/EventTriggers.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabaseEventTriggerCreateMutation } from '@/data/database-event-triggers/database-event-trigger-create-mutation'
import { useDatabaseEventTriggersQuery } from '@/data/database-event-triggers/database-event-triggers-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

export const BannerRlsEventTrigger = () => {
  const { ref } = useParams()
  const { dismissBanner } = useBannerStack()
  const { data: project } = useSelectedProjectQuery()
  const projectRef = ref ?? project?.ref

  const [hasCreated, setHasCreated] = useState(false)
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.RLS_EVENT_TRIGGER_BANNER_DISMISSED(projectRef ?? 'unknown'),
    false
  )

  const { data: eventTriggers = [], isLoading: isLoadingEventTriggers } =
    useDatabaseEventTriggersQuery({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })

  const hasDefaultTrigger = useMemo(
    () =>
      eventTriggers.some(
        (trigger) => trigger.name === 'ensure_rls' || trigger.function_name === 'rls_auto_enable'
      ),
    [eventTriggers]
  )

  useEffect(() => {
    if (hasDefaultTrigger) {
      setHasCreated(true)
    }
  }, [hasDefaultTrigger])

  if (!projectRef || isLoadingEventTriggers) return null

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('rls-event-trigger-banner')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <div
            className={cn(
              'p-2 rounded-lg bg-muted text-foreground-light',
              hasCreated && 'bg-brand-200 dark:bg-brand-400 text-brand'
            )}
          >
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">
            {hasCreated ? 'RLS auto-enable trigger is active' : 'Auto-enable RLS for new tables'}
          </p>
          <p className="text-xs text-foreground-lighter text-balance">
            {hasCreated
              ? 'New tables will have Row Level Security enabled automatically.'
              : 'Create an event trigger that enables Row Level Security on all new tables'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasCreated ? (
            <Button asChild type="default" size="tiny">
              <Link href={`/project/${projectRef}/database/triggers/event`}>View triggers</Link>
            </Button>
          ) : (
            <CreateEnsureRLSTriggerDialog onCreateSuccess={() => setHasCreated(true)} />
          )}
        </div>
      </div>
    </BannerCard>
  )
}

const CreateEnsureRLSTriggerDialog = ({ onCreateSuccess }: { onCreateSuccess: () => void }) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

  const [open, setOpen] = useState(false)

  const { can: canCreateTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  const { mutate: createEventTrigger, isPending: isCreating } =
    useDatabaseEventTriggerCreateMutation({
      onSuccess: () => {
        toast.success(
          'Successfully set up database trigger to automatically enable RLS on all new tables'
        )
        onCreateSuccess()
        setOpen(false)
      },
    })

  const handleCreateTrigger = () => {
    if (!project) return
    track('rls_event_trigger_banner_create_button_clicked')
    createEventTrigger({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql: AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonTooltip
          type="primary"
          size="tiny"
          disabled={!canCreateTriggers}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateTriggers
                ? 'You need additional permissions to create triggers'
                : undefined,
            },
          }}
        >
          Learn more
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Automatically enable RLS for newly created tables</DialogTitle>
          <DialogDescription>Secure your data using Postgres Row Level Security</DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm flex flex-col gap-y-2">
          <p>
            Tables in exposed schemas (default being the{' '}
            <code className="text-code-inline">public</code> schema) are accessible to anyone.
            Hence, we highly recommend enabling RLS on all such tables.
          </p>
          <p>
            You can set up a database trigger to enable RLS automatically on all new tables with the
            following SQL:
          </p>
        </DialogSection>

        <CodeBlock language="sql" className="language-sql px-0 border-x-0 rounded-none h-64">
          {AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL.trim()}
        </CodeBlock>

        <DialogFooter>
          <Button type="default" disabled={isCreating} onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button loading={isCreating} onClick={handleCreateTrigger}>
            Create ensure_rls trigger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
