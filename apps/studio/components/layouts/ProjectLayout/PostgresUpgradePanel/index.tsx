import { zodResolver } from '@hookform/resolvers/zod'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { DatabaseUpgradeProgress, DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import { useParams } from 'common'
import { PLAN_DETAILS } from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { extractPostgresVersionDetails } from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import {
  ProjectUpgradeTargetVersion,
  useProjectUpgradeEligibilityQuery,
} from 'data/config/project-upgrade-eligibility-query'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'
import {
  useInvalidateProjectDetailsQuery,
  useSetProjectStatus,
} from 'data/projects/project-detail-query'
import { useProjectUpgradeMutation } from 'data/projects/project-upgrade-mutation'
import dayjs from 'dayjs'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { AlertCircle, Check, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'
import { DATABASE_UPGRADE_STEPS } from './UpgradingState.constants'

const formatValue = ({ postgres_version, release_channel }: ProjectUpgradeTargetVersion) => {
  return `${postgres_version}|${release_channel}`
}

const FormSchema = z.object({
  postgresVersionSelection: z.string(),
})

export const PostgresUpgradePanel = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryParams = useSearchParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()
  const { invalidateProjectDetailsQuery } = useInvalidateProjectDetailsQuery()

  const [loading, setLoading] = useState(false)

  // Determine if upgrade is in progress based on project status
  const isUpgradeInProgress = project?.status === PROJECT_STATUS.UPGRADING

  // Disk attributes for right-sizing check
  const planId = org?.plan.id ?? 'free'
  const { data: diskAttributes } = useDiskAttributesQuery({ projectRef: ref })
  const { includedDiskGB: includedDiskGBMeta } = PLAN_DETAILS[planId]
  const includedDiskGB = includedDiskGBMeta[diskAttributes?.attributes.type ?? 'gp3']
  const isDiskSizeUpdated = diskAttributes?.attributes.size_gb !== includedDiskGB

  // Eligibility data for pre-upgrade review
  const { data: eligibilityData } = useProjectUpgradeEligibilityQuery(
    { projectRef: ref },
    { enabled: !isUpgradeInProgress }
  )

  const durationEstimateHours = eligibilityData?.duration_estimate_hours || 1
  // TODO: Remove this mock for production - only for browser testing
  const MOCK_LEGACY_AUTH_CUSTOM_ROLES = true
  const legacyAuthCustomRoles = MOCK_LEGACY_AUTH_CUSTOM_ROLES
    ? ['custom_role_1', 'custom_role_2', 'another_custom_role']
    : eligibilityData?.legacy_auth_custom_roles || []
  // @ts-ignore - potential_breaking_changes exists in API response but not in generated types
  const potentialBreakingChanges: string[] = eligibilityData?.potential_breaking_changes || []

  // Upgrade status for in-progress tracking
  const { data: upgradeStatusData } = useProjectUpgradingStatusQuery(
    {
      projectRef: ref,
      projectStatus: project?.status,
      trackingId: queryParams.get('trackingId'),
    },
    { enabled: IS_PLATFORM && isUpgradeInProgress }
  )

  const { initiated_at, status, progress, target_version, error } =
    upgradeStatusData?.databaseUpgradeStatus ?? {}
  const progressStage = Number((progress || '').split('_')[0])

  // Form for version selection
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      postgresVersionSelection: '',
    },
  })

  // Watch the selected version from the form
  const selectedVersionValue = form.watch('postgresVersionSelection')

  // Get the target version for display - use upgrade status if available, otherwise use selected form value or first eligible version
  const displayTargetVersion =
    target_version ||
    (selectedVersionValue
      ? (() => {
          const selectedVersion = eligibilityData?.target_upgrade_versions?.find(
            (v) => formatValue(v) === selectedVersionValue
          )
          return selectedVersion?.app_version?.split('supabase-postgres-')[1] || ''
        })()
      : eligibilityData?.target_upgrade_versions?.[0]?.app_version?.split(
          'supabase-postgres-'
        )[1] || '')

  const isFailed = status === DatabaseUpgradeStatus.Failed
  const isCompleted = status === DatabaseUpgradeStatus.Upgraded

  const isPerformingFullPhysicalBackup =
    status === DatabaseUpgradeStatus.Upgrading &&
    progress === DatabaseUpgradeProgress.CompletedUpgrade

  const initiatedAtUTC = dayjs.utc(initiated_at ?? 0).format('DD MMM YYYY HH:mm:ss')
  const initiatedAt = dayjs
    .utc(initiated_at ?? 0)
    .local()
    .format('DD MMM YYYY HH:mm:ss (ZZ)')

  useEffect(() => {
    const defaultValue = eligibilityData?.target_upgrade_versions?.[0]
      ? formatValue(eligibilityData.target_upgrade_versions[0])
      : ''
    form.setValue('postgresVersionSelection', defaultValue)
  }, [eligibilityData, form])

  // Mutation for starting upgrade
  const { mutate: upgradeProject, isPending: isUpgrading } = useProjectUpgradeMutation({
    onSuccess: (res, variables) => {
      setProjectStatus({ ref: variables.ref, status: PROJECT_STATUS.UPGRADING })
      toast.success('Upgrading project')
      router.push(`/project/${variables.ref}?upgrade=true&trackingId=${res.tracking_id}`)
    },
    onError: (error) => {
      toast.error(`Failed to start upgrade: ${error.message}`)
    },
  })

  const onConfirmUpgrade = async (values: z.infer<typeof FormSchema>) => {
    if (!ref) return toast.error('Project ref not found')

    const { postgresVersionSelection } = values

    const versionDetails = extractPostgresVersionDetails(postgresVersionSelection)
    if (!versionDetails) return toast.error('Invalid Postgres version')
    if (!versionDetails.postgresEngine) return toast.error('Missing target version')

    upgradeProject({
      ref,
      target_version: versionDetails.postgresEngine,
      release_channel: versionDetails.releaseChannel,
    })
  }

  const refetchProjectDetails = async () => {
    setLoading(true)
    if (ref) await invalidateProjectDetailsQuery(ref)
  }

  const handleCancel = () => {
    router.push(`/project/${ref}/settings/infrastructure`)
  }

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiated_at}%0A• Target Version: ${target_version}%0A• Error: ${error}`

  // Render the upgrade steps list
  const renderUpgradeSteps = (showProgress: boolean) => (
    <Card>
      {/* <div className="transition-all overflow-hidden border rounded relative"> */}
      <Table>
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead>Step</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="justify-end">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DATABASE_UPGRADE_STEPS.map((step, idx: number) => {
            const isCurrentStep = showProgress && step.key === progress
            const isCompletedStep = showProgress && progressStage > idx
            return (
              <TableRow
                key={step.key}
                className={cn(
                  isCurrentStep
                    ? 'bg-surface-75'
                    : isCompletedStep
                      ? 'bg-surface-200/50'
                      : 'bg-inherit'
                )}
              >
                <TableCell className="border-r border-border w-10">
                  {isCurrentStep ? (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full">
                      <Loader2 size={20} className="animate-spin text-brand-link" strokeWidth={2} />
                    </div>
                  ) : isCompletedStep ? (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 dark:bg-brand">
                      <Check size={12} className="text-contrast" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-5 h-5 border rounded-full bg-overlay-hover" />
                  )}
                </TableCell>
                <TableCell>
                  <p
                    className={`text-sm ${
                      isCurrentStep
                        ? 'text-foreground'
                        : isCompletedStep
                          ? 'text-foreground-muted line-through'
                          : 'text-foreground-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                </TableCell>
                <TableCell className="justify-end">
                  {step.offline && (
                    <p className="text-sm text-foreground-muted text-right">
                      Project will be offline
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )

  return (
    <div className="w-full mx-auto my-16 space-y-16 max-w-7xl">
      <div className="mx-6 space-y-16">
        {/* Intro */}
        <header className="flex flex-col space-y-4">
          <p className="text-xs uppercase font-mono text-foreground-lighter tracking-wide">
            Upgrade
          </p>
          <h1>New Postgres version available</h1>
          <p className="text-base text-foreground-light text-balance">
            Postgres version{' '}
            <strong className="text-foreground font-medium">{displayTargetVersion}</strong> is now
            available for the project{' '}
            <strong className="text-foreground font-medium">{project?.name}</strong>. Supabase can
            upgrade your project to this version on your behalf. Here's what's involved.
          </p>
        </header>
        {/* Container for the upgrade steps */}
        <div className="w-full mx-auto mt-8 mb-16 max-w-7xl">
          <div>
            {isCompleted ? (
              <div className="grid gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <CheckCircle className="text-brand-link" size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">Upgrade completed!</p>
                  <p className="mt-4 text-center text-sm text-foreground-light w-[300px] mx-auto">
                    Your project has been successfully upgraded to Postgres {target_version} and is
                    now back online.
                  </p>
                </div>
                <div className="mx-auto">
                  <Button loading={loading} disabled={loading} onClick={refetchProjectDetails}>
                    Return to project
                  </Button>
                </div>
              </div>
            ) : isFailed ? (
              <div className="grid gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <AlertCircle className="text-amber-900" size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">We ran into an issue while upgrading your project</p>
                  <p className="mt-4 text-center text-sm text-foreground-light w-full md:w-[450px] mx-auto">
                    Your project is back online and its data is not affected. Please reach out to us
                    via our support form for assistance with the upgrade.
                  </p>
                </div>
                <div className="flex items-center mx-auto space-x-2">
                  <Button asChild type="default">
                    <SupportLink
                      queryParams={{
                        category: SupportCategories.DATABASE_UNRESPONSIVE,
                        projectRef: ref,
                        subject,
                        message,
                      }}
                    >
                      Contact support
                    </SupportLink>
                  </Button>
                  <Button loading={loading} disabled={loading} onClick={refetchProjectDetails}>
                    Return to project
                  </Button>
                </div>
              </div>
            ) : isUpgradeInProgress ? (
              <div className="grid w-[480px] gap-4">
                <div className="space-y-2">
                  {isPerformingFullPhysicalBackup ? (
                    <div>
                      <p className="text-center">Performing a full backup</p>
                      <p className="text-sm text-center text-foreground-light">
                        Upgrade is now complete, and your project is online. A full backup is now
                        being performed to ensure that there is a proper base backup available
                        post-upgrade. This can take from a few minutes up to several hours depending
                        on the size of your database.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-center">Upgrading in progress</p>
                      <p className="text-sm text-center text-foreground-light">
                        Upgrades can take from a few minutes up to several hours depending on the
                        size of your database. Your project will be offline while it is being
                        upgraded.
                      </p>
                    </div>
                  )}

                  <h3 className="text-lg">Steps we’re taking</h3>
                  {renderUpgradeSteps(true)}

                  {initiated_at !== undefined && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="block w-full text-center">
                          <p className="text-sm text-center text-foreground-light">
                            Upgrade began at {initiatedAtUTC} (UTC)
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-center">
                        {initiatedAt}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ) : (
              // Pre-upgrade review state
              <div className="grid w-full max-w-xl gap-6">
                <Form_Shadcn_ {...form}>
                  <form onSubmit={form.handleSubmit(onConfirmUpgrade)} className="space-y-6">
                    <div>
                      <h3 className="text-lg">Steps we’ll take</h3>
                      {renderUpgradeSteps(false)}
                    </div>

                    {/* Warnings */}
                    <section className="flex flex-col gap-4">
                      <Admonition
                        type="warning"
                        title={`Your project will be offline for up to ${durationEstimateHours} hour${durationEstimateHours === 1 ? '' : 's'}`}
                        description="Choose a time when the impact to your project will be minimal. This upgrade is permanent and cannot be reversed."
                      />
                      {/* isDiskSizeUpdated */}
                      {true && (
                        <Admonition
                          type="note"
                          title="Your project’s disk size will be right-sized"
                          description={
                            <>
                              Supabase will right-size your project’s disk size with the upgrade.
                              Your project’s current disk size is{' '}
                              <strong className="text-foreground font-medium">
                                {diskAttributes?.attributes.size_gb} GB
                              </strong>
                              .
                            </>
                          }
                          actions={
                            <Button size="tiny" type="default" asChild>
                              <Link
                                href={`${DOCS_URL}/guides/platform/upgrading#disk-sizing`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Learn more
                              </Link>
                            </Button>
                          }
                        />
                      )}

                      {potentialBreakingChanges.length > 0 && (
                        <Admonition
                          type="destructive"
                          title="Breaking changes"
                          description="Your project will be upgraded across major versions of Postgres. This may involve breaking changes."
                          actions={
                            <Button size="tiny" type="default" asChild>
                              <Link
                                href={`${DOCS_URL}/guides/platform/migrating-and-upgrading-projects#caveats`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Learn more
                              </Link>
                            </Button>
                          }
                        />
                      )}

                      {true && (
                        <Admonition
                          type="warning"
                          title="Custom Postgres roles will not automatically work after upgrade"
                          description={
                            <>
                              <p>
                                New Postgres versions use{' '}
                                <code className="text-code-inline">scram-sha-256</code>{' '}
                                authentication by default and do not support{' '}
                                <code className="text-code-inline">md5</code>, as it has been
                                deprecated.
                              </p>

                              <p>Note the following commands and run them after upgrading:</p>

                              <CodeBlock
                                language="sql"
                                spellCheck={false}
                                hideLineNumbers
                                hideCopy
                                value={legacyAuthCustomRoles
                                  .map((role) => `ALTER ROLE ${role} WITH PASSWORD 'newpassword';`)
                                  .join('\n')}
                                className="mt-3"
                              />
                            </>
                          }
                          actions={
                            <Button size="tiny" type="default" asChild>
                              <Link
                                href={`${DOCS_URL}/guides/platform/migrating-and-upgrading-projects#caveats`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Learn more
                              </Link>
                            </Button>
                          }
                        />
                      )}
                    </section>

                    <div className="flex flex-row gap-4 justify-between">
                      <FormField_Shadcn_
                        control={form.control}
                        name="postgresVersionSelection"
                        render={({ field }) => (
                          <FormItemLayout>
                            <FormControl_Shadcn_>
                              <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger_Shadcn_ size="tiny" className="w-full">
                                  <div className="flex gap-1 items-center w-full">
                                    <p className="text-foreground-lighter">Postgres version</p>
                                    <SelectValue_Shadcn_ placeholder="Select a version">
                                      {field.value
                                        ? (() => {
                                            const selectedVersion =
                                              eligibilityData?.target_upgrade_versions?.find(
                                                (v) => formatValue(v) === field.value
                                              )
                                            return selectedVersion
                                              ? selectedVersion.app_version.split(
                                                  'supabase-postgres-'
                                                )[1]
                                              : null
                                          })()
                                        : null}
                                    </SelectValue_Shadcn_>
                                  </div>
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectGroup_Shadcn_>
                                    {(eligibilityData?.target_upgrade_versions || [])?.map(
                                      (value) => {
                                        const postgresVersion =
                                          value.app_version.split('supabase-postgres-')[1]
                                        return (
                                          <SelectItem_Shadcn_
                                            key={formatValue(value)}
                                            value={formatValue(value)}
                                            className="w-full [&>:nth-child(2)]:w-full"
                                          >
                                            <div className="flex flex-row items-center justify-between w-full gap-3">
                                              <span className="text-foreground">
                                                {postgresVersion}
                                              </span>
                                              {value.release_channel !== 'ga' && (
                                                <Badge variant="warning">
                                                  {value.release_channel}
                                                </Badge>
                                              )}
                                            </div>
                                          </SelectItem_Shadcn_>
                                        )
                                      }
                                    )}
                                  </SelectGroup_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />

                      <div className="flex items-center justify-end space-x-2">
                        <Button type="default" onClick={handleCancel} disabled={isUpgrading}>
                          Cancel
                        </Button>
                        <Button htmlType="submit" disabled={isUpgrading} loading={isUpgrading}>
                          Confirm upgrade
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form_Shadcn_>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
