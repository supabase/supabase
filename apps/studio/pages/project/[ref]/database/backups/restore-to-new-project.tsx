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
import { useBackupsQuery } from 'data/database/backups-query'
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
} from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'
import { debounce } from 'lodash'
import generator from 'generate-password-browser'
import { toast } from 'sonner'

const RestoreToNewProjectPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const ref = project?.ref ?? 'default'

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="rtnp" projRef={ref} />
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
    data: backups,
    isLoading: backupsLoading,
    isSuccess: backupsSuccess,
  } = useBackupsQuery(
    { projectRef: project?.ref },
    {
      enabled: !isFreePlan,
    }
  )

  const {
    data,
    error,
    isLoading: cloneBackupsLoading,
    isError,
    isSuccess,
  } = useCloneBackupsQuery(
    {
      projectRef: project?.ref,
    },
    {
      enabled: backupsSuccess && !isFreePlan,
    }
  )

  const plan = subscription?.plan?.id
  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadPhysicalBackups = useCheckPermissions(PermissionAction.READ, 'physical_backups')
  const hasBackups = !!data?.backups.length
  const canTriggerPhysicalBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const dbVersion = getDatabaseMajorVersion(project?.dbVersion ?? '')
  const IS_PG15_OR_ABOVE = dbVersion >= 15
  const PHYSICAL_BACKUPS_ENABLED = project?.is_physical_backups_enabled

  const { data: cloneStatus } = useCloneStatusQuery({ projectRef: project?.ref })
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)

  const isLoading = isPermissionsLoaded && cloneBackupsLoading && backupsLoading

  const { mutate: triggerClone } = useProjectCloneMutation({
    onError: (error) => {
      console.error('error', error)
      toast.error('Failed to restore to new project')
    },
    onSuccess: () => {
      toast.success('Restoration process started')
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
        description={
          <>
            Restore to new project is only available for Postgres 15 and above.
            <br /> Go to{' '}
            <Link className="underline" href={`/project/${project?.ref}/settings/infrastructure`}>
              infrastructure settings
            </Link>{' '}
            to upgrade your database version.
          </>
        }
      />
    )
  }

  if (!PHYSICAL_BACKUPS_ENABLED) {
    return (
      <Admonition
        type="default"
        title="Restore to new project requires physical backups"
        description={
          <>
            Enable physical backups to restore to a new project.
            <br /> Find out more about how backups work at supabase{' '}
            <Link
              target="_blank"
              className="underline"
              href="https://supabase.com/docs/guides/platform/backups"
            >
              in our docs
            </Link>
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

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve backups" />
  }

  if (!isActiveHealthy) {
    return (
      <Admonition
        type="default"
        title="Restore to new project is not available while project is offline"
        description={<>Your project needs to be online to restore your database to a new project</>}
      />
    )
  }

  if (cloneStatus?.status === 'FAILED') {
    return (
      <Admonition
        type="destructive"
        title="Failed to restore to new project"
        description={
          <>
            The new project failed to be created.
            <br />
            <Link className="underline" href={`/support/new?category=dashboard_bug`}>
              Contact support
            </Link>
          </>
        }
      />
    )
  }

  if (cloneStatus?.status === 'COMPLETED') {
    return (
      <Admonition
        type="default"
        title="Restoration completed"
        description={
          <>
            The new project has been created.
            <br />
            <Link className="underline" href={`/project/${cloneStatus?.target.ref}`}>
              Go to new project
            </Link>
          </>
        }
      />
    )
  }

  // if (cloneStatus?.status === 'IN_PROGRESS') {
  //   return (
  //     <Alert_Shadcn_ className="[&>svg]:bg-none! [&>svg]:text-foreground-light">
  //       <Loader2 className="animate-spin" />
  //       <AlertTitle_Shadcn_>Restoration in progress</AlertTitle_Shadcn_>
  //       <AlertDescription_Shadcn_>
  //         The new project is being created.
  //         <br />
  //         <Link className="underline" href={`/project/${cloneStatus?.target.ref}`}>
  //           Go to new project
  //         </Link>
  //       </AlertDescription_Shadcn_>
  //     </Alert_Shadcn_>
  //   )
  // }

  if (!isLoading && backups?.backups.length === 0) {
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
          <DialogSection className="border-t prose pb-6 space-y-4 text-sm">
            <ul className="space-y-2">
              <li>
                Project organization will stay the same: <code>{organization?.name}</code>
              </li>
              <li>
                Project region will stay the same: <code>{project?.region || ''}</code>
              </li>
              <li>
                Each project can only be restored to a new one once. <br />
                <span className="text-foreground-lighter text-xs">
                  This is a temporary limitation, contact us if you need to restore more than once.
                </span>
              </li>
            </ul>
            <ul>
              <li>What will be transferred?</li>
              <ul className="ml-4">
                <li>Database schema (tables, views, procedures)</li>
                <li>All data and indexes</li>
                <li>Database roles and permissions</li>
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
                if (!selectedBackupId) return
                triggerClone({
                  cloneBackupId: selectedBackupId,
                  name: data.name,
                  password: data.password,
                })
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
              <DialogFooter>
                <Button
                  htmlType="reset"
                  type="outline"
                  onClick={() => setShowNewProjectDialog(false)}
                >
                  Cancel
                </Button>
                <Button htmlType="submit">Restore to new project</Button>
              </DialogFooter>
            </form>
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>

      <Panel>
        {data?.backups.length === 0 && <BackupsEmpty />}
        <div className="divide-y">
          {data?.backups.map((backup) => (
            <div className="flex p-4 gap-4" key={backup.id}>
              <div>
                <TimestampInfo value={backup.inserted_at} />
              </div>
              <Badge>{JSON.stringify(backup.status).replaceAll('"', '')}</Badge>
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
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

export default RestoreToNewProjectPage
