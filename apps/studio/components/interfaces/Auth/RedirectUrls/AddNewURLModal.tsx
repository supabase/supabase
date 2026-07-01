import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@ui/components/shadcn/ui/label'
import { useParams } from 'common'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  ScrollArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'
import * as z from 'zod'

import { normalizeRedirectUrl, parseRedirectUrls, urlRegex } from '../Auth.constants'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'

const MAX_URLS_LENGTH = 2 * 1024

interface AddNewURLModalProps {
  visible: boolean
  allowList: string[]
  onClose: () => void
}

const createRedirectUrlsSchema = (normalizedAllowList: string[]) => {
  const redirectUrlRegex = urlRegex()

  return z
    .object({
      urls: z
        .object({
          value: z.string().trim().min(1, 'Please provide a value').transform(normalizeRedirectUrl),
        })
        .array()
        .default([]),
    })
    .superRefine((data, ctx) => {
      const seenUrls = new Set<string>()

      data.urls.forEach((url, index) => {
        if (!redirectUrlRegex.test(url.value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['urls', index, 'value'],
            message: 'Please provide a valid URL',
          })
        }

        if (normalizedAllowList.includes(url.value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['urls', index, 'value'],
            message: 'URL already exists in the allow list',
          })
        }

        if (seenUrls.has(url.value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['urls', index, 'value'],
            message: 'URL already exists in this list',
          })
        }

        seenUrls.add(url.value)
      })
    })
}

export const AddNewURLModal = ({ visible, allowList, onClose }: AddNewURLModalProps) => {
  const { ref } = useParams()
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation()
  const normalizedAllowList = parseRedirectUrls(allowList.join(','))
  const formSchema = createRedirectUrlsSchema(normalizedAllowList)

  const initialValues = { urls: [{ value: '' }] }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })
  const urls = form.watch('urls')

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const payload = parseRedirectUrls(
      normalizedAllowList.concat(data.urls.map((url) => url.value)).join(',')
    )
    const payloadString = payload.join(',')
    const addedCount = payload.length - normalizedAllowList.length

    if (payloadString.length > MAX_URLS_LENGTH) {
      return toast.error('Too many redirect URLs, please remove some or try to use wildcards')
    }

    updateAuthConfig(
      { projectRef: ref!, config: { URI_ALLOW_LIST: payloadString } },
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

  useEffect(() => {
    if (visible) form.reset(initialValues)
  }, [visible])

  return (
    <Dialog
      open={visible}
      onOpenChange={() => {
        form.reset(initialValues)
        onClose()
      }}
    >
      <DialogContent size="medium" className="max-w-[440px]!">
        <DialogHeader>
          <DialogTitle>Add new redirect URLs</DialogTitle>
          <DialogDescription>
            This will add a URL to a list of allowed URLs that can interact with your Authentication
            services for this project.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-2 px-0">
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
            </DialogSection>
            <DialogFooter>
              <Button
                block
                type="submit"
                size="small"
                disabled={isUpdatingConfig}
                loading={isUpdatingConfig}
              >
                Save URLs
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
