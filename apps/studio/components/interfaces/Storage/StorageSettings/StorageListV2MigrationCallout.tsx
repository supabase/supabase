import dayjs from 'dayjs'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useState } from 'react'
import {
  Button,
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
import { Admonition, TimestampInfo } from 'ui-patterns'

// [Joshen] Will be decided by Storage team, temp setting to 1st Jan 2026 UTC (3 months buffer)
const MIGRATION_DEADLINE = '2026-01-01T00:00:00'

export const StorageListV2MigrationCallout = () => {
  const deadline = dayjs(MIGRATION_DEADLINE).utc(true)
  const currentDate = dayjs.utc()
  const remainingMonths = Math.ceil(deadline.diff(currentDate, 'months', true))

  return (
    <Admonition
      type={remainingMonths <= 1 ? 'warning' : 'note'}
      title="A new version of Storage is available for your project!"
    >
      <p className="!leading-normal prose max-w-full text-sm !mb-0">
        Get access to Analytics buckets to handle Iceberg files, along with a more efficient{' '}
        <code>list</code> method for fetching files via the client library.
      </p>
      {remainingMonths <= 1 && (
        <p className="!leading-normal prose max-w-full text-sm">
          Your project's Storage will be automatically upgraded by{' '}
          <TimestampInfo
            displayAs="utc"
            utcTimestamp={MIGRATION_DEADLINE}
            className="text-sm text-foreground"
            labelFormat="DD MMM YYYY HH:mm (UTC)"
          />{' '}
          if the upgrade is not completed by then.
        </p>
      )}
      <div className="flex items-center gap-x-2 mt-3">
        <DocsButton href="https://supabase.com/docs" />
        <StorageListV2MigrationDialog />
      </div>
    </Admonition>
  )
}

export const StorageListV2MigratingCallout = () => {
  return (
    <Admonition type="note" title="Project's storage is currently upgrading">
      <p className="!leading-normal prose max-w-full text-sm !mb-0">
        This notice will be closed once the upgrade has been completed - hang tight!
      </p>
      <div className="flex items-center gap-x-2 mt-3">
        <DocsButton href="https://supabase.com/docs" />
      </div>
    </Admonition>
  )
}

const StorageListV2MigrationDialog = () => {
  const { ref } = useParams()

  const [open, setOpen] = useState(false)

  const { mutate: updateStorageConfig, isLoading: isUpdating } =
    useProjectStorageConfigUpdateUpdateMutation({
      onSuccess: () => {
        toast.success(`Project's storage will be upgraded shortly!`)
        setOpen(false)
      },
    })

  const onConfirmUpgrade = () => {
    if (!ref) return console.error('Project ref is required')
    updateStorageConfig({ projectRef: ref, external: { upstreamTarget: 'canary' } })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="primary">Upgrade Storage</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade your project's Storage</DialogTitle>
          <DialogDescription>
            Get access to Analytics buckets and an improved list method
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <Admonition
          type="warning"
          className="mb-0 rounded-none border-x-0 border-t-0"
          title="Migration required to optimise the database schema for upgrade"
          description="We recommend running the update during periods of lower activity, although minimal to no disruption is expected."
        />

        <DialogSection>
          <p className="text-sm">
            This migration should only take a few minutes, but note that it will increase your
            Postgres disk size by about 5 - 10%. The upgrade is also backwards compatible so no
            changes to your client applications are required.
          </p>
        </DialogSection>

        <DialogFooter>
          <Button type="default" disabled={isUpdating} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="primary" loading={isUpdating} onClick={() => onConfirmUpgrade()}>
            Upgrade now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
