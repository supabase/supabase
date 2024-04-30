import { zodResolver } from '@hookform/resolvers/zod'
import randomBytes from 'randombytes'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { useParams } from 'common'
import SchemaSelector from 'components/ui/SchemaSelector'
import { AuthConfigResponse } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Radio,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import FunctionSelector from './FunctionSelector'
import { HOOKS_DEFINITIONS } from './hooks.constants'
import { extractMethod } from './hooks.utils'

interface CreateHookSheetProps {
  visible: boolean
  onClose: () => void
  title: string | null
  authConfig: AuthConfigResponse
}

export function generateAuthHookSecret() {
  const secretByteLength = 60
  const buffer = randomBytes(secretByteLength)
  const base64String = buffer.toString('base64')
  return `v1,whsec_${base64String}`
}

const FORM_ID = 'create-edit-auth-hook'

const FormSchema = z.object({
  hookType: z.string(),
  selectedType: z.string(),
  webValues: z.object({
    url: z.string(),
    secret: z.string(),
  }),
  postgresValues: z.object({
    schema: z.string(),
    functionName: z.string(),
  }),
})

export const CreateHookSheet = ({ visible, onClose, title, authConfig }: CreateHookSheetProps) => {
  const { ref: projectRef } = useParams()
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      hookType: title || '',
      selectedType: 'postgres',
      webValues: {
        url: '',
        secret: '',
      },
      postgresValues: {
        schema: 'public',
        functionName: '',
      },
    },
  })

  useEffect(() => {
    if (visible) {
      const definition = HOOKS_DEFINITIONS.find((d) => d.title === title)
      if (definition) {
        const values = extractMethod(
          authConfig?.[definition.uriKey] || '',
          authConfig?.[definition.secretsKey] || ''
        )

        form.reset({
          hookType: definition.title,
          selectedType: values.type,
          webValues: {
            url: (values.type === 'web' && values.url) || '',
            secret: (values.type === 'web' && values.secret) || '',
          },
          postgresValues: {
            schema: (values.type === 'postgres' && values.schema) || 'public',
            functionName: (values.type === 'postgres' && values.functionName) || '',
          },
        })
      } else {
        form.reset({
          hookType: title || '',
          selectedType: 'postgres',
          webValues: {
            url: '',
            secret: '',
          },
          postgresValues: {
            schema: 'public',
            functionName: '',
          },
        })
      }
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    const definition = HOOKS_DEFINITIONS.find((d) => values.hookType === d.title)

    if (!definition) {
      return
    }

    const enabledLabel = definition.enabledKey
    const uriLabel = definition.uriKey
    const secretsLabel = definition.secretsKey

    let url = ''
    if (values.selectedType === 'postgres') {
      url = `pg-functions://postgres/${values.postgresValues.schema}/${values.postgresValues.functionName}`
    } else {
      url = values.webValues.url
    }

    const payload = {
      [enabledLabel]: true,
      [uriLabel]: url,
      [secretsLabel]: values.selectedType === 'web' ? values.webValues.secret : null,
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onSuccess: () => {
          toast.success(`Successfully created ${values.hookType}.`)
          onClose()
        },
      }
    )
  }

  const values = form.getValues()

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent showClose={false} className="flex flex-col gap-0">
        <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
          <div className="flex flex-row gap-3 items-center">
            <SheetClose
              className={cn(
                'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:pointer-events-none data-[state=open]:bg-secondary',
                'transition'
              )}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <SheetTitle className="truncate">{`Update ${title}`}</SheetTitle>
          </div>
        </SheetHeader>
        <Separator />
        <Form_Shadcn_ {...form}>
          <form
            id={FORM_ID}
            className="space-y-6 w-full py-8 flex-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField_Shadcn_
              control={form.control}
              name="selectedType"
              render={({ field }) => (
                <FormItemLayout label="Hook type" className="px-8">
                  <FormControl_Shadcn_>
                    <Radio.Group
                      type="cards"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <Radio
                        key="postgres"
                        id="postgres"
                        value="postgres"
                        label=""
                        beforeLabel={
                          <div className="flex items-center space-x-5">
                            <div className="flex-col space-y-0">
                              <div className="flex space-x-2">
                                <p className="text-foreground">Postgres</p>
                              </div>
                              <p className="text-foreground-light">
                                Used to call a Postgres function.
                              </p>
                            </div>
                          </div>
                        }
                      />
                      <Radio
                        key="web"
                        id="web"
                        value="web"
                        label=""
                        beforeLabel={
                          <div className="flex items-center space-x-5">
                            <div className="flex-col space-y-0">
                              <div className="flex space-x-2">
                                <p className="text-foreground">Web</p>
                              </div>
                              <p className="text-foreground-light">
                                Used to call any HTTPS endpoint.
                              </p>
                            </div>
                          </div>
                        }
                      />
                    </Radio.Group>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            {values.selectedType === 'postgres' ? (
              <>
                <FormField_Shadcn_
                  key="postgresValues.schema"
                  control={form.control}
                  name="postgresValues.schema"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Schema"
                      className="px-8"
                      description="Postgres schema where the function is defined."
                    >
                      <FormControl_Shadcn_>
                        <SchemaSelector
                          size="small"
                          showError={false}
                          selectedSchemaName={field.value}
                          disabled={field.disabled}
                          onSelectSchema={(name) => {
                            field.onChange(name)
                          }}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  key="postgresValues.functionName"
                  control={form.control}
                  name="postgresValues.functionName"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Function name"
                      className="px-8"
                      description="Postgres function which will be called by Supabase Auth each time the hook is triggered."
                    >
                      <FormControl_Shadcn_>
                        <FunctionSelector
                          size="small"
                          schema={values.postgresValues.schema}
                          selectedFunctionName={field.value}
                          onSelectFunction={(name) => field.onChange(name)}
                          disabled={field.disabled}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </>
            ) : (
              <>
                <FormField_Shadcn_
                  key="webValues.url"
                  control={form.control}
                  name="webValues.url"
                  render={({ field }) => (
                    <FormItemLayout
                      label="URL"
                      className="px-8"
                      description="Supabase Auth will send a HTTP POST request to this URL each time the hook is triggered."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  key="webValues.secret"
                  control={form.control}
                  name="webValues.secret"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Secret"
                      className="px-8"
                      description="It should be a base64 encoded hook secret with a prefix 'v1,whsec_'. 'v1' denotes the signature version, and 'whsec_' signifies a symmetric secret."
                    >
                      <FormControl_Shadcn_>
                        <div className="flex flex-row">
                          <Input_Shadcn_ {...field} className="rounded-r-none border-r-0" />
                          <Button
                            type="default"
                            size="small"
                            className="rounded-l-none h-[38px]"
                            onClick={() => {
                              const authHookSecret = generateAuthHookSecret()
                              field.onChange(authHookSecret)
                            }}
                          >
                            Generate secret
                          </Button>
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </>
            )}
          </form>
        </Form_Shadcn_>
        <SheetFooter>
          <Button disabled={isUpdatingConfig} type="default">
            Cancel
          </Button>
          <Button
            form={FORM_ID}
            htmlType="submit"
            disabled={isUpdatingConfig}
            loading={isUpdatingConfig}
          >
            Confirm
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
