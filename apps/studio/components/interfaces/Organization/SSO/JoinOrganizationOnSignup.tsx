import { useForm } from 'react-hook-form'
import {
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
      <FormField
        control={form.control}
        name="joinOrgOnSignup"
        render={({ field }) => (
          <FormItemLayout
            layout="flex-row-reverse"
            label="Automatically add users to organization on sign up"
            description="If disabled, users will need to be invited to the organization after signing up"
          >
            <FormControl className="flex items-center gap-2">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItemLayout>
        )}
      />
      {joinOrgOnSignup && (
        <FormField
          control={form.control}
          name="roleOnJoin"
          render={({ field }) => (
            <FormItemLayout
              label="Default role on join"
              description="Select a role for the user when they join the organization"
              layout="flex-row-reverse"
              className="justify-between"
            >
              <FormControl>
                <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Read-only">Read-only</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />
      )}
    </div>
  )
}
