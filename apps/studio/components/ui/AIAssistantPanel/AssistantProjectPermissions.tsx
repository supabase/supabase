import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  RadioGroup,
  RadioGroupItem,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { AlertError } from '@/components/ui/AlertError'
import {
  useAssistantProjectPermissions,
  useUpdateAssistantProjectPermissions,
} from '@/data/ai-assistant/project-permissions-query'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'

const formSchema = z.object({ selection: z.string().min(1) })
const defaultValues: z.infer<typeof formSchema> = { selection: '' }
/** Render service-provided settings. Permission semantics and enforcement belong to Assistant. */
export function AssistantProjectPermissions({
  visible,
  onVisibleChange,
}: {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  const { context } = useAiAssistantStateSnapshot()
  const permissions = useAssistantProjectPermissions(context.projectRef, context.orgSlug)
  const update = useUpdateAssistantProjectPermissions(context.projectRef, context.orgSlug)
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues })
  const { isDirty } = form.formState
  const formId = useId()
  useEffect(() => {
    if (visible) form.reset({ selection: permissions.data?.selection ?? '' })
  }, [visible, permissions.data?.selection, form])
  return (
    <>
      {permissions.isError && (
        <AlertError subject="Could not load Assistant permissions" error={permissions.error} />
      )}
      {permissions.data && !permissions.data.hasConsented && (
        <Admonition
          type="default"
          title="Choose permissions for the new Assistant"
          description="Choose what this Assistant can share with AI providers for this project. Your previous organization setting is not carried over."
          className="border-0 border-b rounded-none"
        >
          <Button variant="default" onClick={() => onVisibleChange(true)}>
            Choose permissions
          </Button>
        </Admonition>
      )}
      <Dialog open={visible} onOpenChange={onVisibleChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Assistant project permissions</DialogTitle>
          </DialogHeader>
          <DialogSection>
            <p className="text-sm text-foreground-light mb-4">
              This setting applies to your use of the new Assistant on this project. Prompts and
              information you share are sent to third-party AI providers. Changes apply to your next
              message.
            </p>
            {permissions.data?.notice && (
              <p className="text-sm text-foreground-light mb-4">{permissions.data.notice}</p>
            )}
            <Form {...form}>
              <form
                id={formId}
                onSubmit={form.handleSubmit(({ selection }) => {
                  if (!permissions.data) return
                  update.mutate(
                    { selection, consentVersion: permissions.data.consentVersion },
                    { onSuccess: () => onVisibleChange(false) }
                  )
                })}
              >
                <FormField
                  control={form.control}
                  name="selection"
                  render={({ field }) => (
                    <FormItemLayout label="Information to share">
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={update.isPending || !permissions.data}
                        >
                          {permissions.data?.options.map((choice) => (
                            <div key={choice.value} className="flex gap-3 py-2">
                              <RadioGroupItem
                                value={choice.value}
                                id={`${formId}-${choice.value}`}
                                disabled={choice.disabled}
                              />
                              <label
                                htmlFor={`${formId}-${choice.value}`}
                                className="text-sm cursor-pointer"
                              >
                                <span className="block font-medium">{choice.label}</span>
                                <span className="text-foreground-light">{choice.description}</span>
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </form>
            </Form>
          </DialogSection>
          <DialogFooter>
            <Button
              variant="default"
              disabled={update.isPending}
              onClick={() => onVisibleChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={formId}
              loading={update.isPending}
              disabled={!permissions.data || (permissions.data.hasConsented && !isDirty)}
            >
              Save permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
