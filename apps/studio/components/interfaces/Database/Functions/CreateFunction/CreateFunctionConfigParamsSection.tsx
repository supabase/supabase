import { useFormContext } from 'react-hook-form'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

type CreateFunctionConfigParamsFormValues = {
  config_params: Array<{ name: string; value: string }>
}

export const CreateFunctionConfigParamsSection = () => {
  const form = useFormContext<CreateFunctionConfigParamsFormValues>()

  return (
    <>
      <h5 className="text-base text-foreground">Configuration Parameters</h5>
      <KeyValueFieldArray
        control={form.control}
        name="config_params"
        keyFieldName="name"
        valueFieldName="value"
        createEmptyRow={() => ({ name: '', value: '' })}
        keyPlaceholder="parameter_name"
        valuePlaceholder="parameter_value"
        addLabel="Add a new config"
        removeLabel="Remove configuration parameter"
        rowsClassName="space-y-2 pt-4"
      />
    </>
  )
}
