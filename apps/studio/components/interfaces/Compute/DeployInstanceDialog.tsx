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

import { COMPUTE_REGION, INSTANCE_DEPLOYABLE_RUNTIMES, INSTANCE_SIZES } from './Compute.constants'
import type { InstanceAccess } from './Compute.types'
import { formatSize, generateInstanceName } from './Compute.utils'
import { InstanceSnippetTabs } from './InstanceSnippetTabs'
import { RuntimeBadge } from './RuntimeBadge'

const FORM_ID = 'deploy-instance-form'

const DeployInstanceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  runtime: z.enum(INSTANCE_DEPLOYABLE_RUNTIMES),
  size: z.enum(INSTANCE_SIZES),
  access: z.enum(['private', 'public']),
  instances: z
    .union([z.literal(''), z.coerce.number().int().gte(1).lte(10)])
    .refine((value) => value !== '', 'Instances is required'),
})

type DeployInstanceFormValues = z.infer<typeof DeployInstanceFormSchema>

const DEFAULT_VALUES: DeployInstanceFormValues = {
  name: '',
  runtime: 'deno',
  size: INSTANCE_SIZES[0],
  access: 'private',
  instances: 1,
}

const ACCESS_OPTIONS: { value: InstanceAccess; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
]

interface DeployInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const DeployInstanceDialog = ({ open, onOpenChange }: DeployInstanceDialogProps) => {
  const form = useForm<DeployInstanceFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(DeployInstanceFormSchema),
    defaultValues: { ...DEFAULT_VALUES, name: generateInstanceName() },
  })

  const [name, runtime, size, access, instances] = useWatch({
    control: form.control,
    name: ['name', 'runtime', 'size', 'access', 'instances'],
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Deploy an instance</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Admonition
          type="note"
          title="This dashboard is read-only during the Private Alpha"
          description={`Configure an instance below, then deploy it locally. Compute instances only deploy to ${COMPUTE_REGION} during alpha.`}
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
                      <Input {...field} placeholder="my-instance" />
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
                        {INSTANCE_DEPLOYABLE_RUNTIMES.map((value) => (
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
                        {INSTANCE_SIZES.map((value) => (
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
                    description="Public instances accept requests with a publishable key"
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
          <InstanceSnippetTabs
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
