import { zodResolver } from '@hookform/resolvers/zod'
import { extractPostgresVersionDetails } from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { useSetProjectStatus } from 'data/projects/project-detail-query'
import { useProjectUpgradeMutation } from 'data/projects/project-upgrade-mutation'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
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
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'
import { UpgradeStepsTable } from '../UpgradeStepsTable'
import { UPGRADE_STATE_CONTENT, WaitingStateProps } from '../types'

const FormSchema = z.object({
  postgresVersionSelection: z.string(),
})

const formatValue = (version: { postgres_version: number; release_channel: string }) => {
  return `${version.postgres_version}|${version.release_channel}`
}

export const WaitingState = ({
  projectRef,
  projectName,
  displayTargetVersion,
  eligibilityData,
  diskAttributes,
  isDiskSizeUpdated,
  onCancel,
}: WaitingStateProps) => {
  const router = useRouter()
  const { setProjectStatus } = useSetProjectStatus()

  const durationEstimateHours = eligibilityData?.duration_estimate_hours || 1
  // TODO: Remove this mock for production - only for browser testing
  const MOCK_LEGACY_AUTH_CUSTOM_ROLES = true
  const legacyAuthCustomRoles = MOCK_LEGACY_AUTH_CUSTOM_ROLES
    ? ['custom_role_1', 'custom_role_2', 'another_custom_role']
    : eligibilityData?.legacy_auth_custom_roles || []
  const potentialBreakingChanges: string[] = eligibilityData?.potential_breaking_changes || []

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      postgresVersionSelection: '',
    },
  })

  useEffect(() => {
    const defaultValue = eligibilityData?.target_upgrade_versions?.[0]
      ? formatValue(eligibilityData.target_upgrade_versions[0])
      : ''
    form.setValue('postgresVersionSelection', defaultValue)
  }, [eligibilityData, form])

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
    if (!projectRef) return toast.error('Project ref not found')

    const { postgresVersionSelection } = values

    const versionDetails = extractPostgresVersionDetails(postgresVersionSelection)
    if (!versionDetails) return toast.error('Invalid Postgres version')
    if (!versionDetails.postgresEngine) return toast.error('Missing target version')

    upgradeProject({
      ref: projectRef,
      target_version: versionDetails.postgresEngine,
      release_channel: versionDetails.releaseChannel,
    })
  }

  const content = UPGRADE_STATE_CONTENT.waiting
  const hasLegacyAuthCustomRoles = legacyAuthCustomRoles.length > 0
  const hasBreakingChanges = potentialBreakingChanges.length > 0

  return (
    <div className="flex flex-col gap-y-4">
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onConfirmUpgrade)} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg">{content.stepsHeading}</h3>
            <UpgradeStepsTable showProgress={false} />
          </div>

          {/* Warnings */}
          <section className="flex flex-col gap-4">
            <Admonition
              type="warning"
              title={`Your project will be offline for up to ${durationEstimateHours} hour${durationEstimateHours === 1 ? '' : 's'}`}
              description="Choose a time when the impact to your project will be minimal. This upgrade is permanent and cannot be reversed."
            />

            {isDiskSizeUpdated && (
              <Admonition
                type="note"
                title="Your project's disk size will be right-sized"
                description={
                  <>
                    Supabase will right-size your project's disk size with the upgrade. Your
                    project's current disk size is{' '}
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

            {hasBreakingChanges && (
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

            {hasLegacyAuthCustomRoles && (
              <Admonition
                type="warning"
                title="Custom Postgres roles will not automatically work after upgrade"
                description={
                  <>
                    <p>
                      New Postgres versions use{' '}
                      <code className="text-code-inline">scram-sha-256</code> authentication by
                      default and do not support <code className="text-code-inline">md5</code>, as
                      it has been deprecated.
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
                                    ? selectedVersion.app_version.split('supabase-postgres-')[1]
                                    : null
                                })()
                              : null}
                          </SelectValue_Shadcn_>
                        </div>
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          {(eligibilityData?.target_upgrade_versions || [])?.map((value) => {
                            const postgresVersion = value.app_version.split('supabase-postgres-')[1]
                            return (
                              <SelectItem_Shadcn_
                                key={formatValue(value)}
                                value={formatValue(value)}
                                className="w-full [&>:nth-child(2)]:w-full"
                              >
                                <div className="flex flex-row items-center justify-between w-full gap-3">
                                  <span className="text-foreground">{postgresVersion}</span>
                                  {value.release_channel !== 'ga' && (
                                    <Badge variant="warning">{value.release_channel}</Badge>
                                  )}
                                </div>
                              </SelectItem_Shadcn_>
                            )
                          })}
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <div className="flex items-center justify-end space-x-2">
              <Button type="default" onClick={onCancel} disabled={isUpgrading}>
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
  )
}
