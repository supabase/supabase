import { Plus, Trash } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  SheetSection,
} from 'ui'
import { CreateCronJobForm } from './EditCronjobPanel'

interface HTTPParameterFieldsSectionProps {
  fieldName: 'edgeFunctionValues.httpParameters' | 'httpRequestValues.httpParameters'
}

export const HTTPParameterFieldsSection = ({ fieldName }: HTTPParameterFieldsSectionProps) => {
  // gets the fields through form context
  const { fields, append, remove } = useFieldArray<CreateCronJobForm>({
    name: fieldName,
  })

  return (
    <SheetSection>
      <span>HTTP Parameters</span>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2">
            <FormField_Shadcn_
              name={`${fieldName}.${index}.name`}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      size="small"
                      className="w-full"
                      placeholder="Parameter name"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              name={`${fieldName}.${index}.value`}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      value={field.value}
                      size="small"
                      className="w-full"
                      placeholder="Parameter value"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <Button
              type="default"
              icon={<Trash size={12} />}
              onClick={() => remove(index)}
              className="h-[34px] w-[34px]"
            />
          </div>
        ))}
        <div>
          <Button
            type="default"
            size="tiny"
            icon={<Plus />}
            onClick={() => append({ name: '', value: '' })}
          >
            Add a new parameter
          </Button>
        </div>
      </div>
    </SheetSection>
  )
}
