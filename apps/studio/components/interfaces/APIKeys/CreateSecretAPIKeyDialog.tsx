import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useAPIKeyCreateMutation } from 'data/api-keys/api-key-create-mutation'
import { Plus, ShieldCheck } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

const NAME_SCHEMA = z
  .string()
  .min(4, 'Name must be at least 4 characters')
  .max(64, "Name can't be more than 64 characters long")
  .regex(/^[a-z0-9_]+$/, 'Name can only contain lowercased letters, digits and underscore')
  .refine((val: string) => !val.match(/^[0-9].+$/), 'Name must not start with a digit')
  .refine(
    (val: string) => val !== 'anon' && val !== 'service_role',
    'Using "anon" or "service_role" for API key name is not possible'
  )

const FORM_ID = 'create-secret-api-key'
const SCHEMA = z.object({
  name: NAME_SCHEMA,
  description: z.string().max(256, "Description shouldn't be too long").trim(),
})

export const CreateSecretAPIKeyDialog = () => {
  const { ref: projectRef } = useParams()
  const [visible, setVisible] = useQueryState('new', parseAsString)

  const onOpenChange = (value: boolean) => {
    if (value) setVisible('secret')
    else setVisible('')
  }

  const defaultValues = { name: '', description: '' }
  const form = useForm<z.infer<typeof SCHEMA>>({
    resolver: zodResolver(SCHEMA),
    defaultValues,
  })

  const { mutate: createAPIKey, isPending: isCreatingAPIKey } = useAPIKeyCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SCHEMA>> = async (values) => {
    createAPIKey(
      {
        projectRef,
        type: 'secret',
        name: values.name,
        description: values.description,
      },
      {
        onSuccess: (data) => {
          toast.success(`Your secret API key ${data.prefix}... is ready.`)
          form.reset(defaultValues)
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={visible === 'secret'} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="default" className="mt-2" icon={<Plus />}>
          New secret key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new secret API key</DialogTitle>
          <DialogDescription className="grid gap-y-2">
            <p>
              Secret API keys allow elevated access to your project's data, bypassing Row-Level
              security.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <Form_Shadcn_ {...form}>
            <form
              className="flex flex-col gap-4"
              id={FORM_ID}
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Name"
                    description="A short, unique name of lowercased letters, digits and underscore"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Example: my_super_secret_key_123" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                key="description"
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Description" labelOptional="Optional">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="Short notes on how or where this key will be used"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
          <Alert_Shadcn_ variant="warning">
            <ShieldCheck />
            <AlertTitle_Shadcn_>Securing your API key</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="">
              <ul className="list-disc">
                <li>Keep this key secret.</li>
                <li>Do not use on the web, in mobile or desktop apps.</li>
                <li>Don't post it publicly or commit in source control.</li>
                <li>
                  This key provides elevated access to your data, bypassing Row-Level Security.
                </li>
                <li>
                  If it leaks or is revealed, swap it with a new secret API key and then delete it.
                </li>
                <li>
                  If used in a browser, it will always return HTTP 401 Unauthorized. Delete
                  immediately.
                </li>
              </ul>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button form={FORM_ID} htmlType="submit" loading={isCreatingAPIKey}>
            Create API key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
