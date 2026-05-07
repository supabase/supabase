import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import { FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateProjectForm } from './ProjectCreation.schema'

interface ProjectNameInputProps {
  form: UseFormReturn<CreateProjectForm>
}

export const ProjectNameInput = ({ form }: ProjectNameInputProps) => {
  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="projectName"
        render={({ field }) => (
          <FormItemLayout label="Project name" layout="horizontal">
            <FormControl_Shadcn_>
              <Input_Shadcn_ {...field} placeholder="Project name" />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
