import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronRightIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import { PITRForm } from 'components/interfaces/Database/Backups/PITR/pitr-form'
import { BackupsList } from 'components/interfaces/Database/Backups/RestoreToNewProject/BackupsList'
import { ConfirmRestoreDialog } from 'components/interfaces/Database/Backups/RestoreToNewProject/ConfirmRestoreDialog'
import { CreateNewProjectDialog } from 'components/interfaces/Database/Backups/RestoreToNewProject/CreateNewProjectDialog'
import { Markdown } from 'components/interfaces/Markdown'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useCloneBackupsQuery } from 'data/projects/clone-query'
import { useCloneStatusQuery } from 'data/projects/clone-status-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDb } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { getDatabaseMajorVersion } from 'lib/helpers'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Badge, Button } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import Panel from 'components/ui/Panel'
import { projectSpecToMonthlyPrice } from 'components/interfaces/Database/Backups/RestoreToNewProject/RestoreToNewProject.utils'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { DiskType } from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { InfraInstanceSize } from 'components/interfaces/DiskManagement/DiskManagement.types'
import DefaultLayout from 'components/layouts/DefaultLayout'

const RestoreToNewProjectPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="rtnp" />
            <div className="space-y-8">
              <RestoreToNewProject />
            </div>
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

RestoreToNewProjectPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

const RestoreToNewProject = () => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const isFreePlan = subscription?.plan?.id === 'free'
  const isOrioleDb = useIsOrioleDb()

  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [recoveryTimeTarget, setRecoveryTimeTarget] = useState<number | null>(null)

  const {
    data: cloneBackups,
    error,
    isLoading: cloneBackupsLoading,
    isError,
  } = useCloneBackupsQuery({ projectRef: project?.ref }, { enabled: !isFreePlan })

  const plan = subscription?.plan?.id
  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadPhysicalBackups = useCheckPermissions(PermissionAction.READ, 'physical_backups')
  const canTriggerPhysicalBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )
  const PITR_ENABLED = cloneBackups?.pitr_enabled
  const PHYSICAL_BACKUPS_ENABLED = project?.is_physical_backups_enabled
  const dbVersion = getDatabaseMajorVersion(project?.dbVersion ?? '')
  const IS_PG15_OR_ABOVE = dbVersion >= 15
  const targetVolumeSizeGb = cloneBackups?.target_volume_size_gb
  const targetComputeSize = cloneBackups?.target_compute_size
  const planId = subscription?.plan?.id ?? 'free'
  const { data } = useDiskAttributesQuery({ projectRef: project?.ref })
  const storageType = data?.attributes?.type ?? 'gp3'

  const {
    data: cloneStatus,
    refetch: refetchCloneStatus,
    isLoading: cloneStatusLoading,
  } = useCloneStatusQuery(
    {
      projectRef: project?.ref,
    },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        const hasTransientState = data?.clones.some((c) => c.status === 'IN_PROGRESS')
        if (!hasTransientState) setRefetchInterval(false)
      },
      enabled: PHYSICAL_BACKUPS_ENABLED || PITR_ENABLED,
    }
  )
  const IS_CLONED_PROJECT = (cloneStatus?.cloned_from?.source_project as any)?.ref ? true : false
  const isLoading = !isPermissionsLoaded || cloneBackupsLoading || cloneStatusLoading

  const previousClones = cloneStatus?.clones
  const isRestoring = previousClones?.some((c) => c.status === 'IN_PROGRESS')
  const restoringClone = previousClones?.find((c) => c.status === 'IN_PROGRESS')

  const StatusBadge = ({
    status,
  }: {
    status: NonNullable<typeof previousClones>[number]['status']
  }) => {
    const statusTextMap = {
      IN_PROGRESS: 'RESTORING',
      COMPLETED: 'COMPLETED',
      REMOVED: 'REMOVED',
      FAILED: 'FAILED',
    }

    if (status === 'IN_PROGRESS') {
      return <Badge variant="warning">{statusTextMap[status]}</Badge>
    }

    if (status === 'FAILED') {
      return <Badge variant="destructive">{statusTextMap[status]}</Badge>
    }

    return <Badge>{statusTextMap[status]}</Badge>
  }

  const PreviousRestoreItem = ({
    clone,
  }: {
    clone: NonNullable<typeof previousClones>[number]
  }) => {
    if (clone.status === 'REMOVED') {
      return (
        <div className="grid grid-cols-4 gap-2 text-sm p-4 group">
          <div className="min-w-24 truncate">{(clone.target_project as any).name}</div>
          <div>
            <StatusBadge status={clone.status} />
          </div>
          <div>
            <TimestampInfo
              className="font-mono text-xs text-foreground-lighter"
              utcTimestamp={clone.inserted_at ?? ''}
            />
          </div>
        </div>
      )
    } else {
      return (
        <Link
          href={`/project/${clone.target_project.ref}`}
          className="grid grid-cols-4 gap-2 text-sm p-4 group"
        >
          <div className="min-w-24 truncate">{(clone.target_project as any).name}</div>
          <div>
            <StatusBadge status={clone.status} />
          </div>
          <div>
            <TimestampInfo
              className="font-mono text-xs text-foreground-lighter"
              utcTimestamp={clone.inserted_at ?? ''}
            />
          </div>
          <div className="flex items-center justify-end text-foreground-lighter group-hover:text-foreground">
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        </Link>
      )
    }
  }

  if (isFreePlan) {
    return (
      <UpgradeToPro
        buttonText="Upgrade"
        source="backupsRestoreToNewProject"
        primaryText="Restore to a new project requires a pro plan or above."
        secondaryText="To restore to a new project, you need to upgrade to a Pro plan and have physical backups enabled."
      />
    )
  }

  if (isOrioleDb) {
    return (
      <Admonition
        type="default"
        title="Restoring to new projects are not available for OrioleDB"
        description="OrioleDB is currently in public alpha and projects created are strictly ephemeral with no database backups"
      >
        <DocsButton abbrev={false} className="mt-2" href="https://supabase.com/docs" />
      </Admonition>
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
        title="Restore to new project requires physical backups"
        description={
          <>
            Physical backups must be enabled to restore your database to a new project.
            <br /> Find out more about how backups work at supabase{' '}
            <Link
              target="_blank"
              className="underline"
              href="https://supabase.com/docs/guides/platform/backups"
            >
              in our docs
            </Link>
            .
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
          content={`This is a temporary limitation whereby projects that were originally restored from another project cannot be restored to yet another project. 
          If you need to restore from a restored project, please reach out via [support](/support/new?ref=${project?.ref}).`}
        />
        <Button asChild type="default">
          <Link href={`/project/${(cloneStatus?.cloned_from?.source_project as any)?.ref || ''}`}>
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
              <Link href={`/project/${restoringClone?.target_project.ref}`}>Go to new project</Link>
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

export default RestoreToNewProjectPage
