import { useForm } from 'react-hook-form'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'

import { SSOConfigFormSchema } from './SSOConfig'

export const SSODomains = ({ form }: { form: ReturnType<typeof useForm<SSOConfigFormSchema>> }) => {
  return (
    <>
      <FormItemLayout
        label="Email Domains"
        layout="flex-row-reverse"
        description="Users with these email domains will be redirected to your identity provider when logging in from Supabase."
      >
        <div className="grid gap-2 w-full">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-top">
              <FormField_Shadcn_
                name={`domains.${idx}.value`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} autoComplete="off" placeholder="example.com" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <Button
                type="default"
                icon={<Trash size={12} />}
                className="h-[34px] w-[34px]"
                disabled={fields.length <= 0}
                onClick={() => remove(idx)}
              />
            </div>
          ))}
          <div>
            <Button
              type="default"
              icon={<Plus className="w-4 h-4" />}
              size="tiny"
              onClick={() => append({ value: '' })}
            >
              Add another
            </Button>
          </div>
        </div>
      </FormItemLayout>
    </>
  )
}
