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
import { BillingAddressFormValues } from './useBillingAddressForm'

interface BillingAddressFormProps {
  form: UseFormReturn<BillingAddressFormValues>
  disabled?: boolean
  className?: string
}

const BillingAddressForm = ({ form, disabled = false, className }: BillingAddressFormProps) => {
  return (
    <div className={cn('flex flex-col space-y-4', className)}>
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
