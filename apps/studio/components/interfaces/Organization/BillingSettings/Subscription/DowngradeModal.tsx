import type { ProjectInfo } from 'data/projects/projects-query'
import type { OrgSubscription, ProjectAddon } from 'data/subscriptions/types'
import { PricingInformation } from 'shared-data'
import { Alert, IconAlertOctagon, IconMinusCircle, IconPauseCircle, Modal } from 'ui'

export interface DowngradeModalProps {
  visible: boolean
  selectedPlan?: PricingInformation
  subscription?: OrgSubscription
  onClose: () => void
  onConfirm: () => void
  projects: ProjectInfo[]
}

const ProjectDowngradeListItem = ({ projectAddon }: { projectAddon: ProjectAddon }) => {
  const needsRestart = projectAddon.addons.find((addon) => addon.type === 'compute_instance')
  const addons = projectAddon.addons.map((addon) => {
    if (addon.type === 'compute_instance') return `${addon.variant.name} Compute Instance`
    return addon.variant.name
  })

  return (
    <li className="list-disc ml-6">
      {projectAddon.name}: {addons.join(', ')} will be removed.
      {needsRestart ? (
        <>
          {' '}
          Project will also <span className="font-bold">need to be restarted</span> due to change in
          compute instance
        </>
      ) : (
        ''
      )}
    </li>
  )
}

const DowngradeModal = ({
  visible,
  selectedPlan,
  subscription,
  onClose,
  onConfirm,
  projects,
}: DowngradeModalProps) => {
  // Filter out the micro addon as we're dealing with that separately
  const previousProjectAddons =
    subscription?.project_addons.flatMap((projectAddons) => {
      const addons = projectAddons.addons.filter((it) => it.variant.identifier !== 'ci_micro')
      if (!addons.length) {
        return []
      } else {
        return {
          ...projectAddons,
          // Overwrite addons, filtered out the micro addon
          addons,
        }
      }
    }) || []

  const hasInstancesOnMicro = projects.some((project) => project.infra_compute_size === 'micro')
  const downgradingToNano = subscription?.nano_enabled === true

  return (
    <Modal
      size="large"
      alignFooter="right"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      header={`Confirm to downgrade to ${selectedPlan?.name} plan`}
    >
      <Modal.Content>
        <div className="space-y-2">
          <Alert
            withIcon
            variant="warning"
            title="Downgrading to the Free Plan will lead to reductions in your organization's quota"
          >
            <p>
              If you're already past the limits of the Free Plan, your projects could become
              unresponsive or enter read only mode.
            </p>
          </Alert>

          {((previousProjectAddons.length ?? 0) > 0 ||
            (hasInstancesOnMicro && downgradingToNano)) && (
            <Alert title={`Projects affected by the downgrade`} variant="warning" withIcon>
              <ul className="space-y-1 max-h-[100px] overflow-y-auto">
                {previousProjectAddons.map((project) => (
                  <ProjectDowngradeListItem key={project.ref} projectAddon={project} />
                ))}

                {projects
                  .filter((it) => it.infra_compute_size === 'micro')
                  .map((project) => (
                    <li className="list-disc ml-6" key={project.ref}>
                      {project.name}: Compute will be downgraded. Project will also{' '}
                      <span className="font-bold">need to be restarted</span>.
                    </li>
                  ))}
              </ul>
            </Alert>
          )}
        </div>

        <ul className="mt-4 space-y-5 text-sm">
          <li className="flex gap-3">
            <div>
              <IconPauseCircle />
            </div>
            <span>Projects will be paused after a week of inactivity</span>
          </li>

          <li>
            <div className="flex gap-3 mb-2">
              <div>
                <IconMinusCircle />
              </div>
              <span>Add ons from all projects under this organization will be removed.</span>
            </div>
          </li>

          <li className="flex gap-3">
            <IconAlertOctagon w={14} className="flex-shrink-0" />
            <div>
              <strong>Before you downgrade to the {selectedPlan?.name} plan, consider:</strong>
              <ul className="space-y-2 mt-2">
                <li className="list-disc ml-4">
                  Your projects no longer require their respective add ons.
                </li>
                <li className="list-disc ml-4">
                  Your resource consumption are well within the {selectedPlan?.name} plan's quota.
                </li>
                <li className="list-disc ml-4">
                  Alternatively, you may also transfer projects across organizations.
                </li>
              </ul>
            </div>
          </li>
        </ul>

        {subscription?.billing_via_partner === true && subscription.billing_partner === 'fly' && (
          <p className="mt-4 text-sm">
            Your organization will be downgraded at the end of your current billing cycle.
          </p>
        )}
      </Modal.Content>
    </Modal>
  )
}

export default DowngradeModal
