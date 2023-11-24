import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  IconAlertCircle,
  IconAlertTriangle,
  Listbox,
  Modal,
} from 'ui'

import { useParams } from 'common/hooks'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { useProjectUpgradeMutation } from 'data/projects/project-upgrade-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'

const ProjectUpgradeAlert = () => {
  const router = useRouter()
  const { ui } = useStore()
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const formId = 'project-upgrade-form'
  const { data } = useProjectUpgradeEligibilityQuery({ projectRef: ref })
  const currentPgVersion = (data?.current_app_version ?? '').split('supabase-postgres-')[1]
  const latestPgVersion = (data?.latest_app_version ?? '').split('supabase-postgres-')[1]

  const durationEstimateHours = data?.duration_estimate_hours || 1
  const legacyAuthCustomRoles = data?.legacy_auth_custom_roles || []

  const initialValues = { version: data?.target_upgrade_versions?.[0]?.postgres_version ?? 0 }
  const { mutate: upgradeProject, isLoading: isUpgrading } = useProjectUpgradeMutation({
    onSuccess: (res, variables) => {
      setProjectStatus(queryClient, variables.ref, PROJECT_STATUS.UPGRADING)
      ui.setNotification({ category: 'success', message: 'Upgrading project' })
      router.push(`/project/${variables.ref}?upgradeInitiated=true`)
    },
  })

  const onConfirmUpgrade = async (values: any) => {
    if (!ref) return ui.setNotification({ category: 'error', message: 'Project ref not found' })
    upgradeProject({ ref, target_version: values.version })
  }

  return (
    <>
      <Alert_Shadcn_ title="Your project can be upgraded to the latest version of Postgres">
        <AlertTitle_Shadcn_>
          Your project can be upgraded to the latest version of Postgres
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          <p className="mb-3">
            The latest version of Postgres ({latestPgVersion}) is available for your project.
          </p>
          <Button size="tiny" type="primary" onClick={() => setShowUpgradeModal(true)}>
            Upgrade project
          </Button>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      <Modal
        hideFooter
        visible={showUpgradeModal}
        onCancel={() => setShowUpgradeModal(false)}
        header={<h3>Upgrade Postgres</h3>}
      >
        <Form id={formId} initialValues={initialValues} onSubmit={onConfirmUpgrade}>
          {({ values }: { values: any }) => {
            const selectedVersion = (data?.target_upgrade_versions ?? []).find(
              (x) => x.postgres_version === values.version
            )

            return (
              <>
                <div className="py-6">
                  <Modal.Content>
                    <div className="space-y-4">
                      <p className="text-sm">All services are going offline.</p>
                      <p className="text-sm">
                        You will not be able to downgrade back to Postgres {currentPgVersion}.
                      </p>
                      <Alert_Shadcn_ title="Your project will be offline while the upgrade is in progress">
                        <IconAlertCircle className="h-4 w-4" strokeWidth={2} />
                        <AlertTitle_Shadcn_>
                          Your project will be offline for up to {durationEstimateHours} hour
                          {durationEstimateHours === 1 ? '' : 's'}
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          <p>
                            It is advised to upgrade at a time when there will be minimal impact for
                            your application.
                          </p>
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                      {(data?.potential_breaking_changes ?? []).length > 0 && (
                        <Alert_Shadcn_ variant="destructive" title="Breaking changes">
                          <IconAlertCircle className="h-4 w-4" strokeWidth={2} />
                          <AlertTitle_Shadcn_>Breaking changes</AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                            <p>
                              Your project will be upgraded across major versions of Postgres. This
                              may involve breaking changes.
                            </p>

                            <div>
                              <Button size="tiny" type="default" asChild>
                                <Link
                                  href="https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#caveats"
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
                          <IconAlertTriangle className="h-4 w-4" strokeWidth={2} />
                          <AlertTitle_Shadcn_>
                            Custom Postgres roles will not work automatically after upgrade
                          </AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                            <p>You must run a series of commands after upgrading.</p>
                            <p>
                              This is because new Postgres versions use scram-sha-256 authentication
                              by default and do not support md5, as it has been deprecated.
                            </p>
                            <div>
                              <p className="mb-1">Run the following commands after the upgrade:</p>
                              <div className="flex items-baseline gap-2">
                                <code className="text-xs">
                                  {legacyAuthCustomRoles.map((role) => (
                                    <div key={role} className="pb-1">
                                      ALTER ROLE <span className="text-brand">{role}</span> WITH
                                      PASSWORD '<span className="text-brand">newpassword</span>';
                                    </div>
                                  ))}
                                </code>
                              </div>
                            </div>
                            <div>
                              <Button size="tiny" type="default" asChild>
                                <Link
                                  href="https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#caveats"
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
                      <Listbox
                        id="version"
                        name="version"
                        label="Select the version of Postgres to upgrade to"
                        descriptionText={`Postgres will be upgraded from ${currentPgVersion} to ${
                          selectedVersion?.app_version?.split('supabase-postgres-')[1] ??
                          values.version
                        }`}
                      >
                        {data?.target_upgrade_versions.map((version) => (
                          <Listbox.Option
                            key={version.postgres_version}
                            value={version.postgres_version}
                            label={`${version.postgres_version} (${
                              version.app_version.split('supabase-postgres-')[1]
                            })`}
                          >
                            {version.postgres_version} (
                            {version.app_version.split('supabase-postgres-')[1]})
                          </Listbox.Option>
                        ))}
                      </Listbox>
                    </div>
                  </Modal.Content>
                </div>
                <div className="flex items-center space-x-2 justify-end px-4 py-4 border-t">
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
                </div>
              </>
            )
          }}
        </Form>
      </Modal>
    </>
  )
}

export default ProjectUpgradeAlert
