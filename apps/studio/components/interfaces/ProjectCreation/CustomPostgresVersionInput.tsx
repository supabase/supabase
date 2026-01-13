import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import { FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateProjectForm } from './ProjectCreation.schema'

interface CustomPostgresVersionInputProps {
  form: UseFormReturn<CreateProjectForm>
}

export const CustomPostgresVersionInput = ({ form }: CustomPostgresVersionInputProps) => {
  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="postgresVersion"
        render={({ field }) => (
          <FormItemLayout
            label="Custom Postgres version"
            layout="horizontal"
            description="Specify a custom version of Postgres (defaults to the latest). This is only applicable for local/staging projects."
          >
            <FormControl_Shadcn_>
              <Input_Shadcn_ placeholder="Postgres version" {...field} autoComplete="off" />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
