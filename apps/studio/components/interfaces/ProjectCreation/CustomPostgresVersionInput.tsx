import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'

interface CustomPostgresVersionInputProps {
  form: UseFormReturn<CreateProjectForm>
}

export const CustomPostgresVersionInput = ({ form }: CustomPostgresVersionInputProps) => {
  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="postgresVersion"
        render={({ field }) => (
          <FormItemLayout
            label="Custom Postgres version"
            layout="horizontal"
            description="Specify a custom version of Postgres (defaults to the latest). This is only applicable for local/staging projects."
          >
            <FormControl>
              <Input_Shadcn_ placeholder="Postgres version" {...field} autoComplete="off" />
            </FormControl>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
