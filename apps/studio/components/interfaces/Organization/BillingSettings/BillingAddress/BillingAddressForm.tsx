import { UseFormReturn } from 'react-hook-form'
import { Check, ChevronsUpDown } from 'lucide-react'

import {
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  FormItem_Shadcn_ as FormItem,
  FormMessage_Shadcn_ as FormMessage,
  Input_Shadcn_ as Input,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  Button,
  cn,
} from 'ui'
import { COUNTRIES } from './BillingAddress.constants'
import { z } from 'zod'

interface BillingAddressFormProps {
  form: UseFormReturn<BillingAddressFormValues>
  disabled?: boolean
  className?: string
}

// Define the expected form values structure and validation schema
export const BillingAddressSchema = z
  .object({
    billing_name: z.string().min(3, 'Name must be at least 3 letters long'),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
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

export type BillingAddressFormValues = z.infer<typeof BillingAddressSchema>

const BillingAddressForm = ({ form, disabled = false, className }: BillingAddressFormProps) => {
  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <FormField
        control={form.control}
        name="billing_name"
        render={({ field }: { field: any }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Name" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="line1"
        render={({ field }: { field: any }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Address line 1" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="line2"
        render={({ field }: { field: any }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Address line 2 (Optional)" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }: { field: any }) => (
            <FormItem>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="default"
                      role="combobox"
                      size="medium"
                      disabled={disabled}
                      className={cn(
                        'w-full justify-between',
                        !field.value && 'text-muted-foreground'
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
                <PopoverContent className="w-full p-0" align="start">
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
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Postal code" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="City" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="State / Province" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

export default BillingAddressForm
