import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
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

// [Joshen] Will be decided by Storage team, temp setting to 15th December 2025 UTC (3 months buffer)
const MIGRATION_DEADLINE = '2025-12-15T00:00:00'

export const StorageListV2MigrationCallout = () => {
  const deadline = dayjs(MIGRATION_DEADLINE).utc(true)
  const currentDate = dayjs.utc()
  const remainingMonths = Math.ceil(deadline.diff(currentDate, 'months', true))

  return (
    <Admonition
      type="note"
      title="A new version of Storage is available for your project"
      description={
        <>
          <p>
            Get access to the List-V2 endpoint for improved performance and the ability to enable
            Analytics buckets to your storage system.
          </p>
          {remainingMonths <= 1 && (
            <p>
              Your project's Storage will be automatically upgraded by{' '}
              <TimestampInfo
                displayAs="utc"
                utcTimestamp={MIGRATION_DEADLINE}
                className="text-sm text-inherit font-medium"
                labelFormat="DD MMM YYYY HH:mm (UTC)"
              />{' '}
              if the upgrade is not completed by then.
            </p>
          )}
        </>
      }
      actions={<StorageListV2MigrationDialog />}
    />
  )
}

export const StorageListV2MigratingCallout = () => {
  return (
    <Admonition
      type="note"
      title="Project storage is currently upgrading"
      description="This notice will be closed once the upgrade has been completed. Hang tight!"
    />
  )
}

const StorageListV2MigrationDialog = () => {
  const { ref } = useParams()
  const { can: canUpdateStorageSettings } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

  const [open, setOpen] = useState(false)

  const { mutate: updateStorageConfig, isPending: isUpdating } =
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
        <ButtonTooltip
          type="primary"
          disabled={!canUpdateStorageSettings}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateStorageSettings
                ? 'You need additional permissions to upgrade storage'
                : undefined,
            },
          }}
        >
          Upgrade Storage
        </ButtonTooltip>
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
          className="rounded-none border-x-0 border-t-0"
          title="Migration required to optimise the database schema for upgrade"
          description="We recommend running the update during periods of lower activity, although minimal to no disruption is expected."
        />

        <DialogSection className="flex flex-col gap-y-2">
          <p className="text-sm">
            Depending on the number of objects in your Storage, the migration can take up to 24
            hours to finish.
          </p>

          <p className="text-sm">
            The upgrade will increase your disk size to about 15 - 25% and IOPS will be used to
            create new efficient indexes as well as denormalising tables.
          </p>

          <p className="text-sm">
            Ensure that your database instance has not{' '}
            <InlineLink href={`/project/${ref}/settings/compute-and-disk#disk-size`}>
              scaled disk
            </InlineLink>{' '}
            within the last 6h and you have at least 60%{' '}
            <InlineLink href={`/project/${ref}/settings/infrastructure#infrastructure-activity`}>
              CPU capacity
            </InlineLink>{' '}
            before proceeding.
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
