import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'

interface ProjectNameInputProps {
  form: UseFormReturn<CreateProjectForm>
}

export const ProjectNameInput = ({ form }: ProjectNameInputProps) => {
  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="projectName"
        render={({ field }) => (
          <FormItemLayout label="Project name" layout="horizontal">
            <FormControl>
              <Input_Shadcn_ {...field} placeholder="Project name" />
            </FormControl>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
