import { Check, ChevronsUpDown, X } from 'lucide-react'
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
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { COUNTRIES } from './BillingAddress.constants'
import { TAX_IDS } from './TaxID.constants'

interface BillingCustomerDataFormProps {
  form: UseFormReturn<BillingCustomerDataFormValues>
  disabled?: boolean
  className?: string
}

// Define the expected form values structure and validation schema
export const BillingCustomerDataSchema = z.object({
  billing_name: z.string().min(3, 'Name must be at least 3 letters long'),
  line1: z.string().trim().min(3, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim(),
  postal_code: z.string().trim().min(1, 'Postal code is required'),
  country: z.string().trim().min(1, 'Country is required'),
  tax_id_type: z.string(),
  tax_id_value: z.string(),
  tax_id_name: z.string(),
})

export type BillingCustomerDataFormValues = z.infer<typeof BillingCustomerDataSchema>

export const BillingCustomerDataForm = ({
  form,
  disabled = false,
  className,
}: BillingCustomerDataFormProps) => {
  const [showCountriesPopover, setShowCountriesPopover] = useState(false)
  const [showTaxIDsPopover, setShowTaxIDsPopover] = useState(false)
  const countryListboxId = useId()
  const taxIdListboxId = useId()

  const onSelectTaxIdType = (name: string) => {
    const selectedTaxIdOption = TAX_IDS.find((option) => option.name === name)
    if (!selectedTaxIdOption) return
    form.setValue('tax_id_type', selectedTaxIdOption.type)
    form.setValue('tax_id_value', '')
    form.setValue('tax_id_name', name)
  }

  const onRemoveTaxId = () => {
    form.setValue('tax_id_name', '', { shouldDirty: true })
    form.setValue('tax_id_type', '', { shouldDirty: true })
    form.setValue('tax_id_value', '', { shouldDirty: true })
  }

  const { tax_id_name, country } = form.watch()
  const selectedTaxId = TAX_IDS.find((option) => option.name === tax_id_name)

  const availableTaxIds = useMemo(() => {
    return TAX_IDS.filter((taxId) => !country || taxId.countryIso2 === country).sort((a, b) =>
      a.country.localeCompare(b.country)
    )
  }, [country])

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <FormField
        control={form.control}
        name="billing_name"
        render={({ field }) => (
          <FormItemLayout hideMessage label="Name">
            <FormControl>
              <Input {...field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItemLayout>
        )}
      />

      <FormField
        control={form.control}
        name="line1"
        render={({ field }) => (
          <FormItemLayout hideMessage label="Address line 1">
            <FormControl>
              <Input {...field} placeholder="123 Main Street" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItemLayout>
        )}
      />

      <FormField
        control={form.control}
        name="line2"
        render={({ field }) => (
          <FormItemLayout hideMessage label="Address line 2 (optional)">
            <FormControl>
              <Input
                {...field}
                placeholder="Apartment, suite, unit, building, floor, etc."
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItemLayout>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItemLayout hideMessage label="Country">
              <Popover open={showCountriesPopover} onOpenChange={setShowCountriesPopover}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="default"
                      role="combobox"
                      size="medium"
                      disabled={disabled}
                      aria-expanded={showCountriesPopover}
                      aria-controls={countryListboxId}
                      className={cn(
                        'w-full justify-between h-[34px]',
                        !field.value && 'text-muted'
                      )}
                      iconRight={
                        <ChevronsUpDown
                          className="ml-2 h-4 w-4 shrink-0 opacity-50"
                          strokeWidth={1.5}
                        />
                      }
                    >
                      {field.value
                        ? COUNTRIES.find((country) => country.code === field.value)?.name ||
                          'Select country'
                        : 'Select country'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  id={countryListboxId}
                  sameWidthAsTrigger
                  className="p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRIES.map((country) => (
                          <CommandItem
                            key={country.code}
                            value={country.name}
                            onSelect={() => {
                              form.setValue('country', country.code, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              })
                              setShowCountriesPopover(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                field.value === country.code ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {country.name}
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
        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }) => (
            <FormItemLayout hideMessage label="Postal code">
              <FormControl>
                <Input {...field} placeholder="12345" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItemLayout>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItemLayout hideMessage label="City">
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItemLayout>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItemLayout hideMessage label="State / Province">
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItemLayout>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-2 w-full items-end">
        <FormField
          name="tax_id_name"
          control={form.control}
          render={() => (
            <FormItemLayout hideMessage layout="vertical" label="Tax ID">
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

            <Button type="text" className="px-1" icon={<X />} onClick={() => onRemoveTaxId()} />
          </div>
        )}
      </div>
    </div>
  )
}
