import { useState, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Form, Modal, Listbox, Loading, Alert, IconHelpCircle, Toggle } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions, useSelectedOrganization } from 'hooks'
import { PRICING_TIER_LABELS_ORG } from 'lib/constants'
import { useOrganizationBillingMigrationMutation } from 'data/organizations/organization-migrate-billing-mutation'
import { useOrganizationBillingMigrationPreview } from 'data/organizations/organization-migrate-billing-preview-query'
import Link from 'next/link'
import SpendCapModal from 'components/interfaces/Billing/SpendCapModal'
import { useRouter } from 'next/router'
import InformationBox from 'components/ui/InformationBox'

const MigrateOrganizationBillingButton = observer(() => {
  const { ui } = useStore()
  const router = useRouter()

  const organization = useSelectedOrganization()

  const [isOpen, setIsOpen] = useState(false)
  const [tier, setTier] = useState('')
  const [showSpendCapHelperModal, setShowSpendCapHelperModal] = useState(false)
  const [isSpendCapEnabled, setIsSpendCapEnabled] = useState(true)

  const dbTier = useMemo(() => {
    if (tier === '') return ''
    if (tier === 'PRO' && !isSpendCapEnabled) {
      return `tier_payg`
    } else {
      return `tier_` + tier.toLocaleLowerCase()
    }
  }, [tier, isSpendCapEnabled])

  const { error: migrationError, mutateAsync: migrateBilling } =
    useOrganizationBillingMigrationMutation()

  const {
    data: migrationPreviewData,
    error: migrationPreviewError,
    isLoading: migrationPreviewIsLoading,
    remove,
    refetch: previewMigration,
  } = useOrganizationBillingMigrationPreview(
    { tier: dbTier, organizationSlug: organization?.slug },
    { enabled: false, refetchOnWindowFocus: false }
  )

  useEffect(() => {
    if (dbTier) {
      previewMigration()
    }
  }, [dbTier])

  useEffect(() => {
    if (isOpen) {
      // reset state
      setTier('')
    } else {
      // Invalidate cache
      remove()
    }
  }, [isOpen])

  const canMigrateOrganization = checkPermissions(PermissionAction.UPDATE, 'organizations')

  const toggle = () => {
    setIsOpen(!isOpen)
  }

  const onValidate = (values: any) => {
    const errors: any = {}
    if (!values.tier) {
      errors.tier = 'Please select a plan.'
    }
    return errors
  }

  const onConfirmMigrate = async (values: any, { setSubmitting }: any) => {
    if (!canMigrateOrganization) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to migrate this organization',
      })
    }

    setSubmitting(true)

    try {
      await migrateBilling({ organizationSlug: organization?.slug, tier: dbTier })
      ui.setNotification({
        message: 'Successfully migrated to organization-level billing',
        category: 'success',
        duration: 5000,
      })
      router.push('/projects')
      setIsOpen(false)
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div>
        <Button loading={!organization?.slug} onClick={() => setIsOpen(true)} type="primary">
          Migrate organization
        </Button>
      </div>
      <Modal
        closable
        hideFooter
        size="large"
        visible={isOpen}
        onCancel={toggle}
        header={
          <div className="flex items-baseline gap-2">
            <h5 className="text-sm text-scale-1200">Migrate organization</h5>
          </div>
        }
      >
        <Form
          validateOnBlur
          initialValues={{ tier: '', isSpendCapEnabled: true }}
          onSubmit={onConfirmMigrate}
          validate={onValidate}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <div className="space-y-4 py-3">
              <Modal.Content>
                <div className="space-y-2">
                  <Alert title="About the migration" withIcon variant="info">
                    <div className="text-sm">
                      When migrating your organization to the new organization-level billing, you
                      will only have a single subscription for all projects inside the organization,
                      rather than an individual subscription per project. This process is
                      irreversible. For a detailed breakdown of changes, see{' '}
                      <Link href="https://www.notion.so/supabase/Organization-Level-Billing-9c159d69375b4af095f0b67881276582?pvs=4">
                        <a target="_blank" rel="noreferrer" className="underline">
                          Billing Migration Docs
                        </a>
                      </Link>
                      .
                    </div>
                    <div className="text-sm mt-3">
                      If you want to transfer a project to a different organization, head to your
                      projects{' '}
                      <Link href="/projects/_/settings/general">
                        <a target="_blank" rel="noreferrer" className="underline">
                          general settings
                        </a>
                      </Link>
                      .
                    </div>
                  </Alert>
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Listbox
                  id="tier"
                  label="Organization Pricing Plan"
                  layout="horizontal"
                  value={tier}
                  onChange={setTier}
                  className="flex items-center"
                >
                  <Listbox.Option label="Select plan" value="" disabled className="hidden">
                    Select Plan
                  </Listbox.Option>
                  {Object.entries(PRICING_TIER_LABELS_ORG).map(([k, v]) => {
                    return (
                      <Listbox.Option key={k} label={v} value={k}>
                        {v}
                      </Listbox.Option>
                    )
                  })}
                </Listbox>

                <p className="text-sm text-scale-1000 mt-2">
                  The pricing plan will apply to your entire organization. The included usage limits
                  apply to your entire organizations. See{' '}
                  <a
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                    href="https://supabase.com/pricing"
                  >
                    Pricing
                  </a>{' '}
                  for more details. Please reach out to support if you're an Enterprise customer.
                </p>

                {tier !== '' && tier !== 'FREE' && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-scale-1000">
                      Paid plans come with one compute instance included. Additional projects will
                      at least cost the compute instance hours used (min $7/month). See{' '}
                      <Link href="https://www.notion.so/supabase/Organization-Level-Billing-9c159d69375b4af095f0b67881276582?pvs=4">
                        <a target="_blank" rel="noreferrer" className="underline">
                          Compute Instance Usage Billing
                        </a>
                      </Link>{' '}
                      for more details.
                    </p>
                  </div>
                )}

                {tier === 'PRO' && (
                  <div className="mt-4">
                    <Toggle
                      id="isSpendCapEnabled"
                      layout="horizontal"
                      label={
                        <div className="flex space-x-4">
                          <span>Spend Cap</span>
                          <IconHelpCircle
                            size={16}
                            strokeWidth={1.5}
                            className="transition opacity-50 cursor-pointer hover:opacity-100"
                            onClick={() => setShowSpendCapHelperModal(true)}
                          />
                        </div>
                      }
                      checked={isSpendCapEnabled}
                      onChange={() => setIsSpendCapEnabled(!isSpendCapEnabled)}
                    />

                    <p className="text-sm text-scale-1000">
                      When enabled, usage is limited to the plan's quota, with restrictions when
                      limits are exceeded. To scale beyond Pro limits without restrictions, disable
                      the spend cap and pay for over-usage beyond the quota.
                    </p>

                    <SpendCapModal
                      visible={showSpendCapHelperModal}
                      onHide={() => setShowSpendCapHelperModal(false)}
                    />
                  </div>
                )}
              </Modal.Content>
              <Modal.Content>
                <Loading active={tier !== '' && migrationPreviewIsLoading}>
                  {migrationPreviewError && (
                    <Alert title="Organization cannot be migrated" variant="danger">
                      <span>{migrationPreviewError.message}</span>
                    </Alert>
                  )}
                </Loading>

                {migrationError && (
                  <Alert title="Organization cannot be migrated" variant="danger">
                    <span>{migrationError.message}</span>
                  </Alert>
                )}
              </Modal.Content>
              <Modal.Content>
                <Button
                  block
                  size="small"
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={migrationPreviewData === undefined || isSubmitting}
                >
                  I understand, migrate this organization
                </Button>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
})

export default MigrateOrganizationBillingButton
