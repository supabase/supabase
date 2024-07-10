import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { useHardenAPIMutation } from 'data/api-settings/harden-api-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useEffect } from 'react'
import {
  Button,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'
import { ExternalLink } from 'lucide-react'

interface HardenAPIModalProps {
  visible: boolean
  onClose: () => void
}

export const HardenAPIModal = ({ visible, onClose }: HardenAPIModalProps) => {
  const project = useSelectedProject()

  const FormSchema = z.object({
    schema: z.string().min(1, 'Please provide a name for your custom schema'),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { schema: '' },
  })
  const { schema } = form.watch()

  const { mutate: enactChangesToHardenAPI, isLoading } = useHardenAPIMutation({
    onSuccess: (_, vars) => {
      toast.success(
        `Successfully enacted change: schema ${vars.schema} has been created and exposed via Data API, while the public schema is no longer accessible via the Data API`,
        { duration: 10000 }
      )
      onClose()
    },
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (project === undefined) return console.error('Project is required')
    enactChangesToHardenAPI({
      schema: data.schema,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  useEffect(() => {
    if (visible) form.reset({ schema: '' })
  }, [visible])

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent size="large">
        <Form_Shadcn_ {...form}>
          <form id="harden-api-form" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Prevent accidental exposure of data via the API</DialogTitle>
              <DialogDescription>
                Expose a custom schema instead of the{' '}
                <code className="text-xs text-foreground">public</code> schema
              </DialogDescription>
            </DialogHeader>

            <DialogSectionSeparator />

            <DialogSection className="text-sm text-foreground-light">
              <p>
                If you want to use the Data API with increased security, we recommend exposing a
                custom schema instead of the <code className="text-xs text-foreground">public</code>{' '}
                schema to get more <span className="text-brand">conscious control</span> over your
                exposed data. Any data, views, or functions that should be exposed need to be
                deliberately put within your custom schema instead.
              </p>
              <p className="mt-2">
                This will be particularly useful if your{' '}
                <code className="text-xs text-foreground">public</code> schema is used by other
                tools as a default space, as it will help{' '}
                <span className="text-brand">prevent accidental exposure of data</span> that's
                automatically added to the <code className="text-xs text-foreground">public</code>{' '}
                schema.
              </p>
              <Button asChild type="default" icon={<ExternalLink />} className="w-min mt-4">
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://supabase.com/docs/guides/database/hardening-data-api"
                >
                  Documentation
                </a>
              </Button>
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection className="text-sm text-foreground-light flex flex-col gap-y-1">
              <p>
                Upon clicking{' '}
                <span className="text-foreground">"Enact changes to harden Data API"</span>, we
                will:
              </p>
              <ul className="list-disc pl-6">
                <li>
                  Remove the <code className="text-xs text-foreground">public</code> schema from the
                  exposed schemas
                </li>
                <li>Create a custom schema based on a provided name and expose it instead</li>
              </ul>
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection className="text-sm text-foreground-light flex flex-col gap-y-4">
              <FormField_Shadcn_
                name="schema"
                control={form.control}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="relative flex flex-col gap-y-2">
                    <Label_Shadcn_>Provide a name for your custom schema</Label_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="e.g api" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <div className="flex flex-col gap-y-2">
                <p>
                  Under these new settings, <code className="text-xs text-foreground">anon</code>{' '}
                  and <code className="text-xs text-foreground">authenticated</code> roles can
                  execute functions defined in your custom schema, but they have no automatic
                  permissions on any tables. You can grant them permissions on a table-by-table
                  basis as follows:
                </p>
                <CodeBlock
                  language="sql"
                  className="p-1 language-bash prose dark:prose-dark max-w-[68.5ch]"
                >
                  {`grant select on table ${schema.length > 0 ? schema : 'custom_schema'}.<your_table> to anon;\ngrant select, insert, update, delete on table ${schema.length > 0 ? schema : 'custom_schema'}.<your_table> to authenticated;`}
                </CodeBlock>
              </div>
            </DialogSection>

            <DialogFooter>
              <Button type="default" disabled={isLoading} onClick={() => onClose()}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                Enact changes to harden Data API
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
