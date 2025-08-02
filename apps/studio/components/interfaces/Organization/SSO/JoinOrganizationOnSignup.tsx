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
            layout="flex-row-reverse"
            label="Automatically add users to organization on sign up"
            description="If disabled, users will need to be invited to the organization after signing up"
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
              label="Default role on join"
              description="Select a role for the user when they join the organization"
              layout="flex-row-reverse"
              className="justify-between"
            >
              <FormControl_Shadcn_>
                <Select_Shadcn_ value={field.value} onValueChange={(val) => field.onChange(val)}>
                  <SelectTrigger_Shadcn_ className="w-52">
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
            </FormItemLayout>
          )}
        />
      )}
    </div>
  )
}
