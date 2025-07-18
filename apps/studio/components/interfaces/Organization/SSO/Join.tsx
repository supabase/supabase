import { useForm } from 'react-hook-form'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SSOConfigForm } from './SSOConfig'

const Domains = ({ form }: { form: ReturnType<typeof useForm<SSOConfigForm>> }) => {
  return (
    <>
      <FormField_Shadcn_
        control={form.control}
        name="joinOrgOnSignup"
        render={({ field }) => (
          <FormItemLayout
            label="Join Organization on Signup"
            description="Automatically join users to the organization when they sign up"
            layout="flex-row-reverse"
            className="gap-1 relative justify-between pb-4"
          >
            <FormControl_Shadcn_ className="flex items-center gap-2">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl_Shadcn_>

            {form.watch('joinOrgOnSignup') && (
              <div className="grid gap-2 w-96 mt-12">
                <FormControl_Shadcn_>
                  <>
                    <Label_Shadcn_ htmlFor="roleOnJoin" className="">
                      Choose a role for the user when they join the organization
                    </Label_Shadcn_>
                    <Select_Shadcn_
                      value={form.watch('roleOnJoin') || 'developer'}
                      onValueChange={(val) => form.setValue('roleOnJoin', val)}
                      defaultValue="developer"
                    >
                      <SelectTrigger_Shadcn_ className="w-full">
                        <SelectValue_Shadcn_ placeholder="Select a role" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          <SelectItem_Shadcn_ value="owner">Owner</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="administrator">
                            Administrator
                          </SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="developer">Developer</SelectItem_Shadcn_>
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </>
                </FormControl_Shadcn_>
              </div>
            )}
          </FormItemLayout>
        )}
      />
    </>
  )
}
export default Domains
