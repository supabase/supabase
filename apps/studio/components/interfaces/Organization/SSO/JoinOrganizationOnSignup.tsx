import { useForm } from 'react-hook-form'

import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SSOConfigFormSchema } from './SSOConfig'

export const JoinOrganizationOnSignup = ({
  form,
}: {
  form: ReturnType<typeof useForm<SSOConfigFormSchema>>
}) => {
  const joinOrgOnSignup = form.watch('joinOrgOnSignup')

  return (
    <div className="space-y-4">
      <FormField_Shadcn_
        control={form.control}
        name="joinOrgOnSignup"
        render={({ field }) => (
          <FormItemLayout
            label="Join Organization on Signup"
            description="Automatically join users to the organization when they sign up"
            layout="flex-row-reverse"
            className=""
          >
            <FormControl_Shadcn_ className="flex items-center gap-2">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
      {joinOrgOnSignup && (
        <FormField_Shadcn_
          control={form.control}
          name="roleOnJoin"
          render={({ field }) => (
            <FormItemLayout
              label="Default Role on Join"
              description="Choose a role for the user when they join the organization"
              layout="flex-row-reverse"
              className="justify-between"
            >
              <div className="w-96">
                <FormControl_Shadcn_>
                  <Select_Shadcn_ value={field.value} onValueChange={(val) => field.onChange(val)}>
                    <SelectTrigger_Shadcn_ className="w-full">
                      <SelectValue_Shadcn_ placeholder="Select a role" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        <SelectItem_Shadcn_ value="Owner">Owner</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="Administrator">Administrator</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="Developer">Developer</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="Read-only">Read-only</SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormControl_Shadcn_>
              </div>
            </FormItemLayout>
          )}
        />
      )}
    </div>
  )
}
