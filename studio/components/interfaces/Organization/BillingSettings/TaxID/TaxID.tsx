import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { isEqual } from 'lodash'
import { useEffect, useState } from 'react'
import { Button, IconPlus, IconX, Input, Listbox } from 'ui'

import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationTaxIDsQuery } from 'data/organizations/organization-tax-ids-query'
import {
  TaxIdValue,
  useOrganizationTaxIDsUpdateMutation,
} from 'data/organizations/organization-tax-ids-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { StripeTaxId, TAX_IDS } from './TaxID.constants'
import { sanitizeTaxID } from './TaxID.utils'

// Stripe recommends to delete tax ids and create new ones to update
// https://stripe.com/docs/billing/customer/tax-ids

const TaxID = () => {
  const { ui } = useStore()
  const { slug } = useParams()

  const {
    data,
    error: taxIdsError,
    isLoading: isLoadingTaxIds,
    isError: isErrorTaxIds,
    isSuccess: isSuccessTaxIds,
  } = useOrganizationTaxIDsQuery({ slug })
  const taxIds = data || []

  const { mutate: updateTaxIDs, isLoading: isUpdating } = useOrganizationTaxIDsUpdateMutation({
    onSuccess: (res) => {
      const { created, errors } = res
      setErrors(errors?.map((taxId) => taxId.id) ?? [])
      const updatedTaxIds =
        created?.map((x) => {
          return {
            id: x.id,
            type: x.type,
            value: x.value,
            name:
              x.type === 'eu_vat'
                ? `${x.country} VAT`
                : TAX_IDS.find((option) => option.code === x.type)?.name ?? '',
          }
        }) ?? []
      setTaxIdValues(updatedTaxIds)

      if (errors !== undefined && errors.length > 0) {
        errors.forEach((taxId: any) => {
          ui.setNotification({ category: 'error', message: taxId.result.error.message })
        })
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully updated tax IDs' })
      }
    },
  })

  const [errors, setErrors] = useState<string[]>([])
  const [taxIdValues, setTaxIdValues] = useState<TaxIdValue[]>([])
  const formattedTaxIds: StripeTaxId[] = taxIds.map((taxId) => {
    return {
      id: taxId.id,
      type: taxId.type,
      value: taxId.value,
      name:
        taxId.type === 'eu_vat'
          ? `${taxId.country} VAT`
          : TAX_IDS.find((option) => option.code === taxId.type)?.name ?? '',
    }
  })

  useEffect(() => {
    if (isSuccessTaxIds) {
      if (taxIdValues.length === 0) {
        setTaxIdValues(formattedTaxIds)
      } else {
        const erroredTaxIds = taxIdValues.filter((taxId: any) => errors.includes(taxId.id))
        setTaxIdValues(formattedTaxIds.concat(erroredTaxIds))
      }
    }
  }, [isSuccessTaxIds])

  const hasChanges = !isEqual(taxIdValues, formattedTaxIds)
  const canReadTaxIds = useCheckPermissions(PermissionAction.BILLING_READ, 'stripe.tax_ids')
  const canUpdateTaxIds = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.tax_ids')

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
    const updatedTaxIds = taxIdValues.filter((taxId: StripeTaxId) => {
      return taxId.id !== id
    })
    setTaxIdValues(updatedTaxIds)
  }

  const onResetTaxIds = () => {
    setTaxIdValues(formattedTaxIds)
  }

  const onSaveTaxIds = async () => {
    if (!slug) return console.error('Slug is required')
    if (taxIds === undefined) return console.error('Tax IDs are required')

    const newIds = taxIdValues.map((x) => sanitizeTaxID(x))
    updateTaxIDs({ slug, existingIds: taxIds, newIds })
  }

  return (
    <div className="space-y-2">
      <div>
        <h4>Tax ID</h4>
        <p className="text-sm opacity-50">
          If you would like to include specific tax ID(s) to your invoices. <br />
          Make sure the tax ID looks exactly like the placeholder text.
        </p>
      </div>

      {isLoadingTaxIds && <GenericSkeletonLoader />}

      {!isLoadingTaxIds && !canReadTaxIds && (
        <Panel>
          <NoPermission resourceText="to view this organization's tax IDs" />
        </Panel>
      )}

      {isErrorTaxIds && <AlertError error={taxIdsError} subject="Failed to retrieve tax IDs" />}

      {isSuccessTaxIds && (
        <Panel
          footer={
            !isLoadingTaxIds && (
              <div className="flex w-full justify-between">
                {!canUpdateTaxIds ? (
                  <p className="text-sm text-foreground-light">
                    You need additional permissions to update this organization's tax IDs
                  </p>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-2">
                  <Button
                    type="default"
                    htmlType="reset"
                    disabled={!hasChanges || isUpdating}
                    onClick={() => onResetTaxIds()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={!hasChanges || isUpdating}
                    onClick={() => onSaveTaxIds()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )
          }
        >
          <Panel.Content className="w-8/12 space-y-4">
            {taxIdValues.length >= 1 ? (
              <div className="w-full space-y-2">
                {taxIdValues.map((taxId: StripeTaxId, idx: number) => {
                  const selectedTaxId = TAX_IDS.find((option) => option.name === taxId.name)

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
                        onChange={(e: any) => onUpdateTaxId(taxId.id, 'value', e.target.value)}
                        disabled={!canUpdateTaxIds}
                      />
                      {canUpdateTaxIds && (
                        <Button
                          type="text"
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
                <p className="flex items-center space-x-2 text-sm text-foreground-lighter">
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
          </Panel.Content>
        </Panel>
      )}
    </div>
  )
}

export default TaxID
