import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  RUNTIMES,
  WORKER_MAX_INSTANCES,
  WORKER_MIN_INSTANCES,
  WORKER_SIZES,
} from './Workers.constants'
import { CreateWorkerSchema, type CreateWorkerForm } from './Workers.schema'
import { formatSize } from './Workers.utils'
import { useWorkerDeployMutation } from '@/data/workers/worker-deploy-mutation'

const FORM_ID = 'create-worker-form'

const RUNTIME_VALUES = Object.keys(RUNTIMES).filter((runtime) => runtime !== 'dockerfile')

const defaultValues: CreateWorkerForm = {
  name: '',
  runtime: 'node',
  size: WORKER_SIZES[0],
  access: 'private',
  instances: WORKER_MIN_INSTANCES,
}

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

        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="space-y-4">
              <Admonition
                type="default"
                title="This deploys an empty worker"
                description="A worker deployed from the dashboard runs the runtime's default entrypoint. Push your own code with the Supabase CLI."
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
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
                name="runtime"
                render={({ field }) => (
                  <FormItemLayout label="Runtime">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RUNTIME_VALUES.map((runtime) => (
                          <SelectItem key={runtime} value={runtime}>
                            {RUNTIMES[runtime].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItemLayout label="Size" description="Fixed at deploy time">
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
