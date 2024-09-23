import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import {
  Button,
  cn,
  DialogSectionSeparator,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Modal,
  ScrollArea,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Label } from '@ui/components/shadcn/ui/label'

const MAX_URLS_LENGTH = 2 * 1024

interface AddNewURLModalProps {
  visible: boolean
  allowList: string[]
  onClose: () => void
}

export const AddNewURLModal = ({ visible, allowList, onClose }: AddNewURLModalProps) => {
  const { ref } = useParams()
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const FormSchema = z.object({
    urls: z
      .object({
        value: z
          .string()
          .min(1, 'Please provide a value')
          .url('Please provide a valid URL')
          .refine((value) => !allowList.includes(value), {
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

  const { fields, append, remove } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const payload = allowList
      .concat(data.urls.map((url) => url.value.replace(/,\s*$/, '')))
      .toString()

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
            toast.success(`Successfully added ${fields.length} URL${fields.length > 1 ? 's' : ''}`)
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
            <ScrollArea className={cn(fields.length > 4 ? 'h-[220px]' : '')}>
              <div className="px-5 py-1 flex flex-col gap-y-2">
                {fields.map((field, index) => (
                  <FormField_Shadcn_
                    control={form.control}
                    key={field.id}
                    name={`urls.${index}.value`}
                    render={({ field: inputField }) => (
                      <FormItemLayout className="[&>div>div]:mt-0">
                        <FormControl_Shadcn_>
                          <div className="flex items-center gap-x-2 [&>div]:w-full">
                            <Input placeholder="https://mydomain.com" {...inputField} />
                            <Button
                              type="default"
                              size="small"
                              icon={<Trash />}
                              className="px-2"
                              disabled={fields.length === 1}
                              onClick={() => remove(index)}
                            />
                          </div>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                ))}
              </div>
            </ScrollArea>
            <div className="px-5">
              <Button
                type="default"
                className="w-min"
                icon={<Plus strokeWidth={1.5} />}
                onClick={() => append({ value: '' })}
              >
                Add URL
              </Button>
            </div>
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
