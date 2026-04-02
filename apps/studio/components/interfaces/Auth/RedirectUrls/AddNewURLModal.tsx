import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@ui/components/shadcn/ui/label'
import { useParams } from 'common'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, cn, DialogSectionSeparator, Form_Shadcn_, Modal, ScrollArea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'
import * as z from 'zod'

import { urlRegex } from '../Auth.constants'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'

const MAX_URLS_LENGTH = 2 * 1024

interface AddNewURLModalProps {
  visible: boolean
  allowList: string[]
  onClose: () => void
}

const normaliseUrl = (value: string) => value.replace(/,\s*$/, '')

export const AddNewURLModal = ({ visible, allowList, onClose }: AddNewURLModalProps) => {
  const { ref } = useParams()
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation()
  const redirectUrlRegex = urlRegex()

  const FormSchema = z.object({
    urls: z
      .object({
        value: z
          .string()
          .min(1, 'Please provide a value')
          .refine(
            (value) => redirectUrlRegex.test(normaliseUrl(value)),
            'Please provide a valid URL'
          )
          .refine((value) => !allowList.includes(normaliseUrl(value)), {
            message: 'URL already exists in the allow list',
          }),
      })
      .array()
      .default([]),
  })

  const initialValues = { urls: [{ value: '' }] }
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })
  const urls = form.watch('urls')

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const dedupedUrls = [...new Set(data.urls.map((url) => normaliseUrl(url.value)))]
    const payloadUrls = allowList.concat(dedupedUrls)
    const addedCount = dedupedUrls.length
    const payload = payloadUrls.toString()

    if (payload.length > MAX_URLS_LENGTH) {
      return toast.error('Too many redirect URLs, please remove some or try to use wildcards')
    } else {
      updateAuthConfig(
        { projectRef: ref!, config: { URI_ALLOW_LIST: payload } },
        {
          onError: (error) => {
            toast.error(`Failed to add URL(s): ${error?.message}`)
          },
          onSuccess: () => {
            toast.success(`Successfully added ${addedCount} URL${addedCount > 1 ? 's' : ''}`)
            form.reset(initialValues)
            onClose()
          },
        }
      )
    }
  }

  useEffect(() => {
    if (visible) form.reset(initialValues)
  }, [visible])

  return (
    <Modal
      hideFooter
      size="medium"
      className="!max-w-[440px]"
      visible={visible}
      onCancel={() => {
        form.reset(initialValues)
        onClose()
      }}
      header="Add new redirect URLs"
      description="This will add a URL to a list of allowed URLs that can interact with your Authentication services for this project."
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Modal.Content className="flex flex-col gap-y-2 px-0">
            <Label className="px-5">URL</Label>
            <ScrollArea className={cn(urls.length > 4 ? 'h-[220px]' : '')}>
              <div className="px-5 py-1">
                <FormItemLayout className="[&>div>div]:mt-0">
                  <SingleValueFieldArray
                    control={form.control}
                    name="urls"
                    valueFieldName="value"
                    createEmptyRow={() => ({ value: '' })}
                    placeholder="https://mydomain.com"
                    addLabel="Add URL"
                    removeLabel="Remove URL"
                    minimumRows={1}
                    rowsClassName="space-y-2"
                    addButtonClassName="w-min"
                  />
                </FormItemLayout>
              </div>
            </ScrollArea>
          </Modal.Content>
          <DialogSectionSeparator />
          <Modal.Content>
            <Button
              block
              htmlType="submit"
              size="small"
              disabled={isUpdatingConfig}
              loading={isUpdatingConfig}
            >
              Save URLs
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}
