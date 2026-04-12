import { useForm } from 'react-hook-form'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'

import { SSOConfigFormSchema } from './SSOConfig'

export const SSODomains = ({ form }: { form: ReturnType<typeof useForm<SSOConfigFormSchema>> }) => {
  return (
    <FormItemLayout
      label="Domains"
      layout="flex-row-reverse"
      description="Provide one or more domains"
    >
      <SingleValueFieldArray
        control={form.control}
        name="domains"
        valueFieldName="value"
        createEmptyRow={() => ({ value: '' })}
        placeholder="example.com"
        addLabel="Add another"
        removeLabel="Remove domain"
        minimumRows={1}
        inputAutoComplete="off"
        className="w-96"
        rowsClassName="grid gap-2 w-full"
        addButtonType="default"
        addButtonSize="tiny"
        addButtonClassName="w-auto"
      />
    </FormItemLayout>
  )
}
