import { FC, useEffect, useState } from 'react'
import { isEqual } from 'lodash'
import { Input, Button, IconPlus, Select, IconX } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useFlag, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { post, delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import Panel from 'components/ui/Panel'
import { TAX_IDS } from './TaxID.constants'
import NoPermission from 'components/ui/NoPermission'

interface Props {
  loading: boolean
  taxIds: any[]
  onTaxIdsUpdated: (taxIds: any) => void
}

// Stripe recommends to delete tax ids and create new ones to update
// https://stripe.com/docs/billing/customer/tax-ids

const TaxID: FC<Props> = ({ loading, taxIds, onTaxIdsUpdated }) => {
  const { ui } = useStore()
  const slug = ui.selectedOrganization?.slug ?? ''

  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [taxIdValues, setTaxIdValues] = useState(taxIds)
  const formattedTaxIds = taxIds.map((taxId: any) => {
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
    if (taxIdValues.length === 0) {
      setTaxIdValues(formattedTaxIds)
    } else {
      const erroredTaxIds = taxIdValues.filter((taxId: any) => errors.includes(taxId.id))
      setTaxIdValues(formattedTaxIds.concat(erroredTaxIds))
    }
  }, [taxIds])

  const hasChanges = !isEqual(taxIdValues, formattedTaxIds)

  const enablePermissions = useFlag('enablePermissions')
  const canReadTaxIds = checkPermissions(PermissionAction.BILLING_READ, 'stripe.tax_ids')
  const canUpdateTaxIds = enablePermissions
    ? checkPermissions(PermissionAction.BILLING_WRITE, 'stripe.tax_ids')
    : ui.selectedOrganization?.is_owner

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
    const updatedTaxIds = taxIdValues.filter((taxId: any) => {
      return taxId.id !== id
    })
    setTaxIdValues(updatedTaxIds)
  }

  const onResetTaxIds = () => {
    setTaxIdValues(formattedTaxIds)
  }

  const onSaveTaxIds = async () => {
    // To make things simple we delete all existing ones and create new ones from this session
    setIsSaving(true)
    try {
      const deletedIds = await Promise.all(
        taxIds.map(async (taxId: any) => {
          return await delete_(`${API_URL}/organizations/${slug}/tax-ids`, { id: taxId.id })
        })
      )

      const newIds = await Promise.all(
        taxIdValues.map(async (taxId: any) => {
          const result = await post(`${API_URL}/organizations/${slug}/tax-ids`, {
            type: taxId.type,
            value: taxId.value,
          })
          return { id: taxId.id, result }
        })
      )

      const taxIdsWithErrors = newIds.filter((taxId: any) => {
        if (taxId.result.error) return taxId
      })
      setErrors(taxIdsWithErrors.map((taxId: any) => taxId.id))

      if (taxIdsWithErrors.length > 0) {
        taxIdsWithErrors.forEach((taxId: any) => {
          ui.setNotification({ category: 'error', message: taxId.result.error.message })
        })
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully updated tax IDs' })
      }
      const idsCreated = newIds
        .filter((taxId: any) => !taxId.result.error)
        .map((taxId: any) => taxId.result)

      onTaxIdsUpdated(idsCreated)
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: 'Failed to save tax IDs' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <h4>Tax ID</h4>
        <p className="text-sm opacity-50">
          If you would like to include specific tax ID(s) to your invoices
        </p>
      </div>

      {!canReadTaxIds ? (
        <Panel>
          <NoPermission resourceText="to view this organization's tax IDs" />
        </Panel>
      ) : (
        <Panel
          loading={loading}
          footer={
            !loading && (
              <div className="flex justify-between w-full">
                {!canUpdateTaxIds ? (
                  <p className="text-sm text-scale-1000">
                    You need additional permissions to update this organization's tax IDs
                  </p>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-4">
                  <Button
                    type="default"
                    htmlType="reset"
                    disabled={!hasChanges || isSaving}
                    onClick={() => onResetTaxIds()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSaving}
                    disabled={!hasChanges || isSaving}
                    onClick={() => onSaveTaxIds()}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            )
          }
        >
          {loading && taxIdValues.length === 0 ? (
            <div className="flex flex-col justify-between space-y-2 py-4 px-4">
              <div className="shimmering-loader rounded py-3 mx-1 w-2/3" />
              <div className="shimmering-loader rounded py-3 mx-1 w-1/2" />
              <div className="shimmering-loader rounded py-3 mx-1 w-1/3" />
            </div>
          ) : (
            <Panel.Content className="w-3/5 space-y-4">
              {taxIdValues.length >= 1 ? (
                <div className="w-full space-y-2">
                  {taxIdValues.map((taxId: any, idx: number) => {
                    const selectedTaxId = TAX_IDS.find((option) => option.name === taxId.name)
                    return (
                      <div key={`tax-id-${idx}`} className="flex items-center space-x-2">
                        <Select
                          value={selectedTaxId?.name}
                          onChange={(e: any) => onUpdateTaxId(taxId.id, 'name', e.target.value)}
                          disabled={!canUpdateTaxIds}
                        >
                          {TAX_IDS.map((option) => (
                            <Select.Option key={option.name} value={option.name}>
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
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
                  <p className="flex items-center space-x-2 text-sm text-scale-900">No tax IDs</p>
                </div>
              )}
              {canUpdateTaxIds && (
                <div
                  className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition cursor-pointer"
                  onClick={() => onAddNewTaxId()}
                >
                  <IconPlus size={14} />
                  <p className="text-sm">Add another ID</p>
                </div>
              )}
            </Panel.Content>
          )}
        </Panel>
      )}
    </div>
  )
}

export default TaxID
