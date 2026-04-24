/**
 * Set up as a separate component, as we need any component using stripe/elements to be wrapped in Elements.
 *
 * If Elements is on a higher level, we risk losing all form state in case a payment fails.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { AddressElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { PaymentMethod } from '@stripe/stripe-js'
import {
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions,
  type SetupIntent,
} from '@stripe/stripe-js'
import { Form } from '@ui/components/shadcn/ui/form'
import { Check, ChevronsUpDown } from 'lucide-react'
import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Checkbox_Shadcn_,
  cn,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  FormItem_Shadcn_,
  FormMessage_Shadcn_ as FormMessage,
  Input_Shadcn_ as Input,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { TAX_IDS } from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/TaxID.constants'
import {
  getEffectiveTaxCountry,
  resolveStoredTaxId,
} from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/TaxID.utils'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { getURL } from '@/lib/helpers'

export const BillingCustomerDataSchema = z.object({
  tax_id_type: z.string(),
  tax_id_value: z.string().min(2, {
    message: 'Tax ID needs to be set.',
  }),
  tax_id_name: z.string(),
})

type BillingCustomerDataFormValues = z.infer<typeof BillingCustomerDataSchema>

export type PaymentMethodElementRef = {
  confirmSetup: () => Promise<
    | {
        setupIntent: SetupIntent
        address: CustomerAddress
        customerName: string
        taxId: CustomerTaxId | null
      }
    | undefined
  >
  createPaymentMethod: () => Promise<
    | {
        paymentMethod: PaymentMethod
        address: CustomerAddress | null
        customerName: string | null
        taxId: CustomerTaxId | null
      }
    | undefined
  >
  getFormValues: () => Promise<
    | {
        address: CustomerAddress
        customerName: string
        taxId: CustomerTaxId | null
      }
    | undefined
  >
}

export const NewPaymentMethodElement = forwardRef(
  (
    {
      email,
      readOnly,
      currentAddress,
      currentTaxId,
      customerName,
      onAddressChange,
      onAddressIncomplete,
      onTaxIdChange,
    }: {
      email?: string | null | undefined
      readOnly: boolean
      currentAddress?: CustomerAddress | null
      currentTaxId?: CustomerTaxId | null
      customerName?: string | undefined
      onAddressChange?: (address: CustomerAddress) => void
      onAddressIncomplete?: () => void
      onTaxIdChange?: (taxId: CustomerTaxId | null) => void
    },
    ref
  ) => {
    const stripe = useStripe()
    const elements = useElements()

    const form = useForm<BillingCustomerDataFormValues>({
      resolver: zodResolver(BillingCustomerDataSchema),
      defaultValues: {
        tax_id_name: currentTaxId
          ? (resolveStoredTaxId(currentTaxId.type, currentTaxId.country, currentAddress?.country)
              ?.name ?? '')
          : '',
        tax_id_type: currentTaxId ? currentTaxId.type : '',
        tax_id_value: currentTaxId ? currentTaxId.value : '',
      },
    })

    // To avoid rendering the business checkbox prematurely and causing weird layout shifts, we wait until the address element is fully loaded
    const [fullyLoaded, setFullyLoaded] = useState(false)

    const [showTaxIDsPopover, setShowTaxIDsPopover] = useState(false)
    const taxIdListboxId = useId()

    const onSelectTaxIdType = (name: string) => {
      const selectedTaxIdOption = TAX_IDS.find((option) => option.name === name)
      if (!selectedTaxIdOption) return
      form.setValue('tax_id_type', selectedTaxIdOption.type)
      form.setValue('tax_id_value', '')
      form.setValue('tax_id_name', name)
    }

    const { tax_id_name, tax_id_value } = form.watch()
    const selectedTaxId = TAX_IDS.find((option) => option.name === tax_id_name)

    const [purchasingAsBusiness, setPurchasingAsBusiness] = useState(currentTaxId != null)
    const [stripeAddress, setStripeAddress] = useState<
      StripeAddressElementChangeEvent['value'] | undefined
    >(undefined)
    useEffect(() => {
      if (!onTaxIdChange) return
      if (purchasingAsBusiness && selectedTaxId && tax_id_value) {
        onTaxIdChange({
          country: getEffectiveTaxCountry(selectedTaxId),
          type: selectedTaxId.type,
          value: tax_id_value,
        })
      } else {
        onTaxIdChange(null)
      }
    }, [purchasingAsBusiness, selectedTaxId, tax_id_value, onTaxIdChange])

    const addressCountry = stripeAddress?.address.country
    const availableTaxIds = useMemo(() => {
      const country = addressCountry || null

      return TAX_IDS.filter((taxId) => country == null || taxId.countryIso2 === country).sort(
        (a, b) => a.country.localeCompare(b.country)
      )
    }, [addressCountry])

    const createPaymentMethod = async (): ReturnType<
      PaymentMethodElementRef['createPaymentMethod']
    > => {
      if (!stripe || !elements) return
      const isValid = await form.trigger()

      if (
        purchasingAsBusiness &&
        availableTaxIds.length > 0 &&
        (!isValid || !form.getValues('tax_id_value'))
      ) {
        return
      }

      await elements.submit()

      // To avoid double 3DS confirmation, we just create the payment method here, as there might be a confirmation step while doing the actual payment
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      })
      if (error || paymentMethod == null) {
        toast.error(error?.message ?? ' Failed to process card details')
        return
      }

      const addressElement = await elements.getElement('address')!.getValue()
      return {
        paymentMethod,
        address: {
          ...addressElement.value.address,
          line2: addressElement.value.address.line2 || undefined,
        },
        customerName: addressElement.value.name,
        taxId: getConfiguredTaxId(),
      }
    }

    function getConfiguredTaxId(): CustomerTaxId | null {
      const isValidForCountry = selectedTaxId && availableTaxIds.includes(selectedTaxId)
      return purchasingAsBusiness && isValidForCountry
        ? {
            country: getEffectiveTaxCountry(selectedTaxId),
            type: selectedTaxId.type,
            value: form.getValues('tax_id_value'),
          }
        : null
    }

    const confirmSetup = async (): ReturnType<PaymentMethodElementRef['confirmSetup']> => {
      if (!stripe || !elements) return

      await elements.submit()

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: { return_url: `${getURL()}/org/_/billing` },
      })

      if (error || setupIntent == null) {
        toast.error(error?.message ?? ' Failed to process card details')
        return
      }

      const addressElement = await elements.getElement('address')!.getValue()
      return {
        setupIntent,
        address: {
          ...addressElement.value.address,
          line2: addressElement.value.address.line2 || undefined,
        },
        customerName: addressElement.value.name,
        taxId: getConfiguredTaxId(),
      }
    }

    const getFormValues = async (): ReturnType<PaymentMethodElementRef['getFormValues']> => {
      if (!elements) return

      const isValid = await form.trigger()
      if (
        purchasingAsBusiness &&
        availableTaxIds.length > 0 &&
        (!isValid || !form.getValues('tax_id_value'))
      ) {
        return
      }

      const { error: submitError } = await elements.submit()
      if (submitError) return

      const addressElement = await elements.getElement('address')!.getValue()

      return {
        address: {
          ...addressElement.value.address,
          line2: addressElement.value.address.line2 || undefined,
        },
        customerName: addressElement.value.name,
        taxId: getConfiguredTaxId(),
      }
    }

    useImperativeHandle(ref, () => ({
      createPaymentMethod,
      confirmSetup,
      getFormValues,
    }))

    const addressOptions: StripeAddressElementOptions = useMemo(
      () => ({
        mode: 'billing',
        autocomplete: {
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
          mode: 'google_maps_api',
        },
        display: { name: purchasingAsBusiness ? 'organization' : 'full' },
        // Use live form state (stripeAddress) so the address survives remounts triggered
        // by the purchasingAsBusiness toggle (which changes the key prop). Without this,
        // the element resets to the original currentAddress prop, causing the country to
        // revert and the tax ID selector to fall out of sync.
        defaultValues: {
          address: stripeAddress?.address ?? currentAddress ?? undefined,
          name: stripeAddress?.name ?? customerName,
        },
      }),
      [purchasingAsBusiness]
    )

    // Reset tax ID fields when the billing country changes and preselect the
    // first available tax ID for the new country.
    const prevCountryRef = useRef(addressCountry)
    useEffect(() => {
      if (!addressCountry) return

      const isCountryChange =
        prevCountryRef.current !== undefined && prevCountryRef.current !== addressCountry
      prevCountryRef.current = addressCountry

      // On country change: always reset to the new country's default
      // On initial load: only preselect if there's no existing tax id
      if (isCountryChange || !currentTaxId) {
        if (availableTaxIds.length) {
          const taxIdOption = availableTaxIds[0]
          form.setValue('tax_id_type', taxIdOption.type)
          form.setValue('tax_id_value', '')
          form.setValue('tax_id_name', taxIdOption.name)
        } else {
          form.setValue('tax_id_type', '')
          form.setValue('tax_id_value', '')
          form.setValue('tax_id_name', '')
        }
      }
    }, [availableTaxIds, addressCountry, currentTaxId, form])

    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground-lighter">
          Please ensure CVC and postal codes match what’s on file for your card.
        </p>

        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: { billingDetails: { email: email ?? undefined } },
            readOnly,
          }}
        />

        {fullyLoaded && (
          <div className="flex items-center space-x-2 py-4">
            <Checkbox_Shadcn_
              id="business"
              checked={purchasingAsBusiness}
              onCheckedChange={() => setPurchasingAsBusiness(!purchasingAsBusiness)}
            />
            <label htmlFor="business" className="text-foreground text-sm leading-none">
              I’m purchasing as a business
            </label>
          </div>
        )}

        <AddressElement
          options={addressOptions}
          // Force reload after changing purchasingAsBusiness setting, it seems like the element does not reload otherwise
          key={`address-elements-${purchasingAsBusiness}`}
          onChange={(evt) => {
            setStripeAddress(evt.value)
            if (evt.complete) {
              onAddressChange?.({
                ...evt.value.address,
                line2: evt.value.address.line2 || undefined,
              })
            } else {
              onAddressIncomplete?.()
            }
          }}
          onReady={() => setFullyLoaded(true)}
        />

        {purchasingAsBusiness && availableTaxIds.length > 0 && (
          <Form {...form}>
            <div className="grid grid-cols-2 gap-x-2 w-full">
              <FormField
                name="tax_id_name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout hideMessage layout="vertical">
                    <Popover open={showTaxIDsPopover} onOpenChange={setShowTaxIDsPopover}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="default"
                            role="combobox"
                            size="medium"
                            aria-expanded={showTaxIDsPopover}
                            aria-controls={taxIdListboxId}
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
                                      selectedTaxId?.name === option.name
                                        ? 'opacity-100'
                                        : 'opacity-0'
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
                <FormField
                  name="tax_id_value"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormControl>
                        <Input {...field} placeholder={selectedTaxId?.placeholder} />
                      </FormControl>
                      <FormMessage />
                    </FormItem_Shadcn_>
                  )}
                />
              )}
            </div>
          </Form>
        )}
      </div>
    )
  }
)

NewPaymentMethodElement.displayName = 'NewPaymentMethodElement'
