import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import {
  ACCESS_OPTIONS,
  LOCKED_WORKER_PROPERTIES,
  RUNTIMES,
  SIZES,
  WORKER_MAX_INSTANCES,
  WORKER_MIN_INSTANCES,
} from './Workers.constants'
import { WorkerSnippetTabs } from './WorkerSnippetTabs'
import { deployWorker } from '@/state/workers-mock-state'

const FORM_ID = 'create-worker-form'

const WORKER_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please provide a name for your worker')
    .max(48, 'Worker name should be under 48 characters')
    .regex(WORKER_NAME_REGEX, 'Use lowercase letters, numbers, and hyphens only'),
  runtime: z.enum(['node', 'deno', 'bun', 'python', 'dockerfile']),
  size: z.enum(['2x1', '4x2']),
  access: z.enum(['public', 'private']),
  instances: z.coerce
    .number()
    .int('Instances must be a whole number')
    .min(WORKER_MIN_INSTANCES, `At least ${WORKER_MIN_INSTANCES} instance`)
    .max(WORKER_MAX_INSTANCES, `At most ${WORKER_MAX_INSTANCES} instances`),
})

type CreateWorkerForm = z.infer<typeof FormSchema>

const defaultValues: CreateWorkerForm = {
  name: '',
  runtime: 'node',
  size: '2x1',
  access: 'public',
  instances: 1,
}

interface CreateWorkerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateWorkerDialog = ({ open, onOpenChange }: CreateWorkerDialogProps) => {
  const { ref } = useParams()
  const [rejection, setRejection] = useState<string | null>(null)

  const form = useForm<CreateWorkerForm>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const [name, runtime, size, access, instances] = useWatch({
    control: form.control,
    name: ['name', 'runtime', 'size', 'access', 'instances'],
  })

  const snippetInput = {
    name,
    runtime,
    size,
    access,
    instances: Number(instances) || 1,
  }

  const handleClose = () => {
    form.reset()
    setRejection(null)
    onOpenChange(false)
  }

  const onSubmit: SubmitHandler<CreateWorkerForm> = (values) => {
    if (!ref) return console.error('Project ref is required')
    setRejection(null)

    const result = deployWorker(ref, {
      name: values.name,
      runtime: values.runtime,
      size: values.size,
      access: values.access,
      instances: values.instances,
    })

    if (!result.ok) {
      if (result.reason === 'duplicate') {
        form.setError('name', { type: 'manual', message: result.message })
      } else {
        setRejection(result.message)
      }
      return
    }

    toast.success(`Deploying worker "${values.name}"`)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent size="large" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create worker</DialogTitle>
          <p className="text-sm text-foreground-light">
            Configure your worker and deploy it next to your database — it'll be running in a few
            seconds.
          </p>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="space-y-4">
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
                        placeholder="worker-name"
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />

              <FormField
                name="runtime"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="runtime" label="Runtime">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a runtime" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RUNTIMES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  name="size"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout name="size" label="Size">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SIZES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  name="access"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout name="access" label="Access">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Access" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACCESS_OPTIONS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  name="instances"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout name="instances" label="Instances">
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={WORKER_MIN_INSTANCES}
                          max={WORKER_MAX_INSTANCES}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm text-foreground-light">
                  Also applied to every worker{' '}
                  <span className="text-foreground-lighter">— not configurable at alpha</span>
                </p>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-default bg-border sm:grid-cols-3">
                  {LOCKED_WORKER_PROPERTIES.map((property) => (
                    <div key={property.label} className="space-y-1 bg-surface-100 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-foreground-lighter">
                        <Lock size={11} />
                        {property.label}
                      </div>
                      <p className="text-sm text-foreground-light">{property.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm text-foreground-light">Or run it yourself</p>
                <WorkerSnippetTabs input={snippetInput} tabs={['cli', 'curl', 'config']} />
              </div>

              {rejection && (
                <Admonition type="warning" title="Can't deploy this worker" description={rejection} />
              )}
            </DialogSection>
          </form>
        </Form>

        <DialogFooter>
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button form={FORM_ID} type="submit">
            Create worker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
