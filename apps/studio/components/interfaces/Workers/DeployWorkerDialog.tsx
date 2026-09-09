import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
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
import * as z from 'zod'

import { RuntimeBadge } from './RuntimeBadge'
import { WORKER_DEPLOYABLE_RUNTIMES, WORKER_SIZES, WORKERS_REGION } from './Workers.constants'
import type { WorkerAccess } from './Workers.types'
import { formatSize, generateWorkerName } from './Workers.utils'
import { WorkerSnippetTabs } from './WorkerSnippetTabs'

const FORM_ID = 'deploy-worker-form'

const DeployWorkerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  runtime: z.enum(WORKER_DEPLOYABLE_RUNTIMES),
  size: z.enum(WORKER_SIZES),
  access: z.enum(['private', 'public']),
  instances: z
    .union([z.literal(''), z.coerce.number().int().gte(1).lte(10)])
    .refine((value) => value !== '', 'Instances is required'),
})

type DeployWorkerFormValues = z.infer<typeof DeployWorkerFormSchema>

const DEFAULT_VALUES: DeployWorkerFormValues = {
  name: '',
  runtime: 'deno',
  size: WORKER_SIZES[0],
  access: 'private',
  instances: 1,
}

const ACCESS_OPTIONS: { value: WorkerAccess; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
]

interface DeployWorkerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const DeployWorkerDialog = ({ open, onOpenChange }: DeployWorkerDialogProps) => {
  const form = useForm<DeployWorkerFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(DeployWorkerFormSchema),
    defaultValues: { ...DEFAULT_VALUES, name: generateWorkerName() },
  })

  const [name, runtime, size, access, instances] = useWatch({
    control: form.control,
    name: ['name', 'runtime', 'size', 'access', 'instances'],
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Deploy a worker</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Admonition
          type="note"
          title="This dashboard is read-only during the Private Alpha"
          description={`Configure a worker below, then deploy it locally. Workers only deploy to ${WORKERS_REGION} during alpha.`}
          className="border-x-0 border-y-0 rounded-none"
        />

        <DialogSectionSeparator />

        <DialogSection>
          <Form {...form}>
            <form id={FORM_ID} className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout label="Name">
                    <FormControl>
                      <Input {...field} placeholder="my-worker" />
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
                        {WORKER_DEPLOYABLE_RUNTIMES.map((value) => (
                          <SelectItem key={value} value={value}>
                            <RuntimeBadge runtime={value} />
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
                  <FormItemLayout
                    label="Size"
                    description="Fixed at deploy time and cannot be changed later"
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORKER_SIZES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {formatSize(value)}
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
                    description="Public workers accept requests with a publishable key"
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCESS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />

              <FormField
                control={form.control}
                name="instances"
                render={({ field }) => (
                  <FormItemLayout label="Instances" description="1 to 10">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        max={10}
                        onChange={(e) =>
                          field.onChange(
                            Number.isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </DialogSection>

        <DialogSectionSeparator />

        <DialogSection>
          <WorkerSnippetTabs
            input={{
              name: name ?? '',
              runtime: runtime ?? DEFAULT_VALUES.runtime,
              size: size ?? DEFAULT_VALUES.size,
              access: access ?? DEFAULT_VALUES.access,
              instances: typeof instances === 'number' ? instances : DEFAULT_VALUES.instances,
            }}
            tabs={['ai', 'cli', 'config']}
          />
        </DialogSection>

        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
