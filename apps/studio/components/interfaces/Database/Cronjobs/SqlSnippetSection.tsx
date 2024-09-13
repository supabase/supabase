import { UseFormReturn } from 'react-hook-form'

import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { FormField_Shadcn_, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateCronJobForm } from './EditCronjobPanel'

interface SqlSnippetSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const SqlSnippetSection = ({ form }: SqlSnippetSectionProps) => {
  return (
    <SheetSection>
      <FormField_Shadcn_
        control={form.control}
        name="sqlSnippetValues.snippet"
        render={({ field }) => (
          <FormItemLayout label="SQL Snippet">
            <CodeEditor
              id="create-cronjob-editor"
              language="pgsql"
              className="h-72"
              value={field.value}
              onInputChange={field.onChange}
            />
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
