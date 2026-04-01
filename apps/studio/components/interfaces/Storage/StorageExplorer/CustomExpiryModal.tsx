import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
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
      <Form_Shadcn_ {...form}>
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
            <div className="flex-grow">
              <FormField_Shadcn_
                control={form.control}
                name="expiresIn"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Duration">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        type="number"
                        onChange={(e) => {
                          field.onChange(
                            isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber
                          )
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </div>
            <div>
              <FormField_Shadcn_
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Units">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ aria-label="Units" placeholder="Select an option" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="days">days</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="weeks">weeks</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="months">months</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="years">years</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
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
      </Form_Shadcn_>
    </Modal>
  )
}
