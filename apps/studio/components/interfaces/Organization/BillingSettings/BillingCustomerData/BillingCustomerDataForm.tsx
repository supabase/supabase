import { Check, ChevronsUpDown, X } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { useState } from 'react'
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
  Input_Shadcn_,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { COUNTRIES } from './BillingAddress.constants'
import { TAX_IDS } from './TaxID.constants'

interface BillingCustomerDataFormProps {
  form: UseFormReturn<BillingCustomerDataFormValues>
  disabled?: boolean
  className?: string
}

// Define the expected form values structure and validation schema
export const BillingCustomerDataSchema = z
  .object({
    billing_name: z.string().min(3, 'Name must be at least 3 letters long'),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
    tax_id_type: z.string(),
    tax_id_value: z.string(),
    tax_id_name: z.string(),
  })
  .refine(
    (data) => {
      // its fine to just set the name, but once any other field is set, requires full address
      const hasAnyField = data.line1 || data.line2 || data.city || data.state || data.postal_code
      // If any field has value, country and line1 must have values.
      return !hasAnyField || (!!data.country && !!data.line1)
    },
    {
      message: 'Country and Address line 1 are required if any other field is provided.',
      path: ['line1'],
    }
  )
  .refine((data) => !(!!data.line1 && !data.country), {
    message: 'Please select a country',
    path: ['country'],
  })
  .refine((data) => !(!!data.country && !data.line1), {
    message: 'Please provide an address line 1',
    path: ['line1'],
  })

export type BillingCustomerDataFormValues = z.infer<typeof BillingCustomerDataSchema>

export const BillingCustomerDataForm = ({
  form,
  disabled = false,
  className,
}: BillingCustomerDataFormProps) => {
  const [showCountriesPopover, setShowCountriesPopover] = useState(false)
  const [showTaxIDsPopover, setShowTaxIDsPopover] = useState(false)

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

  const { tax_id_name } = form.watch()
  const selectedTaxId = TAX_IDS.find((option) => option.name === tax_id_name)

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <FormField
        control={form.control}
        name="billing_name"
        render={({ field }: { field: any }) => (
          <FormItemLayout hideMessage>
            <FormControl>
              <Input {...field} placeholder="Name" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItemLayout>
        )}
      />

      <FormField
        control={form.control}
        name="line1"
        render={({ field }: { field: any }) => (
          <FormItemLayout hideMessage>
            <FormControl>
              <Input {...field} placeholder="Address line 1" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItemLayout>
        )}
      />

      <FormField
        control={form.control}
        name="line2"
        render={({ field }: { field: any }) => (
          <FormItemLayout hideMessage>
            <FormControl>
              <Input {...field} placeholder="Address line 2 (Optional)" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItemLayout>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }: { field: any }) => (
            <FormItemLayout hideMessage>
              <Popover open={showCountriesPopover} onOpenChange={setShowCountriesPopover}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="default"
                      role="combobox"
                      size="medium"
                      disabled={disabled}
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
                <PopoverContent sameWidthAsTrigger className="p-0" align="start">
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
          render={({ field }: { field: any }) => (
            <FormItemLayout hideMessage>
              <FormControl>
                <Input {...field} placeholder="Postal code" disabled={disabled} />
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
          render={({ field }: { field: any }) => (
            <FormItemLayout hideMessage>
              <FormControl>
                <Input {...field} placeholder="City" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItemLayout>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }: { field: any }) => (
            <FormItemLayout hideMessage>
              <FormControl>
                <Input {...field} placeholder="State / Province" disabled={disabled} />
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
          render={({ field }) => (
            <FormItemLayout hideMessage layout="vertical" label="Tax ID">
              <Popover open={showTaxIDsPopover} onOpenChange={setShowTaxIDsPopover}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="default"
                      role="combobox"
                      size="medium"
                      disabled={disabled}
                      className={cn(
                        'w-full justify-between h-[34px]',
                        !selectedTaxId && 'text-muted'
                      )}
                      iconRight={
                        <ChevronsUpDown
                          className="ml-2 h-4 w-4 shrink-0 opacity-50"
                          strokeWidth={1.5}
                        />
                      }
                    >
                      {selectedTaxId
                        ? `${selectedTaxId.country} - ${selectedTaxId.name}`
                        : 'Select tax ID'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent sameWidthAsTrigger className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tax ID..." />
                    <CommandList>
                      <CommandEmpty>No tax ID found.</CommandEmpty>
                      <CommandGroup>
                        {TAX_IDS.sort((a, b) => a.country.localeCompare(b.country)).map(
                          (option) => (
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
                          )
                        )}
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
          <div className="flex items-center space-x-2">
            <FormField
              name="tax_id_value"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout hideMessage className="w-full">
                  <FormControl>
                    <Input_Shadcn_
                      {...field}
                      placeholder={selectedTaxId?.placeholder}
                      disabled={disabled}
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
