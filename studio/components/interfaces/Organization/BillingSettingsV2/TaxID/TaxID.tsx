import { useEffect, useState } from 'react'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useStore } from 'hooks'
import { Button, Form, IconPlus, IconX, Input, Listbox } from 'ui'
import { TAX_IDS } from './TaxID.constants'
import { TaxId, useOrganizationTaxIDsQuery } from 'data/organizations/organization-tax-ids-query'
import { useParams } from 'common'
import { uuidv4 } from 'lib/helpers'
import { isEqual } from 'lodash'
import {
  TaxIdValue,
  useOrganizationTaxIDsUpdateMutation,
} from 'data/organizations/organization-tax-ids-update-mutation'
import { sanitizeTaxID } from './TaxID.utilts'

const TaxID = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { data: taxIds, isLoading, isSuccess, isError } = useOrganizationTaxIDsQuery({ slug })
  const { mutateAsync: updateTaxIDs } = useOrganizationTaxIDsUpdateMutation()

  const [errors, setErrors] = useState<string[]>([])
  const [taxIdValues, setTaxIdValues] = useState<TaxIdValue[]>([])

  const formattedTaxIds =
    taxIds?.map((taxId: TaxId) => {
      return {
        id: taxId.id,
        type: taxId.type,
        value: taxId.value,
        name:
          taxId.type === 'eu_vat'
            ? `${taxId.country} VAT`
            : TAX_IDS.find((option) => option.code === taxId.type)?.name ?? '',
      }
    }) ?? []

  const formId = 'tax-id-form'
  const hasChanges = !isEqual(taxIdValues, formattedTaxIds)
  const canReadTaxIds = useCheckPermissions(PermissionAction.BILLING_READ, 'stripe.tax_ids')
  const canUpdateTaxIds = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.tax_ids')

  useEffect(() => {
    if (isSuccess) {
      if (taxIdValues.length === 0) {
        setTaxIdValues(formattedTaxIds)
      } else {
        const erroredTaxIds = taxIdValues.filter((taxId: any) => errors.includes(taxId.id))
        setTaxIdValues(formattedTaxIds.concat(erroredTaxIds))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  const onUpdateTaxId = (id: string, key: string, value: string) => {
    const updatedTaxIds = taxIdValues.map((taxId: any) => {
      if (taxId.id === id) {
        if (key === 'name') {
          const selectedTaxIdOption = TAX_IDS.find((option) => option.name === value)
          return { ...taxId, [key]: value, type: selectedTaxIdOption?.code }
        } else {
          return { ...taxId, [key]: value }
        }
      }
      return taxId
    })
    setTaxIdValues(updatedTaxIds)
  }

  const onAddNewTaxId = () => {
    const newTaxId = { id: uuidv4(), type: TAX_IDS[0].code, value: '', name: TAX_IDS[0].name }
    const updatedTaxIds = taxIdValues.concat([newTaxId])
    setTaxIdValues(updatedTaxIds)
  }

  const onRemoveTaxId = (id: string) => {
    const updatedTaxIds = taxIdValues.filter((taxId) => taxId.id !== id)
    setTaxIdValues(updatedTaxIds)
  }

  const onResetTaxIds = () => {
    setTaxIdValues(formattedTaxIds)
  }

  const onSaveTaxIds = async (values: any, { setSubmitting }: any) => {
    if (!slug) return console.error('Slug is required')
    if (taxIds === undefined) return console.error('Tax IDs are required')

    try {
      setSubmitting(true)
      const newIds = taxIdValues.map((x) => sanitizeTaxID(x))
      const { errors } = await updateTaxIDs({ slug, existingIds: taxIds, newIds })
      setErrors(errors?.map((taxId) => taxId.id) ?? [])

      if (errors !== undefined && errors.length > 0) {
        errors.forEach((taxId: any) => {
          ui.setNotification({ category: 'error', message: taxId.result.error.message })
        })
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully updated tax IDs' })
      }
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to save tax IDs: ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSection
      id="tax-id"
      header={
        <FormSectionLabel>
          <div className="sticky space-y-6 top-16">
            <div>
              <p className="text-base">Tax ID</p>
              <p className="text-sm text-scale-1000">
                If you would like to include specific tax ID(s) to your invoices.
              </p>
              <p className="text-sm text-scale-1000">
                Make sure the tax ID looks exactly like the placeholder text.
              </p>
            </div>
          </div>
        </FormSectionLabel>
      }
    >
      <FormSectionContent loading={false}>
        {!canReadTaxIds ? (
          <NoPermission resourceText="view this organization's tax IDs" />
        ) : (
          <Form validateOnBlur id={formId} initialValues={{}} onSubmit={onSaveTaxIds}>
            {({ isSubmitting }: { isSubmitting: boolean }) => (
              <FormPanel
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isSubmitting}
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
                  <FormSectionContent fullWidth loading={isLoading}>
                    {taxIdValues.length >= 1 ? (
                      <div className="w-full space-y-2">
                        {taxIdValues.map((taxId, idx: number) => {
                          const selectedTaxId = TAX_IDS.find((option) => option.code === taxId.type)
                          return (
                            <div key={`tax-id-${idx}`} className="flex items-center space-x-2">
                              <Listbox
                                value={selectedTaxId?.name}
                                onChange={(e: any) => onUpdateTaxId(taxId.id, 'name', e)}
                                disabled={!canUpdateTaxIds}
                                className="w-[200px]"
                              >
                                {TAX_IDS.sort((a, b) => a.country.localeCompare(b.country)).map(
                                  (option) => (
                                    <Listbox.Option
                                      key={option.name}
                                      value={option.name}
                                      label={option.name}
                                    >
                                      {option.country} - {option.name}
                                    </Listbox.Option>
                                  )
                                )}
                              </Listbox>
                              <Input
                                value={taxId.value}
                                placeholder={selectedTaxId?.placeholder ?? ''}
                                onChange={(e: any) =>
                                  onUpdateTaxId(taxId.id, 'value', e.target.value)
                                }
                                disabled={!canUpdateTaxIds}
                              />
                              {canUpdateTaxIds && (
                                <Button
                                  type="text"
                                  className="px-1"
                                  icon={<IconX />}
                                  onClick={() => onRemoveTaxId(taxId.id)}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div>
                        <p className="flex items-center space-x-2 text-sm text-scale-900">
                          No tax IDs
                        </p>
                      </div>
                    )}
                    {canUpdateTaxIds && (
                      <div
                        className="flex cursor-pointer items-center space-x-2 opacity-50 transition hover:opacity-100"
                        onClick={() => onAddNewTaxId()}
                      >
                        <IconPlus size={14} />
                        <p className="text-sm">Add another ID</p>
                      </div>
                    )}
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            )}
          </Form>
        )}
      </FormSectionContent>
    </FormSection>
  )
}

export default TaxID
