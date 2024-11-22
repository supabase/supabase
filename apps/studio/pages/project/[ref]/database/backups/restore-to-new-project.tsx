import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import BackupsEmpty from 'components/interfaces/Database/Backups/BackupsEmpty'

import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectCloneMutation } from 'data/projects/clone-mutation'
import { useCloneBackupsQuery } from 'data/projects/clone-query'
import { useCloneStatusQuery } from 'data/projects/clone-status-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { PROJECT_STATUS } from 'lib/constants'
import { getDatabaseMajorVersion, passwordStrength } from 'lib/helpers'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogSection,
  Input,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
} from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'
import { debounce } from 'lodash'
import generator from 'generate-password-browser'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PITRForm } from 'components/interfaces/Database/Backups/PITR/pitr-form'
import { instanceSizeSpecs } from 'data/projects/new-project.constants'
import { Markdown } from 'components/interfaces/Markdown'

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
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

const RestoreToNewProject = () => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const isFreePlan = subscription?.plan?.id === 'free'

  const {
    data: cloneBackups,
    error,
    isLoading: cloneBackupsLoading,
    isError,
  } = useCloneBackupsQuery(
    {
      projectRef: project?.ref,
    },
    {
      enabled: !isFreePlan,
    }
  )

  const plan = subscription?.plan?.id
  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadPhysicalBackups = useCheckPermissions(PermissionAction.READ, 'physical_backups')
  const canTriggerPhysicalBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )
  const hasPITREnabled = cloneBackups?.pitr_enabled

  const dbVersion = getDatabaseMajorVersion(project?.dbVersion ?? '')
  const IS_PG15_OR_ABOVE = dbVersion >= 15
  const PHYSICAL_BACKUPS_ENABLED = project?.is_physical_backups_enabled

  const {
    data: cloneStatus,
    refetch: refetchCloneStatus,
    isLoading: cloneStatusLoading,
  } = useCloneStatusQuery({
    projectRef: project?.ref,
  })
  const lastClone = cloneStatus?.clones?.[cloneStatus?.clones.length - 1]
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [recoveryTimeTarget, setRecoveryTimeTarget] = useState<number | null>(null)
  const IS_CLONED_PROJECT = (cloneStatus?.cloned_from?.source_project as any)?.ref ? true : false

  const isLoading = !isPermissionsLoaded || cloneBackupsLoading || cloneStatusLoading

  /**
   * New project will have the same compute size and disk size as the original project
   */
  function getAdditionalMonthlySpend() {
    const currentProjectComputeSize = project?.infra_compute_size
    if (!currentProjectComputeSize) {
      return null
    }

    if (currentProjectComputeSize === 'nano') {
      return null
    }

    const additionalMonthlySpend = instanceSizeSpecs[currentProjectComputeSize]

    return additionalMonthlySpend
  }

  const { mutate: triggerClone, isLoading: cloneMutationLoading } = useProjectCloneMutation({
    onError: (error) => {
      console.error('error', error)
      toast.error('Failed to restore to new project')
    },
    onSuccess: () => {
      toast.success('Restoration process started')
      refetchCloneStatus()
      setShowNewProjectDialog(false)
    },
  })

  const FormSchema = z.object({
    name: z.string().min(1),
    password: z.string().min(1),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      password: '',
    },
  })

  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')

  const delayedCheckPasswordStrength = useRef(
    debounce((value: string) => checkPasswordStrength(value), 300)
  ).current

  async function checkPasswordStrength(value: string) {
    const { message, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthMessage(message)
  }

  function generateStrongPassword() {
    const password = generator.generate({
      length: 16,
      numbers: true,
      uppercase: true,
    })

    form.setValue('password', password)
    delayedCheckPasswordStrength(password)
  }

  function AdditionalMonthlySpend() {
    const additionalMonthlySpend = getAdditionalMonthlySpend()
    if (!additionalMonthlySpend) {
      return null
    }

    return (
      <div className="text-sm text-foreground-lighter border-t p-5">
        <p>
          The new project will have the same compute size and disk size as this project. You will be
          able to update the compute size and disk size after the new project is created in{' '}
          <span className="font-mono text-xs tracking-tighter text-foreground-light">
            Project Settings &gt; Compute and Disk
          </span>
        </p>
        <div className="flex justify-between text-foreground mt-2">
          <p>Additional Monthly Compute + Disk Cost</p>
          <p className="font-mono text-right text-brand">${additionalMonthlySpend.priceMonthly}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <GenericSkeletonLoader />
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

  if (plan === 'free') {
    return (
      <UpgradeToPro
        buttonText="Upgrade"
        primaryText="Restore to a new project requires a pro plan or above."
        secondaryText={
          'To restore to a new project, you need to upgrade to a Pro plan and have physical backups enabled.'
        }
      />
    )
  }

  if (IS_CLONED_PROJECT) {
    return (
      <Admonition type="default" title={`This project cannot be restored to a new project`}>
        <Markdown
          content={`This project was originally restored from another project. This is a temporary limitation. Please [contact us](/support/new?ref=${project?.ref}) if you need to restore a project to multiple other projects.  
            [Go to original project](/dashboard/project/${(cloneStatus?.cloned_from?.source_project as any)?.ref || ''})`}
        />
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

  if (lastClone?.status === 'FAILED') {
    return (
      <Admonition type="destructive" title="Failed to restore to new project">
        <Markdown
          content="The new project failed to be created.  
            [Contact support](/support/new?category=dashboard_bug)"
        />
      </Admonition>
    )
  }

  if (lastClone?.status === 'COMPLETED') {
    return (
      <Admonition type="default" title="Restoration completed">
        <Markdown
          content={`The new project has been created. A project can only be restored to another project once.
            [Go to new project](/project/${lastClone?.target_project.ref})
          `}
        />
      </Admonition>
    )
  }

  if (lastClone?.status === 'IN_PROGRESS') {
    return (
      <Alert_Shadcn_ className="[&>svg]:bg-none! [&>svg]:text-foreground-light">
        <Loader2 className="animate-spin" />
        <AlertTitle_Shadcn_>Restoration in progress</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          The new project is being created.
          <br />
          <Link className="underline" href={`/project/${lastClone?.target_project.ref}`}>
            Go to new project
          </Link>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  if (
    !isLoading &&
    hasPITREnabled &&
    !cloneBackups?.physicalBackupData.earliestPhysicalBackupDateUnix
  ) {
    return (
      <Admonition
        type="default"
        title="No backups found"
        description={'PITR is enabled, but no backups were found. Check again in a few minutes.'}
      />
    )
  }

  if (!isLoading && !hasPITREnabled && cloneBackups?.backups.length === 0) {
    return <BackupsEmpty />
  }

  return (
    <>
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent>
          <DialogHeader className="border-b">
            <DialogTitle>Confirm restore to a new project</DialogTitle>
            <DialogDescription>
              This process will create a new project and restore your database to it.
            </DialogDescription>
          </DialogHeader>
          <DialogSection className="prose pb-6 space-y-4 text-sm">
            <ul className="space-y-2">
              <li>
                Project organization will stay the same: <code>{organization?.name}</code>
              </li>
              <li>
                Project region will stay the same: <code>{project?.region || ''}</code>
              </li>
              <li>
                A project can only be restored to another project once. <br />
                <span className="text-foreground-lighter text-xs">
                  This is a temporary limitation. Please contact us if you need to restore a project
                  to multiple other projects.
                </span>
              </li>
            </ul>
            <ul>
              <li>What will be transferred?</li>
              <ul className="ml-4">
                <li>Database schema (tables, views, procedures)</li>
                <li>All data and indexes</li>
                <li>Database roles, permissions and users</li>
              </ul>
            </ul>
            <ul>
              <li>What needs manual reconfiguration?</li>
              <ul className="ml-4">
                <li>Storage objects & settings</li>
                <li>Edge Functions</li>
                <li>Auth settings & API keys</li>
                <li>Realtime settings</li>
                <li>Database extensions and settings</li>
                <li>Read replicas</li>
              </ul>
            </ul>
          </DialogSection>
          <AdditionalMonthlySpend />
          <DialogFooter>
            <Button type="outline" onClick={() => setShowConfirmationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmationDialog(false)
                setShowNewProjectDialog(true)
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader className="border-b">
            <DialogTitle>Create new project</DialogTitle>
            <DialogDescription>
              This process will create a new project and restore your database to it.
            </DialogDescription>
          </DialogHeader>
          <Form_Shadcn_ {...form}>
            <form
              id={'create-new-project-form'}
              onSubmit={form.handleSubmit((data) => {
                if (!project?.ref) {
                  toast.error('Project ref is required')
                  return
                }

                if (hasPITREnabled && recoveryTimeTarget) {
                  triggerClone({
                    projectRef: project?.ref,
                    newProjectName: data.name,
                    newDbPass: data.password,
                    recoveryTimeTarget: recoveryTimeTarget,
                    cloneBackupId: undefined,
                  })
                } else if (selectedBackupId) {
                  triggerClone({
                    projectRef: project?.ref,
                    cloneBackupId: selectedBackupId,
                    newProjectName: data.name,
                    newDbPass: data.password,
                    recoveryTimeTarget: undefined,
                  })
                } else {
                  toast.error('No backup or point in time selected')
                  return
                }
              })}
            >
              <DialogSection className="pb-6 space-y-4 text-sm">
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout label="New Project Name">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="Enter a name" type="text" {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItemLayout>
                      <FormControl_Shadcn_>
                        <Input
                          id="db-password"
                          label="Database Password"
                          type="password"
                          placeholder="Type in a strong password"
                          value={field.value}
                          copy={field.value?.length > 0}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value)
                            if (value == '') {
                              setPasswordStrengthScore(-1)
                              setPasswordStrengthMessage('')
                            } else delayedCheckPasswordStrength(value)
                          }}
                          descriptionText={
                            <PasswordStrengthBar
                              passwordStrengthScore={passwordStrengthScore}
                              password={field.value}
                              passwordStrengthMessage={passwordStrengthMessage}
                              generateStrongPassword={generateStrongPassword}
                            />
                          }
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </DialogSection>
              <AdditionalMonthlySpend />
              <DialogFooter>
                <Button
                  htmlType="reset"
                  type="outline"
                  onClick={() => setShowNewProjectDialog(false)}
                >
                  Cancel
                </Button>
                <Button htmlType="submit" loading={cloneMutationLoading}>
                  Restore to new project
                </Button>
              </DialogFooter>
            </form>
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>
      {hasPITREnabled ? (
        <>
          <PITRForm
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
        <>
          <Panel>
            {cloneBackups?.backups.length === 0 ? (
              <>
                <BackupsEmpty />
              </>
            ) : (
              <div className="divide-y">
                {/* <pre>{JSON.stringify({ cloneStatus }, null, 2)}</pre> */}
                {cloneBackups?.backups.map((backup) => {
                  if (!backup.isPhysicalBackup) return null
                  return (
                    <div className="flex p-4 gap-4" key={backup.id}>
                      <div>
                        <TimestampInfo value={backup.inserted_at} />
                      </div>
                      <Badge>{JSON.stringify(backup.status).replaceAll('"', '')}</Badge>
                      {(backup.status as any) === 'COMPLETED' && (
                        <Button
                          className="ml-auto"
                          type="outline"
                          onClick={() => {
                            setSelectedBackupId(backup.id)
                            setShowConfirmationDialog(true)
                          }}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </>
      )}
    </>
  )
}

export default RestoreToNewProjectPage
