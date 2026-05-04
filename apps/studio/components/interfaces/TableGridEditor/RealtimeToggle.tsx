import { useParams } from 'common'
import { Realtime } from 'icons'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { InlineLink } from '@/components/ui/InlineLink'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from '@/data/database-publications/database-publications-update-mutation'
import { Entity } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

export const RealtimeToggle = ({ table }: { table: Entity }) => {
  const track = useTrack()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [open, setOpen] = useState(false)

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const realtimeEnabledTables = realtimePublication?.tables ?? []
  const isRealtimeEnabled = realtimeEnabledTables.some((t) => t.id === table?.id)

  const { mutate: updatePublications, isPending: isTogglingRealtime } =
    useDatabasePublicationUpdateMutation({
      onSuccess: () => {
        setOpen(false)

        track(isRealtimeEnabled ? 'table_realtime_disabled' : 'table_realtime_enabled', {
          method: 'ui',
          schema_name: table.schema,
          table_name: table.name,
        })
      },
      onError: (error) => {
        toast.error(`Failed to toggle realtime for ${table.name}: ${error.message}`)
      },
    })

  const toggleRealtime = async () => {
    if (!project || !realtimePublication) return

    const exists = realtimeEnabledTables.some((x) => x.id === table.id)
    const tables = !exists
      ? [`${table.schema}.${table.name}`].concat(
          realtimeEnabledTables.map((t) => `${t.schema}.${t.name}`)
        )
      : realtimeEnabledTables.filter((x) => x.id !== table.id).map((x) => `${x.schema}.${x.name}`)

    track('realtime_toggle_table_clicked', {
      newState: exists ? 'disabled' : 'enabled',
      origin: 'tableGridHeader',
    })

    updatePublications({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: realtimePublication.id,
      tables,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonTooltip
          type="default"
          size="tiny"
          icon={
            <Realtime
              strokeWidth={1.5}
              className={isRealtimeEnabled ? 'text-brand' : 'text-foreground-muted'}
            />
          }
          className={cn('w-7 h-7 p-0', isRealtimeEnabled && 'text-brand hover:text-brand-hover')}
          tooltip={{
            content: {
              side: 'bottom',
              text: isRealtimeEnabled
                ? 'Disable Realtime for this table'
                : 'Enable Realtime for this table',
            },
          }}
        />
      </DialogTrigger>
      <DialogContent size="small" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isRealtimeEnabled ? 'Disable' : 'Enable'} realtime for {table.name}
          </DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <div className="space-y-2">
            <p className="text-sm">
              Once realtime has been {isRealtimeEnabled ? 'disabled' : 'enabled'}, the table will{' '}
              {isRealtimeEnabled ? 'no longer ' : ''}broadcast any changes to authorized
              subscribers.
            </p>
            {!isRealtimeEnabled && (
              <p className="text-sm">
                You may also select which events to broadcast to subscribers on the{' '}
                <InlineLink href={`/project/${ref}/database/publications`}>
                  database publications
                </InlineLink>{' '}
                settings.
              </p>
            )}
          </div>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isTogglingRealtime} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="primary" loading={isTogglingRealtime} onClick={toggleRealtime}>
            {isRealtimeEnabled ? 'Disable' : 'Enable'} realtime
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
