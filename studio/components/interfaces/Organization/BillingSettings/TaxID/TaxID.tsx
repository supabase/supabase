import { FC, useEffect, useState } from 'react'
import { isEqual } from 'lodash'
import { Input, Button, IconLoader, IconPlus, Select, IconX } from '@supabase/ui'

import { useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { post, delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import Panel from 'components/to-be-cleaned/Panel'
import { TAX_IDS } from './TaxID.constants'

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
    return { id: taxId.id, type: taxId.type, value: taxId.value }
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

  const onUpdateTaxId = (id: string, key: string, value: string) => {
    const updatedTaxIds = taxIdValues.map((taxId: any) => {
      if (taxId.id === id) {
        return { ...taxId, [key]: value }
      }
      return taxId
    })
    setTaxIdValues(updatedTaxIds)
  }

  const onAddNewTaxId = () => {
    const newTaxId = { id: uuidv4(), type: 'ae_trn', value: '' }
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
      <Panel
        loading={loading}
        footer={
          !loading && (
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
                  return (
                    <div key={`tax-id-${idx}`} className="flex items-center space-x-2">
                      <Select
                        value={taxId.type}
                        onChange={(e: any) => onUpdateTaxId(taxId.id, 'type', e.target.value)}
                      >
                        {Object.keys(TAX_IDS).map((taxId: string) => (
                          <Select.Option key={taxId} value={taxId}>
                            {taxId.replace('_', ' ').toUpperCase()}
                          </Select.Option>
                        ))}
                      </Select>
                      <Input
                        value={taxId.value}
                        placeholder={(TAX_IDS as any)[taxId.type]?.placeholder ?? ''}
                        onChange={(e: any) => onUpdateTaxId(taxId.id, 'value', e.target.value)}
                      />
                      <Button
                        type="text"
                        icon={<IconX />}
                        onClick={() => onRemoveTaxId(taxId.id)}
                      ></Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div>
                <p className="flex items-center space-x-2 text-sm text-scale-900">No tax IDs</p>
              </div>
            )}
            <div
              className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition cursor-pointer"
              onClick={() => onAddNewTaxId()}
            >
              <IconPlus size={14} />
              <p className="text-sm">Add another ID</p>
            </div>
          </Panel.Content>
        )}
      </Panel>
    </div>
  )
}

export default TaxID
