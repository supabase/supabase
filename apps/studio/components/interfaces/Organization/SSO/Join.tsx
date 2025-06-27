import { MinusCircle, Plus } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button, FormControl_Shadcn_, Input_Shadcn_, Separator } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SSOConfigForm } from './SSOConfig'

const Domains = ({ form }: { form: ReturnType<typeof useForm<SSOConfigForm>> }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'joinOrgOnSignup',
  })

  return (
    <>
      <FormItemLayout
        label="Join Organization on Signup"
        layout="flex-row-reverse"
        description="Automatically join users to the organization when they sign up"
        className="gap-1 catz"
      >
        not sure what this is yet
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
