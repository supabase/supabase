import { UseFormReturn } from 'react-hook-form'
import { Badge, FormControl, FormField, SheetSection, Switch } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateQueueForm } from './CreateQueueSheet.schema'
import { Markdown } from '@/components/interfaces/Markdown'

export function RlsSection({
  form,
  isExposed,
  projectRef,
}: {
  form: UseFormReturn<CreateQueueForm>
  isExposed: boolean | undefined
  projectRef: string | undefined
}) {
  return (
    <SheetSection className="flex flex-col gap-y-2">
      <FormField
        control={form.control}
        name="enableRls"
        render={({ field }) => (
          <FormItemLayout
            layout="flex"
            label={
              <div className="flex items-center gap-x-2">
                <p>Enable Row Level Security (RLS)</p>
                <Badge variant="success">Recommended</Badge>
              </div>
            }
            description="Restrict access to your queue by enabling RLS and writing Postgres policies to control access for each role."
          >
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={field.disabled || isExposed}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />
      {!isExposed ? (
        <Admonition
          type="default"
          title="Row Level Security for queues is only relevant if exposure through PostgREST has been enabled"
        >
          <Markdown
            className="[&>p]:leading-normal!"
            content={`You may opt to manage your queues via any Supabase client libraries or PostgREST
                      endpoints by enabling this in the [queues settings](/project/${projectRef}/integrations/queues/settings).`}
          />
        </Admonition>
      ) : (
        <Admonition
          type="default"
          title="RLS must be enabled as queues are exposed via PostgREST"
          description="This is to prevent anonymous access to any of your queues"
        />
      )}
    </SheetSection>
  )
}
