import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  Form,
  FormControl,
  FormField,
  Input,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useCopyUrl } from './useCopyUrl'
import { DATETIME_FORMAT } from '@/lib/constants'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const unitMap = {
  days: 3600 * 24,
  weeks: 3600 * 24 * 7,
  months: 3600 * 24 * 30,
  years: 3600 * 24 * 365,
} as const

const formSchema = z.object({
  expiresIn: z.preprocess(
    (val) => (val ? val : undefined),
    z.coerce
      .number({ required_error: 'Required', invalid_type_error: 'Required' })
      .positive('Expiry duration must be greater than 0')
  ),
  units: z.enum(['days', 'weeks', 'months', 'years']),
})

type FormSchema = z.infer<typeof formSchema>

const formId = 'storage-custom-expiry-form'

export const CustomExpiryModal = () => {
  const { onCopyUrl } = useCopyUrl()
  const snap = useStorageExplorerStateSnapshot()
  const { selectedFileCustomExpiry, setSelectedFileCustomExpiry } = snap

  const visible = selectedFileCustomExpiry !== undefined
  const onClose = () => setSelectedFileCustomExpiry(undefined)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { expiresIn: 0, units: 'days' },
  })

  const handleClose = () => {
    onClose()
    form.reset()
  }

  const { isDirty, isSubmitting, isValid } = form.formState
  const handleSubmit: SubmitHandler<FormSchema> = async (values) => {
    await onCopyUrl(selectedFileCustomExpiry!.path!, values.expiresIn * unitMap[values.units])
    handleClose()
  }

  const [expiresIn, units] = useWatch({
    name: ['expiresIn', 'units'],
    control: form.control,
  })

  return (
    <Modal
      hideFooter
      size="small"
      header="Custom expiry for signed URL"
      visible={visible}
      alignFooter="right"
      confirmText="Get URL"
      onCancel={handleClose}
    >
      <Form {...form}>
        <Modal.Content>
          <p className="text-sm text-foreground-light mb-4">
            Enter the duration for which the URL will be valid for:
          </p>
          <form
            id={formId}
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="flex items-start space-x-2"
          >
            <div className="grow">
              <FormField
                control={form.control}
                name="expiresIn"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Duration">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => {
                          field.onChange(
                            isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber
                          )
                        }}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Units">
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue aria-label="Units" placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">days</SelectItem>
                          <SelectItem value="weeks">weeks</SelectItem>
                          <SelectItem value="months">months</SelectItem>
                          <SelectItem value="years">years</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>
          </form>
          {isDirty && isValid && (
            <p className="text-sm text-foreground-light mt-2">
              URL will expire on {dayjs().add(expiresIn, units).format(DATETIME_FORMAT)}
            </p>
          )}
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex items-center justify-end space-x-2">
          <Button type="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            form={formId}
            disabled={!isDirty || isSubmitting}
            loading={isSubmitting}
            htmlType="submit"
            type="primary"
          >
            Get signed URL
          </Button>
        </Modal.Content>
      </Form>
    </Modal>
  )
}
