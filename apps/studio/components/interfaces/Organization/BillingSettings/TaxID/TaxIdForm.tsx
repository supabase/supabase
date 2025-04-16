import { UseFormReturn } from 'react-hook-form'
import { X } from 'lucide-react'

import {
  Button,
  cn,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormControl_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { z } from 'zod'
import { TAX_IDS } from './TaxID.constants'

interface TaxIdFormProps {
  form: UseFormReturn<TaxIdFormValues>
  disabled?: boolean
  className?: string
  canUpdateTaxId?: boolean
}

// Define the expected form values structure and validation schema
export const TaxIdSchema = z.object({
  type: z.string(),
  value: z.string(),
  name: z.string(),
})
export type TaxIdFormValues = z.infer<typeof TaxIdSchema>

const TaxIdForm = ({ form, className, canUpdateTaxId }: TaxIdFormProps) => {
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
    <div className={cn('flex flex-col space-y-4', className)}>
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
                    {TAX_IDS.sort((a, b) => a.country.localeCompare(b.country)).map((option) => (
                      <SelectItem_Shadcn_ key={option.name} value={option.name}>
                        {option.country} - {option.name}
                      </SelectItem_Shadcn_>
                    ))}
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

          <Button type="text" className="px-1" icon={<X />} onClick={() => onRemoveTaxId()} />
        </div>
      )}
    </div>
  )
}

export default TaxIdForm
