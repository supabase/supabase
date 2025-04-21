import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormActions } from 'components/ui/Forms/FormActions'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Form_Shadcn_ } from 'ui'
import TaxIdForm from './TaxIdForm'
import { useTaxIdForm } from './useTaxIdForm'
import { useMemo } from 'react'
import { TAX_IDS } from './TaxID.constants'

const TaxID = () => {
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()

  const { data: taxId, error, isLoading, isSuccess, isError } = useOrganizationTaxIdQuery({ slug })

  const initialTaxId = useMemo(() => taxId, [taxId])

  const { form, handleSubmit, handleReset, isSubmitting, isDirty } = useTaxIdForm({
    slug: slug,
    initialTaxId: {
      type: initialTaxId?.type || '',
      value: initialTaxId?.value || '',
      name: initialTaxId
        ? TAX_IDS.find(
            (option) =>
              option.type === initialTaxId.type && option.countryIso2 === initialTaxId.country
          )?.name || ''
        : '',
    },
  })

  const canReadTaxId = useCheckPermissions(PermissionAction.BILLING_READ, 'stripe.tax_ids')
  const canUpdateTaxId = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.tax_ids')

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-foreground text-base m-0">Tax ID</p>
          <p className="text-sm text-foreground-light pr-4 m-0">
            Add a tax ID to your invoices. Changes only apply to future invoices.
          </p>
          <p className="text-sm text-foreground-light m-0">
            Make sure the tax ID looks exactly like the placeholder text.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {selectedOrganization?.managed_by !== undefined &&
        selectedOrganization?.managed_by !== 'supabase' ? (
          <PartnerManagedResource
            partner={selectedOrganization?.managed_by}
            resource="Tax IDs"
            cta={{
              installationId: selectedOrganization?.partner_id,
            }}
          />
        ) : !canReadTaxId ? (
          <NoPermission resourceText="view this organization's tax ID" />
        ) : (
          <>
            {isLoading && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {isError && (
              <AlertError error={error} subject="Failed to retrieve organization tax Id" />
            )}

            {isSuccess && (
              <Panel
                className="mb-8"
                footer={
                  <FormActions
                    form="tax-id-form"
                    isSubmitting={isSubmitting}
                    hasChanges={isDirty}
                    handleReset={() => handleReset()}
                    helper={
                      !canUpdateTaxId
                        ? "You need additional permissions to manage this organization's tax ID"
                        : undefined
                    }
                  />
                }
              >
                <Form_Shadcn_ {...form}>
                  <form id="tax-id-form" onSubmit={form.handleSubmit(handleSubmit)}>
                    <TaxIdForm form={form} canUpdateTaxId={canUpdateTaxId} />
                  </form>
                </Form_Shadcn_>
              </Panel>
            )}
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default TaxID
