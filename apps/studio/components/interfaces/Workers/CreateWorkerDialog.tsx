import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, type Control } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
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

import { WORKER_MAX_INSTANCES, WORKER_MIN_INSTANCES, WORKER_SIZES } from './Workers.constants'
import { CreateWorkerSchema, type CreateWorkerForm } from './Workers.schema'
import { formatSize } from './Workers.utils'
import { WorkerPromptPanel } from './WorkerPromptPanel'
import { useWorkerDeployMutation } from '@/data/workers/worker-deploy-mutation'

const FORM_ID = 'create-worker-form'

// The dashboard only deploys the Deno starter; the CLI is where other runtimes
// get selected, so the snippets below describe a Deno worker.
const DEPLOYED_RUNTIME = 'deno'

const defaultValues: CreateWorkerForm = {
  name: '',
  size: WORKER_SIZES[0],
  access: 'private',
  instances: WORKER_MIN_INSTANCES,
}

/**
 * Live snippets for the values currently in the form. Subscribes on its own so
 * a keystroke re-renders the snippets rather than the whole dialog.
 */
const CreateWorkerSnippets = ({ control }: { control: Control<CreateWorkerForm> }) => {
  const [name, size, access, instances] = useWatch({
    control,
    name: ['name', 'size', 'access', 'instances'],
  })

  return (
    <WorkerPromptPanel
      input={{
        name,
        runtime: DEPLOYED_RUNTIME,
        size,
        access,
        // `instances` holds the raw input string while typing, and '' when cleared.
        instances: Number(instances) || WORKER_MIN_INSTANCES,
      }}
    />
  )
}

// Match CreateAnalyticsBucketForm: FormItemLayout draws its own padding so the
// wrapping DialogSection can drop to `p-0!` and let the fields sit flush.
const fieldClassName = 'p-5'

interface CreateWorkerDialogProps {
  projectRef: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateWorkerDialog = ({ projectRef, open, onOpenChange }: CreateWorkerDialogProps) => {
  const form = useForm<CreateWorkerForm>({
    resolver: zodResolver(CreateWorkerSchema),
    defaultValues,
  })

  const { mutate: deployWorker, isPending } = useWorkerDeployMutation({
    onSuccess: (worker) => {
      toast.success(`Deploying ${worker.name}`)
      form.reset(defaultValues)
      onOpenChange(false)
    },
  })

  const onSubmit = (values: CreateWorkerForm) => deployWorker({ projectRef, ...values })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Deploy a worker</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Admonition
          type="default"
          title="Deploys a Deno starter worker"
          description="The dashboard deploys a hello-world worker you can then edit and redeploy with the Supabase CLI."
          className={cn('rounded-none border-x-0 border-t-0')}
        />

        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="p-0!">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
                    className={fieldClassName}
                    label="Name"
                    description="Lowercase letters, numbers, and hyphens only"
                  >
                    <FormControl>
                      <Input {...field} placeholder="embed" autoComplete="off" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItemLayout
                    className={fieldClassName}
                    label="Size"
                    description="Fixed at deploy time"
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORKER_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {formatSize(size)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />

              <FormField
                control={form.control}
                name="access"
                render={({ field }) => (
                  <FormItemLayout
                    className={fieldClassName}
                    label="Access"
                    description="Public workers accept requests with an anon key"
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />

              <FormField
                control={form.control}
                name="instances"
                render={({ field }) => (
                  <FormItemLayout
                    className={fieldClassName}
                    label="Instances"
                    description={`${WORKER_MIN_INSTANCES} to ${WORKER_MAX_INSTANCES}`}
                  >
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
            </DialogSection>
          </form>
        </Form>

        <DialogSectionSeparator />

        <DialogSection className="space-y-2">
          <p className="text-sm text-foreground-light">
            Or deploy the same worker from your terminal
          </p>
          <CreateWorkerSnippets control={form.control} />
        </DialogSection>

        <DialogFooter>
          <Button variant="default" disabled={isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={isPending}>
            Deploy worker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
