import { MinusCircle, Plus } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button, FormControl_Shadcn_, Input_Shadcn_, Separator } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SSOConfigForm } from './SSOConfig'

const Domains = ({ form }: { form: ReturnType<typeof useForm<SSOConfigForm>> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'domains',
  })

  return (
    <>
      <FormItemLayout
        label="Domains"
        layout="flex-row-reverse"
        description="Add one or more domains"
        className="gap-1 catz"
      >
        <div className="grid gap-2 w-96">
          {fields.length === 0 ? (
            <div className="flex gap-2 items-center">
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  {...form.register(`domains.0.value` as const)}
                  placeholder="example.com"
                  autoComplete="off"
                />
              </FormControl_Shadcn_>
              <Button
                type="text"
                className="h-[34px]"
                icon={<MinusCircle />}
                size="small"
                disabled
              />
            </div>
          ) : (
            fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-center">
                <FormControl_Shadcn_>
                  <Input_Shadcn_
                    {...form.register(`domains.${idx}.value` as const)}
                    placeholder="example.com"
                    autoComplete="off"
                  />
                </FormControl_Shadcn_>

                <Button
                  type="text"
                  className="h-[34px]"
                  icon={<MinusCircle />}
                  size="small"
                  onClick={() => remove(idx)}
                />
              </div>
            ))
          )}
          <div>
            <Button
              type="text"
              icon={<Plus className="w-4 h-4" />}
              size="tiny"
              onClick={() => append({ value: '' })}
            >
              Add another
            </Button>
          </div>
        </div>
        {form.formState.errors.domains && (
          <span className="text-red-600 text-xs mt-1">
            {form.formState.errors.domains.message as string}
          </span>
        )}
      </FormItemLayout>
    </>
  )
}
export default Domains
