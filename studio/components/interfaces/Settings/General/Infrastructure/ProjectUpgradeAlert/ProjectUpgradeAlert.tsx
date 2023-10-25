import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Alert,
  Button,
  Form,
  IconAlertCircle,
  IconExternalLink,
  IconPackage,
  Listbox,
  Modal,
} from 'ui'

import { useParams } from 'common/hooks'
import InformationBox from 'components/ui/InformationBox'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { useProjectUpgradeMutation } from 'data/projects/project-upgrade-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import { BREAKING_CHANGES } from './ProjectUpgradeAlert.constants'

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
  const extensionDependentObjects = data?.extension_dependent_objects || []

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
      <Alert
        icon={<IconPackage className="text-brand" strokeWidth={1.5} />}
        variant="success"
        title="Your project can be upgraded to the latest version of Postgres"
      >
        <p className="mb-3">
          The latest version of Postgres ({latestPgVersion}) is available for your project.
        </p>
        <Button size="tiny" type="primary" onClick={() => setShowUpgradeModal(true)}>
          Upgrade project
        </Button>
      </Alert>
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
                      <p className="text-sm">
                        All services, including Auth, Rest, and Extensions will be upgraded. This
                        action cannot be undone.
                      </p>
                      <Alert
                        withIcon
                        variant="info"
                        title="Your project will be offline while the upgrade is in progress"
                      >
                        <p>
                          Based on your current database's size it is estimated the upgrade will
                          take up to:
                        </p>
                        <p className="text-sm text-green-900">
                          {durationEstimateHours} hour{durationEstimateHours === 1 ? '' : 's'}
                        </p>
                        <p>
                          It is advised to upgrade at a time when there will be minimal impact for
                          your application.
                        </p>
                      </Alert>
                      {(data?.potential_breaking_changes ?? []).length > 0 && (
                        <Alert withIcon variant="danger" title="Breaking changes">
                          <p className="mb-3">
                            Your project will be upgraded across major versions of Postgres. This
                            may involve breaking changes.
                          </p>

                          <Link href="https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#caveats">
                            <a target="_blank" rel="noreferrer">
                              <Button size="tiny" type="default">
                                Visit our documentation to learn more about breaking changes
                              </Button>
                            </a>
                          </Link>
                        </Alert>
                      )}
                      {legacyAuthCustomRoles.length > 0 && (
                        <Alert
                          withIcon
                          variant="warning"
                          title="Custom Postgres roles using md5 authentication have been detected"
                        >
                          <p className="mb-3">
                            New Postgres versions use scram-sha-256 authentication by default and do
                            not support md5, as it has been deprecated.
                          </p>
                          <p className="mb-3">
                            After upgrading you will not be able to connect using the existing
                            custom roles until they've been updated to use the new authentication
                            method.
                          </p>
                          <p className="mb-1">
                            You can do so by running the following commands after the upgrade:
                          </p>
                          <div className="flex items-baseline gap-2 mb-3">
                            <code className="text-xs">
                              {legacyAuthCustomRoles.map((role) => (
                                <div key={role} className="pb-1">
                                  ALTER ROLE <span className="text-green-900">{role}</span> WITH
                                  ENCRYPTED PASSWORD '
                                  <span className="text-green-900">newpassword</span>';
                                </div>
                              ))}
                            </code>
                          </div>
                          <Link href="https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#caveats">
                            <a target="_blank" rel="noreferrer">
                              <Button size="tiny" type="default">
                                Visit our documentation to learn more about this
                              </Button>
                            </a>
                          </Link>
                        </Alert>
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
