import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useParams } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useRef } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { Shortcut } from '@/components/ui/Shortcut'
import { useAPIKeyCreateMutation } from '@/data/api-keys/api-key-create-mutation'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const FORM_ID = 'create-publishable-api-key'
const SCHEMA = z.object({
  name: z.string(),
  description: z.string().trim(),
})

export interface CreatePublishableAPIKeyDialogProps {
  projectRef: string
}

export const CreatePublishableAPIKeyDialog = () => {
  const params = useParams()
  const projectRef = params?.ref as string
  const formRef = useRef<HTMLFormElement>(null)

  const [visible, setVisible] = useQueryState('new', parseAsString.withDefault(''))

  const onOpenChange = (value: boolean) => {
    if (value) setVisible('publishable')
    else setVisible('')
  }
  const openDialog = () => setVisible('publishable')

  const defaultValues = { name: '', description: '' }

  const form = useForm<z.infer<typeof SCHEMA>>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const { mutate: createAPIKey, isPending: isCreatingAPIKey } = useAPIKeyCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SCHEMA>> = async (values) => {
    createAPIKey(
      {
        projectRef,
        type: 'publishable',
        name: values.name,
        description: values.description,
      },
      {
        onSuccess: () => {
          form.reset(defaultValues)
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={visible === 'publishable'} onOpenChange={onOpenChange}>
      <Shortcut
        id={SHORTCUT_IDS.API_KEYS_NEW_PUBLISHABLE}
        onTrigger={openDialog}
        side="bottom"
        tooltipOpen={visible === 'publishable' ? false : undefined}
      >
        <Button variant="default" icon={<Plus />} onClick={openDialog}>
          New publishable key
        </Button>
      </Shortcut>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new publishable API key</DialogTitle>
          <DialogDescription>
            Publishable API keys are used to authorize requests to your project from the web, mobile
            or desktop apps, CLIs or other public components of your application. They are safe to
            be published online and embedded in code.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <Form {...form}>
            <form
              ref={formRef}
              className="flex flex-col gap-4"
              id={FORM_ID}
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Name"
                    description="A short name of lowercase alphanumeric characters and underscore, must start with letter or underscore."
                  >
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                key="description"
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Description"
                    description="Provide a description about what this key is used for."
                  >
                    <FormControl>
                      <Input {...field} placeholder="(Optional)" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </DialogSection>
        <DialogFooter>
          <Shortcut
            id={SHORTCUT_IDS.API_KEYS_CREATE_PUBLISHABLE}
            onTrigger={() => formRef.current?.requestSubmit()}
            options={{ enabled: visible === 'publishable' && !isCreatingAPIKey }}
            side="top"
          >
            <Button form={FORM_ID} type="submit" loading={isCreatingAPIKey}>
              Create Publishable API key
            </Button>
          </Shortcut>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
