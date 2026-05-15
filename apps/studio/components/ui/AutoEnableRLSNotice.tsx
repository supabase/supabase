import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { ShieldCheck, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
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

import { AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL } from '@/components/interfaces/Database/Triggers/EventTriggersList/EventTriggers.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabaseEventTriggerCreateMutation } from '@/data/database-event-triggers/database-event-trigger-create-mutation'
import { useDatabaseEventTriggersQuery } from '@/data/database-event-triggers/database-event-triggers-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

export const AutoEnableRLSNotice = ({ iconOnly }: { iconOnly?: boolean }) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const projectRef = ref ?? project?.ref

  // [Joshen] Changing the behaviour of this to not be dismissible, only minimized
  // Given that its a security measure that we highly advise. Otherwise there's no way for users to revisit this
  const [, setIsMinimized] = useLocalStorageQuery(
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

  if (!projectRef || isLoadingEventTriggers || hasDefaultTrigger) return null

  if (iconOnly) {
    return <CreateEnsureRLSTriggerDialog iconOnly />
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <div className="rounded-lg bg-surface-300 text-foreground-light w-10 h-10 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <div className="text-sm">
            <p>Auto-enable RLS for new tables</p>
            <p className="text-foreground-lighter">
              Create an event trigger that enables Row Level Security on all new tables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-2">
          <CreateEnsureRLSTriggerDialog />
          <ButtonTooltip
            icon={<X />}
            type="text"
            className="w-7"
            tooltip={{ content: { side: 'bottom', text: 'Minimize' } }}
            onClick={() => setIsMinimized(true)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

const CreateEnsureRLSTriggerDialog = ({ iconOnly }: { iconOnly?: boolean }) => {
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
        {iconOnly ? (
          <ButtonTooltip
            type="default"
            icon={<ShieldCheck />}
            className="w-7"
            tooltip={{ content: { side: 'bottom', text: 'Auto-enable RLS for new tables' } }}
          />
        ) : (
          <Button type="primary">Learn more</Button>
        )}
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
          <ButtonTooltip
            disabled={!canCreateTriggers}
            loading={isCreating}
            onClick={handleCreateTrigger}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canCreateTriggers
                  ? 'You need additional permissions to create triggers'
                  : undefined,
              },
            }}
          >
            Create ensure_rls trigger
          </ButtonTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
