import { useParams } from 'common'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import { InlineLink } from '@/components/ui/InlineLink'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from '@/data/database-publications/database-publications-update-mutation'
import {
  getTablesForPublicationToggle,
  isTableInPublication,
} from '@/data/database-publications/database-publications.utils'
import { Entity } from '@/data/table-editor/table-editor-types'
import { useGetTables } from '@/data/tables/tables-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

export const RealtimeToggleDialog = ({
  table,
  open,
  setOpen,
}: {
  table: Entity
  open: boolean
  setOpen: (value: boolean) => void
}) => {
  const track = useTrack()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const isRealtimeEnabled = isTableInPublication(realtimePublication, table.id)
  const getTables = useGetTables({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

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

    const enabled = !isRealtimeEnabled
    const allTables =
      realtimePublication.tables === null && !enabled ? await getTables() : undefined
    const tables = getTablesForPublicationToggle({
      publication: realtimePublication,
      table,
      enabled,
      allTables,
    })
    if (tables === undefined) return

    track('realtime_toggle_table_clicked', {
      newState: enabled ? 'enabled' : 'disabled',
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
      <DialogContent size="small" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isRealtimeEnabled ? <span>Disable</span> : <span>Enable</span>}{' '}
            <span>realtime for</span> {table.name}
          </DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <div className="space-y-2">
            <p className="text-sm">
              Once realtime has been{' '}
              {isRealtimeEnabled ? <span>disabled</span> : <span>enabled</span>}
              <span>, the table will</span> {isRealtimeEnabled ? <span>{'no longer '}</span> : ''}
              <span>broadcast any changes to authorized subscribers.</span>
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
          <Button disabled={isTogglingRealtime} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" loading={isTogglingRealtime} onClick={toggleRealtime}>
            {isRealtimeEnabled ? <span>Disable</span> : <span>Enable</span>} <span>realtime</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
