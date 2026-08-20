import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

// SCREAMING_SNAKE — matches the shape used by env-var loaders across runtimes.
const SECRET_NAME_REGEX = /^[A-Z_][A-Z0-9_]*$/

// Names reserved by the platform. Kept as a plain list because a future
// Workers Secrets API will publish an authoritative set — this mirrors the
// same guard used by Edge Functions in the meantime.
const RESERVED_PREFIXES = ['SUPABASE_']

const buildSchema = (existingNames: string[], lockedName?: string) =>
  z.object({
    name: lockedName
      ? z.string()
      : z
          .string()
          .trim()
          .min(1, 'Please provide a name for your secret')
          .max(80, 'Name should be under 80 characters')
          .regex(SECRET_NAME_REGEX, 'Use SCREAMING_SNAKE_CASE — uppercase, digits, and _')
          .refine((name) => !RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix)), {
            message: 'Names starting with SUPABASE_ are reserved',
          })
          .refine((name) => !existingNames.includes(name), {
            message: 'A secret with this name already exists',
          }),
    value: z.string().min(1, 'Please provide a value for your secret'),
  })

type AddSecretForm = { name: string; value: string }

interface AddSecretDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AddSecretForm) => void
  /** Names already in scope — used to reject duplicates in the schema. */
  existingNames: string[]
  /** If provided, the name field is locked to this value (used when overriding). */
  lockedName?: string
  title?: string
  description?: string
  submitLabel?: string
  /** Optional inline notice above the form. */
  hint?: string
  isLoading?: boolean
}

const FORM_ID = 'add-worker-secret-form'

export const AddSecretDialog = ({
  open,
  onOpenChange,
  onSubmit,
  existingNames,
  lockedName,
  title = 'Add secret',
  description = 'Secrets are exposed to workers as environment variables at start-up.',
  submitLabel = 'Add secret',
  hint,
  isLoading,
}: AddSecretDialogProps) => {
  const schema = useMemo(() => buildSchema(existingNames, lockedName), [existingNames, lockedName])

  const form = useForm<AddSecretForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: lockedName ?? '', value: '' },
  })

  // Reset the form when the dialog opens so a second use starts fresh.
  useEffect(() => {
    if (open) form.reset({ name: lockedName ?? '', value: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lockedName])

  const handleClose = () => onOpenChange(false)

  const handleSubmit: SubmitHandler<AddSecretForm> = (values) => {
    onSubmit({ name: (lockedName ?? values.name).trim(), value: values.value })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-foreground-light">{description}</p>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogSection className="space-y-4">
              {hint && <Admonition type="default" title={hint} />}

              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="name" label="Name">
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        data-1p-ignore
                        placeholder="MY_SECRET_NAME"
                        disabled={!!lockedName}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />

              <FormField
                name="value"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="value" label="Value">
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        data-1p-ignore
                        type="password"
                        placeholder="Paste the secret value"
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
          </form>
        </Form>

        <DialogFooter>
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button form={FORM_ID} type="submit" loading={isLoading}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
