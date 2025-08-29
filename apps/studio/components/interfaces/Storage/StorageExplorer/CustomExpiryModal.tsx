import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs, { ManipulateType } from 'dayjs'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { DATETIME_FORMAT } from 'lib/constants'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { useCopyUrl } from './useCopyUrl'

const unitMap = {
  days: 3600 * 24,
  weeks: 3600 * 24 * 7,
  months: 3600 * 24 * 30,
  years: 3600 * 24 * 365,
} as const

const ExpirySchema = z.object({
  expiresIn: z.coerce.number().positive().min(0),
  units: z.string(),
})

const formId = 'custom-expiry-form'

const CustomExpiryModal = () => {
  const { onCopyUrl } = useCopyUrl()
  const { selectedFileCustomExpiry, setSelectedFileCustomExpiry } =
    useStorageExplorerStateSnapshot()
  const form = useForm<z.infer<typeof ExpirySchema>>({
    resolver: zodResolver(ExpirySchema),
    defaultValues: { expiresIn: 0, units: 'days' },
    mode: 'onSubmit',
  })

  const isSubmitting = form.formState.isSubmitting
  const expiresIn = form.watch(`expiresIn`)
  const units = form.watch(`units`)
  const visible = selectedFileCustomExpiry !== undefined

  const handleClose = () => {
    form.reset()
    setSelectedFileCustomExpiry(undefined)
  }

  const onSubmit: SubmitHandler<z.infer<typeof ExpirySchema>> = async (values) => {
    await onCopyUrl(
      selectedFileCustomExpiry!.name,
      values.expiresIn * unitMap[values.units as keyof typeof unitMap]
    )
    handleClose()
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom expiry for signed URL</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <p className="text-sm text-foreground-light mb-2">
                Enter the duration for which the URL will be valid for:
              </p>
              <div className="grid grid-cols-12 col-span-12 gap-x-2 gap-y-1">
                <FormField_Shadcn_
                  key="expiresIn"
                  name="expiresIn"
                  control={form.control}
                  render={({ field }) => (
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        aria-label="Duration"
                        id="expiresIn"
                        type="number"
                        min={0}
                        className="col-span-8"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                  )}
                />

                <FormField_Shadcn_
                  key="units"
                  name="units"
                  control={form.control}
                  render={({ field }) => (
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger_Shadcn_
                          id="units"
                          aria-label="Duration units"
                          size="small"
                          className="col-span-4"
                        >
                          <SelectValue_Shadcn_ asChild>
                            <>{units}</>
                          </SelectValue_Shadcn_>
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {Object.keys(unitMap).map((unit: string) => (
                            <SelectItem_Shadcn_ key={unit} value={unit} className="text-xs">
                              {unit}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  )}
                />
              </div>
              {expiresIn !== 0 && (
                <p className="text-sm text-foreground-light mt-2">
                  URL will expire on{' '}
                  {dayjs()
                    .add(expiresIn, units as ManipulateType)
                    .format(DATETIME_FORMAT)}
                </p>
              )}
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" loading={isSubmitting} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            loading={isSubmitting}
            disabled={expiresIn === 0 || isSubmitting}
          >
            Get signed URL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CustomExpiryModal
