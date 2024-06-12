import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormActions, FormPanel, FormSection, FormSectionContent } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { useCheckPermissions } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import {
  Button,
  Form,
  IconPlus,
  IconX,
  Input,
  Listbox,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { TAX_IDS } from './TaxID.constants'
import { checkTaxIdEqual as checkTaxIdEqual, sanitizeTaxIdValue } from './TaxID.utils'

const TaxID = () => {
  const { slug } = useParams()
  const { data: taxId, error, isLoading, isSuccess, isError } = useOrganizationTaxIdQuery({ slug })
  const { mutate: updateTaxId, isLoading: isUpdating } = useOrganizationTaxIdUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated tax id')
    },
  })

  const [taxIdValue, setTaxIdValue] = useState<{ type: string; value: string; name: string }>({
    type: '',
    value: '',
    name: '',
  })

  const formattedTaxId = taxId
    ? {
        type: taxId.type,
        value: taxId.value,
        name:
          taxId.type === 'eu_vat'
            ? `${taxId.country} VAT`
            : TAX_IDS.find((option) => option.code === taxId.type)?.name ?? '',
      }
    : { type: '', value: '', name: '' }

  const formId = 'tax-id-form'
  const hasChanges = !checkTaxIdEqual(taxIdValue, formattedTaxId)
  const canReadTaxIds = useCheckPermissions(PermissionAction.BILLING_READ, 'stripe.tax_ids')
  const canUpdateTaxIds = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.tax_ids')

  useEffect(() => {
    if (isSuccess) {
      if (taxId) {
        setTaxIdValue(formattedTaxId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  const onUpdateTaxId = (key: string, value: string) => {
    if (key === 'name') {
      const selectedTaxIdOption = TAX_IDS.find((option) => option.name === value)
      return setTaxIdValue({ ...taxIdValue, [key]: value, type: selectedTaxIdOption!.code })
    } else {
      return setTaxIdValue({ ...taxIdValue, [key]: value })
    }
  }

  const onSaveTaxIds = async () => {
    if (!slug) return console.error('Slug is required')

    updateTaxId({
      slug,
      taxId:
        taxIdValue.type && taxIdValue.value
          ? {
              type: taxIdValue.type,
              value: sanitizeTaxIdValue(taxIdValue),
            }
          : null,
    })
  }

  const onResetTaxIds = () => {
    setTaxIdValue(formattedTaxId)
  }

  const onRemoveTaxId = () => {
    setTaxIdValue({ name: '', type: '', value: '' })
  }

  const selectedTaxId = TAX_IDS.find((option) => option.code === taxIdValue?.type)

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-foreground text-base m-0">Tax ID</p>
          <p className="text-sm text-foreground-light pr-4 m-0">
            Add tax ID to have them appear in your invoices. Old invoices are not affected.
          </p>
          <p className="text-sm text-foreground-light m-0">
            Make sure the tax ID looks exactly like the placeholder text.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadTaxIds ? (
          <NoPermission resourceText="view this organization's tax IDs" />
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
              <Form validateOnBlur id={formId} initialValues={{}} onSubmit={onSaveTaxIds}>
                {() => (
                  <FormPanel
                    footer={
                      <div className="flex py-4 px-8">
                        <FormActions
                          form={formId}
                          isSubmitting={isUpdating}
                          hasChanges={hasChanges}
                          handleReset={() => onResetTaxIds()}
                          helper={
                            !canUpdateTaxIds
                              ? "You need additional permissions to manage this organization's tax IDs"
                              : undefined
                          }
                        />
                      </div>
                    }
                  >
                    <FormSection>
                      <FormSectionContent fullWidth loading={false}>
                        <div className="w-full space-y-2">
                          <div className="flex items-center space-x-2">
                            <Select_Shadcn_
                              value={taxIdValue?.name}
                              onValueChange={(e: any) => onUpdateTaxId('name', e)}
                              disabled={!canUpdateTaxIds}
                            >
                              <SelectTrigger_Shadcn_ className="w-[300px]">
                                <SelectValue_Shadcn_ placeholder="Select tax id type" />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_ className="max-h-[20rem] overflow-y-auto">
                                <SelectGroup_Shadcn_>
                                  {TAX_IDS.sort((a, b) => a.country.localeCompare(b.country)).map(
                                    (option) => (
                                      <SelectItem_Shadcn_ key={option.name} value={option.name}>
                                        {option.country} - {option.name}
                                      </SelectItem_Shadcn_>
                                    )
                                  )}
                                </SelectGroup_Shadcn_>
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                            {selectedTaxId && (
                              <Input
                                value={taxId?.value}
                                placeholder={selectedTaxId?.placeholder ?? 'Select type first'}
                                onChange={(e: any) => onUpdateTaxId('value', e.target.value)}
                                disabled={!canUpdateTaxIds}
                              />
                            )}

                            {taxIdValue?.type && (
                              <Button
                                type="text"
                                className="px-1"
                                icon={<IconX />}
                                onClick={() => onRemoveTaxId()}
                              />
                            )}
                          </div>
                        </div>
                      </FormSectionContent>
                    </FormSection>
                  </FormPanel>
                )}
              </Form>
            )}
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default TaxID
