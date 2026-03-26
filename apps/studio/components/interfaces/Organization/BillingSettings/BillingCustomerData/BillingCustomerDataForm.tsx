import { AddressElement } from '@stripe/react-stripe-js'
import type {
  StripeAddressElement,
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions,
} from '@stripe/stripe-js'
import { Check, ChevronsUpDown, Info, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Button,
  cn,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  FormMessage_Shadcn_ as FormMessage,
  Input_Shadcn_ as Input,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { TAX_IDS } from './TaxID.constants'

interface BillingCustomerDataFormProps {
  form: UseFormReturn<TaxIdFormValues>
  disabled?: boolean
  className?: string
  addressOptions: StripeAddressElementOptions
  resetKey: number
  onAddressChange: (evt: StripeAddressElementChangeEvent) => void
  onAddressReady?: (element: StripeAddressElement) => void
  addressCountry?: string
}

export const TaxIdSchema = z.object({
  tax_id_type: z.string(),
  tax_id_value: z.string(),
  tax_id_name: z.string(),
})

export type TaxIdFormValues = z.infer<typeof TaxIdSchema>

export const BillingCustomerDataForm = ({
  form,
  disabled = false,
  className,
  addressOptions,
  resetKey,
  onAddressChange,
  onAddressReady,
  addressCountry,
}: BillingCustomerDataFormProps) => {
  const [showTaxIDsPopover, setShowTaxIDsPopover] = useState(false)
  const taxIdListboxId = useId()

  const onSelectTaxIdType = (name: string) => {
    const selectedTaxIdOption = TAX_IDS.find((option) => option.name === name)
    if (!selectedTaxIdOption) return
    form.setValue('tax_id_type', selectedTaxIdOption.type, { shouldDirty: true })
    form.setValue('tax_id_value', '', { shouldDirty: true })
    form.setValue('tax_id_name', name, { shouldDirty: true })
  }

  const onRemoveTaxId = () => {
    form.setValue('tax_id_name', '', { shouldDirty: true })
    form.setValue('tax_id_type', '', { shouldDirty: true })
    form.setValue('tax_id_value', '', { shouldDirty: true })
  }

  const { tax_id_name } = form.watch()
  const selectedTaxId = TAX_IDS.find((option) => option.name === tax_id_name)

  const availableTaxIds = useMemo(() => {
    return TAX_IDS.filter((taxId) => !addressCountry || taxId.countryIso2 === addressCountry).sort(
      (a, b) => a.country.localeCompare(b.country)
    )
  }, [addressCountry])

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <div className={cn('relative', disabled && 'opacity-50')}>
        <AddressElement
          key={`billing-address-${resetKey}`}
          options={addressOptions}
          onChange={onAddressChange}
          onReady={onAddressReady}
        />
        {disabled && <div className="absolute inset-0 z-10 cursor-not-allowed" />}
      </div>

      <div className={cn('grid grid-cols-2 gap-x-6 w-full items-end', disabled && 'opacity-50')}>
        <FormField
          name="tax_id_name"
          control={form.control}
          render={() => (
            <FormItemLayout
              hideMessage
              layout="vertical"
              label="Business Tax ID"
              afterLabel={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="text-foreground-lighter cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-left">
                    If you are an individual, no need to add a Tax ID. If you are a business below
                    your country's income threshold and don't have a Tax ID, you can leave this
                    blank. Taxes will be added to your invoice according to your country's tax laws
                    in the near future.
                  </TooltipContent>
                </Tooltip>
              }
            >
              <Popover open={showTaxIDsPopover} onOpenChange={setShowTaxIDsPopover}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="default"
                      role="combobox"
                      size="medium"
                      disabled={disabled}
                      aria-expanded={showTaxIDsPopover}
                      aria-controls={taxIdListboxId}
                      className={cn(
                        'w-full justify-between h-[34px] pr-2',
                        !selectedTaxId && 'text-muted'
                      )}
                      iconRight={
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" strokeWidth={1.5} />
                      }
                    >
                      {selectedTaxId
                        ? `${selectedTaxId.country} - ${selectedTaxId.name}`
                        : 'Select tax ID'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  id={taxIdListboxId}
                  sameWidthAsTrigger
                  className="p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search tax ID..." />
                    <CommandList>
                      <CommandEmpty>No tax ID found.</CommandEmpty>
                      <CommandGroup>
                        {availableTaxIds.map((option) => (
                          <CommandItem
                            key={option.name}
                            value={`${option.country} - ${option.name}`}
                            onSelect={() => {
                              onSelectTaxIdType(option.name)
                              setShowTaxIDsPopover(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedTaxId?.name === option.name ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {option.country} - {option.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItemLayout>
          )}
        />

        {selectedTaxId && (
          <div className="flex items-center space-x-2 [&>div]:w-full">
            <FormField
              name="tax_id_value"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout hideMessage>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={disabled}
                      placeholder={selectedTaxId?.placeholder}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <Button
              type="text"
              className="px-1"
              icon={<X />}
              disabled={disabled}
              onClick={() => onRemoveTaxId()}
            />
          </div>
        )}
      </div>
    </div>
  )
}
