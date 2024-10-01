import { UseFormReturn } from 'react-hook-form'

import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { FormField_Shadcn_, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateCronJobForm } from './CreateCronjobSheet'

interface SqlSnippetSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const SqlSnippetSection = ({ form }: SqlSnippetSectionProps) => {
  return (
    <SheetSection>
      <FormField_Shadcn_
        control={form.control}
        name="values.snippet"
        render={({ field }) => (
          <FormItemLayout label="SQL Snippet">
            <CodeEditor
              id="create-cron-job-editor"
              language="pgsql"
              className="h-72"
              autofocus={false}
              value={field.value}
              onInputChange={field.onChange}
            />
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
