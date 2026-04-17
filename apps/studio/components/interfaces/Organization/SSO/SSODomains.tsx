import { Plus, Trash } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { SSOConfigFormSchema } from './SSOConfig'

export const SSODomains = ({ form }: { form: ReturnType<typeof useForm<SSOConfigFormSchema>> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'domains',
  })

  const domainsError = form.formState.errors.domains
  // Handle different error structures - could be root error or direct error
  const arrayLevelError =
    domainsError &&
    typeof domainsError === 'object' &&
    'message' in domainsError &&
    typeof domainsError.message === 'string'
      ? domainsError.message
      : domainsError &&
          typeof domainsError === 'object' &&
          'root' in domainsError &&
          domainsError.root &&
          typeof domainsError.root === 'object' &&
          'message' in domainsError.root
        ? String(domainsError.root.message)
        : null

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
          {arrayLevelError && (
            <p className="text-sm font-medium text-destructive">{arrayLevelError}</p>
          )}
        </div>
      </FormItemLayout>
    </>
  )
}
