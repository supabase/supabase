import { UseFormReturn } from 'react-hook-form'

import FunctionSelector from 'components/ui/FunctionSelector'
import SchemaSelector from 'components/ui/SchemaSelector'
import { FormField_Shadcn_, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateCronJobForm } from './CreateCronJobSheet'

interface SqlFunctionSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const SqlFunctionSection = ({ form }: SqlFunctionSectionProps) => {
  const schema = form.watch('values.schema')

  return (
    <SheetSection className="flex flex-col gap-3 2xl:flex-row 2xl:[&>div]:w-full">
      <FormField_Shadcn_
        control={form.control}
        name="values.schema"
        render={({ field }) => (
          <FormItemLayout label="Schema" className="gap-1">
            <SchemaSelector
              size="small"
              className="w-56 2xl:w-full"
              selectedSchemaName={field.value}
              onSelectSchema={(name) => {
                field.onChange(name)
                // deselect the selected function when the schema is changed
                form.resetField('values.functionName')
              }}
            />
          </FormItemLayout>
        )}
      />

      <FormField_Shadcn_
        control={form.control}
        name="values.functionName"
        render={({ field }) => (
          <FormItemLayout label="Function name" className="gap-1">
            <FunctionSelector
              size="small"
              className="w-56 2xl:w-full"
              schema={schema}
              value={field.value}
              onChange={(name) => field.onChange(name)}
            />
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
