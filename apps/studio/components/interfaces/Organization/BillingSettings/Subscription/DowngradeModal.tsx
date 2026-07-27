import { MinusCircle, PauseCircle } from 'lucide-react'
import { useMemo } from 'react'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { isBeforeFreeTierTemplateBlockCutoff } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplates.utils'
import { getComputeSize, OrgProject } from '@/data/projects/org-projects-infinite-query'
import type { OrgSubscription, ProjectAddon } from '@/data/subscriptions/types'

export interface DowngradeModalProps {
  visible: boolean
  subscription?: OrgSubscription
  onClose: () => void
  onConfirm: () => void
  projects: OrgProject[]
  confirmDisabled?: boolean
}

const ProjectDowngradeListItem = ({ projectAddon }: { projectAddon: ProjectAddon }) => {
  const needsRestart = projectAddon.addons.find((addon) => addon.type === 'compute_instance')

  /**
   * We do not include Log Drains, Advanced MFA Phone, and ETL Pipeline for the following reasons:
   * 1. These addons are not removed automatically. Instead, users have to remove the respective configuration themselves
   * 2. It's not obvious to users that Log Drains, MFA Phone, and ETL Pipeline are addons
   */
  const relevantAddonsToList = projectAddon.addons.filter(
    (addon) => !['log_drain', 'auth_mfa_phone', 'etl_pipeline'].includes(addon.type)
  )

  const addonNames = relevantAddonsToList.map((addon) => {
    if (addon.type === 'compute_instance') return `${addon.variant.name} Compute Instance`
    return addon.variant.name
  })

  return (
    <li className="list-disc ml-6">
      {projectAddon.name}: {addonNames.join(', ')} will be removed.
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

export const DowngradeModal = ({
  visible,
  subscription,
  onClose,
  onConfirm,
  projects,
  confirmDisabled,
}: DowngradeModalProps) => {
  const selectedPlan = useMemo(() => subscriptionsPlans.find((tier) => tier.id === 'tier_free'), [])

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

  const hasInstancesOnMicro = projects.some((project) => {
    const computeSize = getComputeSize(project)
    return computeSize === 'micro'
  })

  // Only warn about template reset if at least one project is post-cutoff.
  // Pre-cutoff projects are grandfathered and keep template editing access after downgrade.
  const hasPostCutoffProjects = projects.some(
    (project) => !isBeforeFreeTierTemplateBlockCutoff(project.inserted_at)
  )

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Confirm to downgrade to {selectedPlan?.name} plan</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <div className="px-5 py-4 text-foreground-light">
          <div className="flex flex-col space-y-2">
            <Admonition
              type="warning"
              title="Downgrading to the Free Plan will lead to reductions in your organization's quota"
              description="If you're already past the limits of the Free Plan, your projects could become
                  unresponsive or enter read only mode."
            />

            {((previousProjectAddons.length ?? 0) > 0 || hasInstancesOnMicro) && (
              <Admonition type="warning" title="Projects affected by the downgrade">
                <ul className="space-y-1 max-h-[100px] overflow-y-auto">
                  {previousProjectAddons.map((project) => (
                    <ProjectDowngradeListItem key={project.ref} projectAddon={project} />
                  ))}

                  {projects
                    .filter((it) => {
                      const computeSize = getComputeSize(it)
                      return computeSize === 'micro'
                    })
                    .map((project) => (
                      <li className="list-disc ml-6" key={project.ref}>
                        {project.name}: Compute will be downgraded. Project will also{' '}
                        <span className="font-bold">need to be restarted</span>.
                      </li>
                    ))}
                </ul>
              </Admonition>
            )}
          </div>

          {hasPostCutoffProjects && (
            <Admonition
              type="warning"
              className="mt-2"
              title="Any custom email templates will be reset"
              description="Downgrading will reset your custom email templates to their defaults. You won’t be able to edit them unless you set up custom SMTP after downgrading."
            />
          )}

          <ul className="mt-4 space-y-5 text-sm">
            <li className="flex items-center gap-3">
              <PauseCircle size={18} />
              <span>Projects will be paused after a week of inactivity</span>
            </li>

            <li className="flex items-center gap-3 mb-2">
              <MinusCircle size={18} />
              <span>Add ons from all projects under this organization will be removed.</span>
            </li>

            <li className="flex gap-3">
              <div>
                <strong>Before you downgrade to the {selectedPlan?.name} plan, consider:</strong>
                <ul className="space-y-2 mt-2">
                  <li className="list-disc ml-6 text-foreground-light">
                    Your projects no longer require their respective add-ons.
                  </li>
                  <li className="list-disc ml-6 text-foreground-light">
                    Your resource consumption are well within the {selectedPlan?.name} plan's quota.
                  </li>
                  <li className="list-disc ml-6 text-foreground-light">
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
        </div>
        <DialogFooter>
          <Button variant={'default'} onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={confirmDisabled ?? false}
            variant="warning"
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
