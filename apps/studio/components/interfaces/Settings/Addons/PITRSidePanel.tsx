import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonRemoveMutation } from 'data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import type { AddonVariantId } from 'data/subscriptions/types'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import { useAddonsPagePanel } from 'state/addons-page'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CriticalIcon,
  Radio,
  SidePanel,
  cn,
} from 'ui'

const PITR_CATEGORY_OPTIONS: {
  id: 'off' | 'on'
  name: string
  imageUrl: string
  imageUrlLight: string
}[] = [
  {
    id: 'off',
    name: 'Disable PITR',
    imageUrl: `${BASE_PATH}/img/pitr-off.svg?v=2`,
    imageUrlLight: `${BASE_PATH}/img/pitr-off--light.svg?v=2`,
  },
  {
    id: 'on',
    name: 'Enable PITR',
    imageUrl: `${BASE_PATH}/img/pitr-on.svg?v=2`,
    imageUrlLight: `${BASE_PATH}/img/pitr-on--light.svg?v=2`,
  },
]

const PITRSidePanel = () => {
  const { ref: projectRef } = useParams()
  const { resolvedTheme } = useTheme()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const [selectedCategory, setSelectedCategory] = useState<'on' | 'off'>('off')
  const [selectedOption, setSelectedOption] = useState<string>('pitr_0')

  const { can: canUpdatePitr } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const isBranchingEnabled =
    project?.is_branch_enabled === true || project?.parent_project_ref !== undefined

  const { panel, closePanel } = useAddonsPagePanel()
  const visible = panel === 'pitr'

  const { data: addons, isPending: isLoading } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && projectSettings?.is_sensitive

  const { mutate: updateAddon, isPending: isUpdating } = useProjectAddonUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully updated point in time recovery duration`)
      closePanel()
    },
    onError: (error) => {
      toast.error(`Unable to update PITR: ${error.message}`)
    },
  })
  const { mutate: removeAddon, isPending: isRemoving } = useProjectAddonRemoveMutation({
    onSuccess: () => {
      toast.success(`Successfully disabled point in time recovery`)
      closePanel()
    },
    onError: (error) => {
      toast.error(`Unable to disable PITR: ${error.message}`)
    },
  })
  const isSubmitting = isUpdating || isRemoving

  const selectedAddons = addons?.selected_addons ?? []
  const availableAddons = addons?.available_addons ?? []

  const subscriptionCompute = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const subscriptionPitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const availableOptions = availableAddons.find((addon) => addon.type === 'pitr')?.variants ?? []

  const hasChanges = selectedOption !== (subscriptionPitr?.variant.identifier ?? 'pitr_0')
  const { hasAccess: hasAccessToPitrVariants } = useCheckEntitlements('pitr.available_variants')
  const selectedPitr = availableOptions.find((option) => option.identifier === selectedOption)
  const hasSufficientCompute =
    !!subscriptionCompute && subscriptionCompute.variant.identifier !== 'ci_micro'

  // These are illegal states. If they are true, we should block the user from saving them.
  const blockDowngradeDueToHipaa =
    hasHipaaAddon &&
    (selectedCategory !== 'on' ||
      // If the project is HIPAA, we don't allow the user to downgrade below 28 days
      selectedPitr?.identifier !== 'pitr_28')

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')

    if (selectedOption === 'pitr_0' && subscriptionPitr !== undefined) {
      removeAddon({ projectRef, variant: subscriptionPitr.variant.identifier })
    } else {
      updateAddon({ projectRef, type: 'pitr', variant: selectedOption as AddonVariantId })
    }
  }

  useEffect(() => {
    if (visible) {
      if (subscriptionPitr !== undefined) {
        setSelectedCategory('on')
        setSelectedOption(subscriptionPitr.variant.identifier)
      } else {
        setSelectedCategory('off')
        setSelectedOption('pitr_0')
      }
    }
  }, [visible, isLoading])

  return (
    <SidePanel
      size="xlarge"
      visible={visible}
      onCancel={closePanel}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting}
      disabled={
        !hasAccessToPitrVariants ||
        isLoading ||
        !hasChanges ||
        isSubmitting ||
        !canUpdatePitr ||
        (!!selectedPitr && !hasSufficientCompute) ||
        blockDowngradeDueToHipaa
      }
      tooltip={
        blockDowngradeDueToHipaa
          ? 'Unable to disable PITR with HIPAA add-on'
          : !hasAccessToPitrVariants
            ? 'Unable to enable point in time recovery on your Plan'
            : !canUpdatePitr
              ? 'You do not have permission to update PITR'
              : undefined
      }
      header={
        <div className="flex items-center justify-between">
          <h4>Point in Time Recovery</h4>
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
            <Link
              href={`${DOCS_URL}/guides/platform/backups#point-in-time-recovery`}
              target="_blank"
              rel="noreferrer"
            >
              About point in time recovery
            </Link>
          </Button>
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Point-in-Time Recovery (PITR) allows a project to be backed up at much shorter
            intervals. This provides users an option to restore to any chosen point of up to seconds
            in granularity.
          </p>

          <div className="!mt-8 pb-4">
            <div className="flex gap-3">
              {PITR_CATEGORY_OPTIONS.map((option) => {
                const isSelected = selectedCategory === option.id
                return (
                  <div
                    key={option.id}
                    className={cn(
                      'col-span-3 group space-y-1',
                      !hasAccessToPitrVariants && 'opacity-75'
                    )}
                    onClick={() => {
                      setSelectedCategory(option.id)
                      if (option.id === 'off') {
                        setSelectedOption('pitr_0')
                      } else if (subscriptionPitr?.variant.identifier !== undefined) {
                        setSelectedOption(subscriptionPitr.variant.identifier)
                      } else {
                        if (hasHipaaAddon) {
                          setSelectedOption('pitr_28')
                        } else {
                          setSelectedOption('pitr_7')
                        }
                      }
                    }}
                  >
                    <img
                      alt="Point-In-Time-Recovery"
                      className={cn(
                        'relative rounded-xl transition border bg-no-repeat bg-center bg-cover cursor-pointer w-[160px] h-[96px]',
                        isSelected
                          ? 'border-foreground'
                          : 'border-foreground-muted opacity-50 group-hover:border-foreground-lighter group-hover:opacity-100'
                      )}
                      width={160}
                      height={96}
                      src={resolvedTheme?.includes('dark') ? option.imageUrl : option.imageUrlLight}
                    />

                    <p
                      className={cn(
                        'text-sm transition',
                        isSelected ? 'text-foreground' : 'text-foreground-light'
                      )}
                    >
                      {option.name}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedCategory === 'off' && subscriptionPitr !== undefined && isBranchingEnabled && (
            <Alert_Shadcn_ variant="warning">
              <CriticalIcon />
              <AlertTitle_Shadcn_>
                Are you sure you want to disable this while using Branching?
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Without PITR, you might not be able to recover lost data if you accidentally merge a
                branch that deletes a column or user data. We don't recommend this.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}

          {blockDowngradeDueToHipaa ? (
            <Alert_Shadcn_>
              <AlertTitle_Shadcn_>PITR cannot be disabled on HIPAA projects</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                PITR is enabled by default for all HIPAA projects and cannot be turned off. Contact
                support for further assistance.
              </AlertDescription_Shadcn_>
              <div className="mt-4">
                <Button type="default" asChild>
                  <SupportLink>Contact support</SupportLink>
                </Button>
              </div>
            </Alert_Shadcn_>
          ) : null}

          {selectedCategory === 'on' && (
            <div className="!mt-8 pb-4">
              {!hasAccessToPitrVariants ? (
                <UpgradeToPro
                  className="mb-4"
                  addon="pitr"
                  primaryText="Changing your Point-In-Time-Recovery is only available on the Pro Plan"
                  secondaryText="Upgrade your plan to change PITR for your project."
                  featureProposition="enable PITR"
                />
              ) : !hasSufficientCompute ? (
                <UpgradeToPro
                  className="mb-4"
                  addon="computeSize"
                  primaryText="Project needs to be at least on a Small compute size to enable PITR"
                  secondaryText="This ensures enough resources to execute PITR successfully."
                  featureProposition="enable PITR"
                />
              ) : null}

              <Radio.Group
                type="large-cards"
                size="tiny"
                id="pitr"
                label={<p className="text-sm">Choose the duration of recovery</p>}
                onChange={(event: any) => setSelectedOption(event.target.value)}
              >
                {availableOptions.map((option) => (
                  <Radio
                    name="pitr"
                    disabled={!hasAccessToPitrVariants || subscriptionCompute === undefined}
                    className="col-span-4 !p-0"
                    key={option.identifier}
                    checked={selectedOption === option.identifier}
                    label={<span className="text-sm">{option.name}</span>}
                    value={option.identifier}
                  >
                    <div className="w-full group">
                      <div className="border-b border-default px-4 py-2">
                        <p className="text-sm">{option.name}</p>
                      </div>
                      <div className="px-4 py-2">
                        <p className="text-foreground-light">
                          Allow database restorations to any time up to{' '}
                          {option.identifier.split('_')[1]} days ago
                        </p>
                        <div className="flex items-center space-x-1 mt-2">
                          <p className="text-foreground text-sm" translate="no">
                            {formatCurrency(option.price)}
                          </p>
                          <p className="text-foreground-light translate-y-[1px]"> / month</p>
                        </div>
                      </div>
                    </div>
                  </Radio>
                ))}
              </Radio.Group>
            </div>
          )}

          {hasChanges && selectedOption !== 'pitr_0' && (
            <p className="text-sm text-foreground-light">
              There are no immediate charges. The addon is billed at the end of your billing cycle
              based on your usage and prorated to the hour.
            </p>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default PITRSidePanel
