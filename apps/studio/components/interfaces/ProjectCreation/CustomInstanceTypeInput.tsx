import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'

interface CustomInstanceTypeInputProps {
  form: UseFormReturn<CreateProjectForm>
}

export const CustomInstanceTypeInput = ({ form }: CustomInstanceTypeInputProps) => {
  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="instanceType"
        render={({ field }) => (
          <FormItemLayout
            label="Custom instance type"
            layout="horizontal"
            description="Specify a custom instance type (e.g. t4g.micro). This is only applicable for local/staging projects."
          >
            <FormControl>
              <Input_Shadcn_ placeholder="Instance type" {...field} autoComplete="off" />
            </FormControl>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
