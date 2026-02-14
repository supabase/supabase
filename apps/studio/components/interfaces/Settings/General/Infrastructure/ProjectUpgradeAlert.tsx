import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useFlag, useParams } from 'common'
import { PLAN_DETAILS } from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { Markdown } from 'components/interfaces/Markdown'
import { extractPostgresVersionDetails } from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import {
  ProjectUpgradeTargetVersion,
  useProjectUpgradeEligibilityQuery,
} from 'data/config/project-upgrade-eligibility-query'
import { useSetProjectStatus } from 'data/projects/project-detail-query'
import { useProjectUpgradeMutation } from 'data/projects/project-upgrade-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Modal,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const formatValue = ({ postgres_version, release_channel }: ProjectUpgradeTargetVersion) => {
  return `${postgres_version}|${release_channel}`
}

export const ProjectUpgradeAlert = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const projectUpgradeDisabled = useFlag('disableProjectUpgrade')

  const planId = org?.plan.id ?? 'free'

  const { data: diskAttributes } = useDiskAttributesQuery({ projectRef: ref })
  const { includedDiskGB: includedDiskGBMeta } = PLAN_DETAILS[planId]
  const includedDiskGB = includedDiskGBMeta[diskAttributes?.attributes.type ?? 'gp3']
  const isDiskSizeUpdated = diskAttributes?.attributes.size_gb !== includedDiskGB

  const { data } = useProjectUpgradeEligibilityQuery({ projectRef: ref })
  const currentPgVersion = (data?.current_app_version ?? '').split('supabase-postgres-')[1]
  const latestPgVersion = (data?.latest_app_version ?? '').split('supabase-postgres-')[1]

  const durationEstimateHours = data?.duration_estimate_hours || 1
  const legacyAuthCustomRoles = data?.legacy_auth_custom_roles || []

  const { mutate: upgradeProject, isPending: isUpgrading } = useProjectUpgradeMutation({
    onSuccess: (res, variables) => {
      setProjectStatus({ ref: variables.ref, status: PROJECT_STATUS.UPGRADING })
      toast.success('Upgrading project')
      router.push(`/project/${variables.ref}?upgradeInitiated=true&trackingId=${res.tracking_id}`)
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

  const FormSchema = z.object({
    postgresVersionSelection: z.string(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      postgresVersionSelection: '',
    },
  })

  useEffect(() => {
    const defaultValue = data?.target_upgrade_versions?.[0]
      ? formatValue(data.target_upgrade_versions[0])
      : ''
    form.setValue('postgresVersionSelection', defaultValue)
  }, [data, form])

  return (
    <>
      <Alert_Shadcn_ title="Your project can be upgraded to the latest version of Postgres">
        <AlertTitle_Shadcn_>
          Your project can be upgraded to the latest version of Postgres
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          <p>The latest version of Postgres ({latestPgVersion}) is available for your project.</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="tiny"
                type="primary"
                className="mt-2"
                onClick={() => setShowUpgradeModal(true)}
                disabled={projectUpgradeDisabled}
              >
                Upgrade project
              </Button>
            </TooltipTrigger>
            {projectUpgradeDisabled && (
              <TooltipContent side="bottom" align="center">
                Project upgrade is currently disabled
              </TooltipContent>
            )}
          </Tooltip>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>

      <Modal
        hideFooter
        size="small"
        visible={showUpgradeModal}
        onCancel={() => setShowUpgradeModal(false)}
        header="Confirm to upgrade Postgres version"
      >
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onConfirmUpgrade)}>
            <Admonition
              type="warning"
              className="border-x-0 border-t-0 rounded-none"
              title={`Your project will be offline for up to ${durationEstimateHours} hour${durationEstimateHours === 1 ? '' : 's'}`}
              description="It is advised to upgrade at a time when there will be minimal impact for your application."
            />
            <Modal.Content>
              <div className="space-y-4">
                <p className="text-sm">
                  All services will be offline and you will not be able to downgrade back to
                  Postgres {currentPgVersion}.
                </p>
                {isDiskSizeUpdated && (
                  <Markdown
                    extLinks
                    className="text-foreground"
                    content={`Your current disk size of ${diskAttributes?.attributes.size_gb}GB will also be
                    [right-sized](${DOCS_URL}/guides/platform/upgrading#disk-sizing) with the upgrade.`}
                  />
                )}
                {/* @ts-ignore */}
                {(data?.potential_breaking_changes ?? []).length > 0 && (
                  <Alert_Shadcn_ variant="destructive" title="Breaking changes">
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                    <AlertTitle_Shadcn_>Breaking changes</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                      <p>
                        Your project will be upgraded across major versions of Postgres. This may
                        involve breaking changes.
                      </p>

                      <div>
                        <Button size="tiny" type="default" asChild>
                          <Link
                            href={`${DOCS_URL}/guides/platform/migrating-and-upgrading-projects#caveats`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View docs
                          </Link>
                        </Button>
                      </div>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
                {legacyAuthCustomRoles.length > 0 && (
                  <Alert_Shadcn_
                    variant="warning"
                    title="Custom Postgres roles using md5 authentication have been detected"
                  >
                    <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                    <AlertTitle_Shadcn_>
                      Custom Postgres roles will not work automatically after upgrade
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                      <p>You must run a series of commands after upgrading.</p>
                      <p>
                        This is because new Postgres versions use scram-sha-256 authentication by
                        default and do not support md5, as it has been deprecated.
                      </p>
                      <div>
                        <p className="mb-1">Run the following commands after the upgrade:</p>
                        <div className="flex items-baseline gap-2">
                          <code className="text-xs">
                            {legacyAuthCustomRoles.map((role) => (
                              <div key={role} className="pb-1">
                                ALTER ROLE <span className="text-brand">{role}</span> WITH PASSWORD
                                '<span className="text-brand">newpassword</span>';
                              </div>
                            ))}
                          </code>
                        </div>
                      </div>
                      <div>
                        <Button size="tiny" type="default" asChild>
                          <Link
                            href={`${DOCS_URL}/guides/platform/migrating-and-upgrading-projects#caveats`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View docs
                          </Link>
                        </Button>
                      </div>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
                <FormField_Shadcn_
                  control={form.control}
                  name="postgresVersionSelection"
                  render={({ field }) => (
                    <FormItemLayout label="Select the version of Postgres to upgrade to">
                      <FormControl_Shadcn_>
                        <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select a Postgres version" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              {(data?.target_upgrade_versions || [])?.map((value) => {
                                const postgresVersion =
                                  value.app_version.split('supabase-postgres-')[1]
                                return (
                                  <SelectItem_Shadcn_
                                    key={formatValue(value)}
                                    value={formatValue(value)}
                                  >
                                    <div className="flex items-center gap-3">
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
              </div>
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="flex items-center space-x-2 justify-end">
              <Button
                type="default"
                onClick={() => setShowUpgradeModal(false)}
                disabled={isUpgrading}
              >
                Cancel
              </Button>
              <Button htmlType="submit" disabled={isUpgrading} loading={isUpgrading}>
                Confirm upgrade
              </Button>
            </Modal.Content>
          </form>
        </Form_Shadcn_>
      </Modal>
    </>
  )
}
