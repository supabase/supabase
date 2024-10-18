import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

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
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { TAX_IDS } from './TaxID.constants'
import { checkTaxIdEqual, sanitizeTaxIdValue } from './TaxID.utils'
import { X } from 'lucide-react'

const TaxID = () => {
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()

  const { data: taxId, error, isLoading, isSuccess, isError } = useOrganizationTaxIdQuery({ slug })
  const { mutate: updateTaxId, isLoading: isUpdating } = useOrganizationTaxIdUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated tax id')
    },
  })

  const FormSchema = z.object({ type: z.string(), value: z.string(), name: z.string() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { type: '', value: '', name: '' },
  })

  const formattedTaxId = taxId
    ? {
        type: taxId.type,
        value: taxId.value,
        name:
          TAX_IDS.find(
            (option) => option.type === taxId.type && option.countryIso2 === taxId.country
          )?.name ?? '',
      }
    : { type: '', value: '', name: '' }

  const hasChanges = !checkTaxIdEqual(form.getValues(), formattedTaxId)
  const canReadTaxId = useCheckPermissions(PermissionAction.BILLING_READ, 'stripe.tax_ids')
  const canUpdateTaxId = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.tax_ids')

  useEffect(() => {
    if (isSuccess && formattedTaxId) {
      form.setValue('type', formattedTaxId.type)
      form.setValue('value', formattedTaxId.value)
      form.setValue('name', formattedTaxId.name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  const onSaveTaxId = async () => {
    if (!slug) return console.error('Slug is required')

    const { type, value } = form.getValues()

    if (type?.length && !value?.length) {
      form.setError('value', { message: 'Value is required' })
      return
    }

    updateTaxId({
      slug,
      taxId:
        type?.length && value?.length
          ? {
              type: type,
              value: sanitizeTaxIdValue({ value, name: form.getValues().name }),
              country: selectedTaxId?.countryIso2,
            }
          : null,
    })
  }

  const onResetTaxIds = () => {
    form.setValue('type', formattedTaxId.type)
    form.setValue('value', formattedTaxId.value)
    form.setValue('name', formattedTaxId.name)
  }

  const onSelectTaxIdType = (name: string) => {
    const selectedTaxIdOption = TAX_IDS.find((option) => option.name === name)
    if (!selectedTaxIdOption) return
    form.setValue('type', selectedTaxIdOption.type)
    form.setValue('value', '')
    form.setValue('name', name)
  }

  const onRemoveTaxId = () => {
    form.reset()
  }

  const { name } = form.watch()

  const selectedTaxId = TAX_IDS.find((option) => option.name === name)

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
                    isSubmitting={isUpdating}
                    hasChanges={hasChanges}
                    handleReset={() => onResetTaxIds()}
                    helper={
                      !canUpdateTaxId
                        ? "You need additional permissions to manage this organization's tax ID"
                        : undefined
                    }
                  />
                }
              >
                <Form_Shadcn_ {...form}>
                  <form
                    id="tax-id-form"
                    className="grid grid-cols-2 gap-2 w-full py-8 px-8 items-center"
                    onSubmit={form.handleSubmit(() => onSaveTaxId())}
                  >
                    <FormField_Shadcn_
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem_Shadcn_>
                          <FormControl_Shadcn_>
                            <Select_Shadcn_
                              {...field}
                              disabled={!canUpdateTaxId}
                              value={field.value}
                              onValueChange={(value) => onSelectTaxIdType(value)}
                            >
                              <SelectTrigger_Shadcn_>
                                <SelectValue_Shadcn_ placeholder="None" />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
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
                          </FormControl_Shadcn_>
                        </FormItem_Shadcn_>
                      )}
                    />

                    {selectedTaxId && (
                      <div className="flex items-center space-x-2">
                        <FormField_Shadcn_
                          name="value"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem_Shadcn_ className="w-full">
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder={selectedTaxId?.placeholder}
                                  disabled={!canUpdateTaxId}
                                />
                              </FormControl_Shadcn_>
                            </FormItem_Shadcn_>
                          )}
                        />

                        <Button
                          type="text"
                          className="px-1"
                          icon={<X />}
                          onClick={() => onRemoveTaxId()}
                        />
                      </div>
                    )}
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
