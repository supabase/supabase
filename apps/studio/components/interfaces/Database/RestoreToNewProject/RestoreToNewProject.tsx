import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { PITRForm } from 'components/interfaces/Database/Backups/PITR/PITRForm'
import { BackupsList } from 'components/interfaces/Database/Backups/RestoreToNewProject/BackupsList'
import { ConfirmRestoreDialog } from 'components/interfaces/Database/Backups/RestoreToNewProject/ConfirmRestoreDialog'
import { CreateNewProjectDialog } from 'components/interfaces/Database/Backups/RestoreToNewProject/CreateNewProjectDialog'
import { projectSpecToMonthlyPrice } from 'components/interfaces/Database/Backups/RestoreToNewProject/RestoreToNewProject.utils'
import { DiskType } from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { Markdown } from 'components/interfaces/Markdown'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useCloneBackupsQuery } from 'data/projects/clone-query'
import { useCloneStatusQuery } from 'data/projects/clone-status-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  useIsAwsK8sCloudProvider,
  useIsOrioleDb,
  useSelectedProjectQuery,
} from 'hooks/misc/useSelectedProject'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
import { getDatabaseMajorVersion } from 'lib/helpers'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { PreviousRestoreItem } from './PreviousRestoreItem'

export const RestoreToNewProject = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan?.id === 'free'
  const isOrioleDb = useIsOrioleDb()
  const isAwsK8s = useIsAwsK8sCloudProvider()

  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [recoveryTimeTarget, setRecoveryTimeTarget] = useState<number | null>(null)

  const {
    data: cloneBackups,
    error,
    isPending: cloneBackupsLoading,
    isError,
  } = useCloneBackupsQuery({ projectRef: project?.ref }, { enabled: !isFreePlan })

  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const { can: canReadPhysicalBackups, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'physical_backups'
  )
  const { can: canTriggerPhysicalBackups } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )
  const PITR_ENABLED = cloneBackups?.pitr_enabled
  const PHYSICAL_BACKUPS_ENABLED = project?.is_physical_backups_enabled
  const dbVersion = getDatabaseMajorVersion(project?.dbVersion ?? '')
  const IS_PG15_OR_ABOVE = dbVersion >= 15
  const targetVolumeSizeGb = cloneBackups?.target_volume_size_gb
  const targetComputeSize = cloneBackups?.target_compute_size
  const planId = organization?.plan?.id ?? 'free'
  const { data } = useDiskAttributesQuery({ projectRef: project?.ref })
  const storageType = data?.attributes?.type ?? 'gp3'

  const {
    data: cloneStatus,
    refetch: refetchCloneStatus,
    isPending: cloneStatusLoading,
    isSuccess: isCloneStatusSuccess,
  } = useCloneStatusQuery(
    {
      projectRef: project?.ref,
    },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      enabled: PHYSICAL_BACKUPS_ENABLED || PITR_ENABLED,
    }
  )
  const IS_CLONED_PROJECT = cloneStatus?.cloned_from?.source_project?.ref ? true : false
  const isLoading = !isPermissionsLoaded || cloneBackupsLoading || cloneStatusLoading

  useEffect(() => {
    if (!isCloneStatusSuccess) return
    const hasTransientState = cloneStatus.clones.some((c) => c.status === 'IN_PROGRESS')
    if (!hasTransientState) {
      setRefetchInterval(false)
    }
  }, [cloneStatus?.clones, isCloneStatusSuccess])

  const previousClones = cloneStatus?.clones
  const isRestoring = previousClones?.some((c) => c.status === 'IN_PROGRESS')
  const restoringClone = previousClones?.find((c) => c.status === 'IN_PROGRESS')

  if (isFreePlan) {
    return (
      <UpgradeToPro
        buttonText="Upgrade"
        source="backupsRestoreToNewProject"
        featureProposition="enable restoring to new project"
        primaryText="Restore to a new project requires Pro Plan and above"
        secondaryText="To restore to a new project, you need to upgrade to a Pro Plan and have physical backups enabled."
      />
    )
  }

  if (isOrioleDb) {
    return (
      <Admonition
        type="default"
        title="Restoring to new projects are not available for OrioleDB"
        description="OrioleDB is currently in public alpha and projects created are strictly ephemeral with no database backups"
      />
    )
  }

  if (isAwsK8s) {
    return (
      <Admonition
        type="default"
        title="Restoring to new projects is temporarily not available for AWS (Revamped) projects"
      />
    )
  }

  if (!canReadPhysicalBackups) {
    return <NoPermission resourceText="view backups" />
  }

  if (!canTriggerPhysicalBackups) {
    return <NoPermission resourceText="restore backups" />
  }

  if (!IS_PG15_OR_ABOVE) {
    return (
      <Admonition
        type="default"
        title="Restore to new project is not available for this database version"
      >
        <Markdown
          className="max-w-full"
          content={`Restore to new project is only available for Postgres 15 and above.  
            Go to [infrastructure settings](/project/${project?.ref}/settings/infrastructure)
            to upgrade your database version.
          `}
        />
      </Admonition>
    )
  }

  if (!PHYSICAL_BACKUPS_ENABLED) {
    return (
      <Admonition
        type="default"
        title="Physical backups are required"
        description={
          <>
            Physical backups must be enabled to restore your database to a new project.{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/backups`}>Learn more</InlineLink>
          </>
        }
      />
    )
  }

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (IS_CLONED_PROJECT) {
    return (
      <Admonition type="default" title="This project cannot be restored to a new project">
        <Markdown
          className="max-w-full [&>p]:!leading-normal"
          content={`This is a temporary limitation whereby projects that were originally restored from another project cannot be restored to yet another project.`}
        />
        <Button asChild type="default">
          <Link href={`/project/${cloneStatus?.cloned_from?.source_project?.ref || ''}`}>
            Go to original project
          </Link>
        </Button>
      </Admonition>
    )
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve backups" />
  }

  if (!isActiveHealthy) {
    return (
      <Admonition
        type="default"
        title="Restore to new project is not available while project is offline"
        description="Your project needs to be online to restore your database to a new project"
      />
    )
  }

  if (
    !isLoading &&
    PITR_ENABLED &&
    !cloneBackups?.physicalBackupData.earliestPhysicalBackupDateUnix
  ) {
    return (
      <Admonition
        type="default"
        title="No backups found"
        description="PITR is enabled, but no backups were found. Check again in a few minutes."
      />
    )
  }

  if (!isLoading && !PITR_ENABLED && cloneBackups?.backups.length === 0) {
    return (
      <>
        <Admonition
          type="default"
          title="No backups found"
          description="Backups are enabled, but no backups were found. Check again tomorrow."
        />
      </>
    )
  }

  const additionalMonthlySpend = projectSpecToMonthlyPrice({
    targetVolumeSizeGb: targetVolumeSizeGb ?? 0,
    targetComputeSize: targetComputeSize ?? 'nano',
    planId: planId ?? 'free',
    storageType: storageType as DiskType,
  })

  return (
    <div className="flex flex-col gap-4">
      <ConfirmRestoreDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        onSelectContinue={() => {
          setShowConfirmationDialog(false)
          setShowNewProjectDialog(true)
        }}
        additionalMonthlySpend={additionalMonthlySpend}
      />
      <CreateNewProjectDialog
        open={showNewProjectDialog}
        selectedBackupId={selectedBackupId}
        recoveryTimeTarget={recoveryTimeTarget}
        additionalMonthlySpend={additionalMonthlySpend}
        onOpenChange={setShowNewProjectDialog}
        onCloneSuccess={() => {
          refetchCloneStatus()
          setRefetchInterval(5000)
          setShowNewProjectDialog(false)
        }}
      />
      {isRestoring ? (
        <Alert_Shadcn_ className="[&>svg]:bg-none! [&>svg]:text-foreground-light mb-6">
          <Loader2 className="animate-spin" />
          <AlertTitle_Shadcn_>Restoration in progress</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              The new project {(restoringClone?.target_project as any)?.name || ''} is currently
              being created. You'll be able to restore again once the project is ready.
            </p>
            <Button asChild type="default" className="mt-2">
              <Link href={`/project/${restoringClone?.target_project?.ref ?? '_'}`}>
                Go to new project
              </Link>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      ) : null}
      {previousClones?.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Previous restorations</h3>
          <Panel className="flex flex-col divide-y divide-border">
            {previousClones?.map((c) => <PreviousRestoreItem key={c.inserted_at} clone={c} />)}
          </Panel>
        </div>
      ) : null}
      {PITR_ENABLED ? (
        <>
          <PITRForm
            disabled={isRestoring}
            onSubmit={(v) => {
              setShowConfirmationDialog(true)
              setRecoveryTimeTarget(v.recoveryTimeTargetUnix)
            }}
            earliestAvailableBackupUnix={
              cloneBackups?.physicalBackupData.earliestPhysicalBackupDateUnix || 0
            }
            latestAvailableBackupUnix={
              cloneBackups?.physicalBackupData.latestPhysicalBackupDateUnix || 0
            }
          />
        </>
      ) : (
        <BackupsList
          disabled={isRestoring}
          onSelectRestore={(id) => {
            setSelectedBackupId(id)
            setShowConfirmationDialog(true)
          }}
        />
      )}
    </div>
  )
}
