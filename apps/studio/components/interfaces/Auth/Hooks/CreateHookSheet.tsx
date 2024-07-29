import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import randomBytes from 'randombytes'
import { useEffect, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import * as z from 'zod'

import { useParams } from 'common'
import SchemaSelector from 'components/ui/SchemaSelector'
import { AuthConfigResponse } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useFlag } from 'hooks/ui/useFlag'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import FunctionSelector from './FunctionSelector'
import { HOOKS_DEFINITIONS, HOOK_DEFINITION_TITLE, Hook } from './hooks.constants'
import { extractMethod, isValidHook } from './hooks.utils'

interface CreateHookSheetProps {
  visible: boolean
  onClose: () => void
  onDelete: () => void
  title: HOOK_DEFINITION_TITLE | null
  authConfig: AuthConfigResponse
}

export function generateAuthHookSecret() {
  const secretByteLength = 60
  const buffer = randomBytes(secretByteLength)
  const base64String = buffer.toString('base64')
  return `v1,whsec_${base64String}`
}

const FORM_ID = 'create-edit-auth-hook'

const FormSchema = z
  .object({
    hookType: z.string(),
    enabled: z.boolean(),
    selectedType: z.union([z.literal('https'), z.literal('postgres')]),
    httpsValues: z.object({
      url: z.string(),
      secret: z.string(),
    }),
    postgresValues: z.object({
      schema: z.string(),
      functionName: z.string(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.selectedType === 'https') {
      if (!data.httpsValues.url.startsWith('https://')) {
        ctx.addIssue({
          path: ['httpsValues', 'url'],
          code: z.ZodIssueCode.custom,
          message: 'The URL must start with https://',
        })
      }
      if (!data.httpsValues.secret) {
        ctx.addIssue({
          path: ['httpsValues', 'secret'],
          code: z.ZodIssueCode.custom,
          message: 'Missing secret value',
        })
      }
    }
    if (data.selectedType === 'postgres') {
      if (!data.postgresValues.schema) {
        ctx.addIssue({
          path: ['postgresValues', 'schema'],
          code: z.ZodIssueCode.custom,
          message: 'You must select a schema',
        })
      }
      if (!data.postgresValues.functionName) {
        ctx.addIssue({
          path: ['postgresValues', 'functionName'],
          code: z.ZodIssueCode.custom,
          message: 'You must select a Postgres function',
        })
      }
    }
    return true
  })

export const CreateHookSheet = ({
  visible,
  onClose,
  onDelete,
  title,
  authConfig,
}: CreateHookSheetProps) => {
  const { ref: projectRef } = useParams()
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()
  const httpsAuthHooksEnabled = useFlag('httpsAuthHooksEnabled')

  const definition = useMemo(
    () => HOOKS_DEFINITIONS.find((d) => d.title === title) || HOOKS_DEFINITIONS[0],
    [title]
  )

  const hook: Hook = {
    ...definition,
    enabled: authConfig?.[definition.enabledKey] || false,
    method: extractMethod(
      authConfig?.[definition.uriKey] || '',
      authConfig?.[definition.secretsKey] || ''
    ),
  }

  // if the hook has all parameters, then it is not being created.
  const isCreating = !isValidHook(hook)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      hookType: title || '',
      enabled: true,
      selectedType: 'postgres',
      httpsValues: {
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
      if (definition) {
        const values = extractMethod(
          authConfig?.[definition.uriKey] || '',
          authConfig?.[definition.secretsKey] || ''
        )

        form.reset({
          hookType: definition.title,
          enabled: authConfig?.[definition.enabledKey] || false,
          selectedType: values.type,
          httpsValues: {
            url: (values.type === 'https' && values.url) || '',
            secret: (values.type === 'https' && values.secret) || '',
          },
          postgresValues: {
            schema: (values.type === 'postgres' && values.schema) || 'public',
            functionName: (values.type === 'postgres' && values.functionName) || '',
          },
        })
      } else {
        form.reset({
          hookType: title || '',
          enabled: true,
          selectedType: 'postgres',
          httpsValues: {
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
  }, [authConfig, title, visible])

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
      url = values.httpsValues.url
    }

    const payload = {
      [enabledLabel]: values.enabled,
      [uriLabel]: url,
      [secretsLabel]: values.selectedType === 'https' ? values.httpsValues.secret : null,
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
            <SheetTitle className="truncate">
              {isCreating ? `Add ${title}` : `Update ${title}`}
            </SheetTitle>
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
              key="enabled"
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItemLayout className="px-8" label={`Enable ${values.hookType}`} layout="flex">
                  <FormControl_Shadcn_>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={field.disabled}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <Separator />
            {httpsAuthHooksEnabled && (
              <FormField_Shadcn_
                control={form.control}
                name="selectedType"
                render={({ field }) => (
                  <FormItemLayout label="Hook type" className="px-8">
                    <FormControl_Shadcn_>
                      <RadioGroupStacked
                        value={values.selectedType}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <RadioGroupStackedItem
                          value="postgres"
                          id="postgres"
                          key="postgres"
                          label="Postgres"
                          description="Used to call a Postgres function."
                        />
                        <RadioGroupStackedItem
                          value="https"
                          id="https"
                          key="https"
                          label="HTTPS"
                          description="Used to call any HTTPS endpoint."
                        />
                      </RadioGroupStacked>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}
            {values.selectedType === 'postgres' ? (
              <div className="grid grid-cols-2 gap-8 px-8">
                <FormField_Shadcn_
                  key="postgresValues.schema"
                  control={form.control}
                  name="postgresValues.schema"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Postgres Schema"
                      description="Postgres schema where the function is defined."
                    >
                      <FormControl_Shadcn_>
                        <SchemaSelector
                          size="small"
                          showError={false}
                          selectedSchemaName={field.value}
                          onSelectSchema={(name) => {
                            field.onChange(name)
                          }}
                          disabled={field.disabled}
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
                      description="Postgres function which will be called by Supabase Auth each time the hook is triggered."
                    >
                      <FormControl_Shadcn_>
                        <FunctionSelector
                          size="small"
                          schema={values.postgresValues.schema}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={field.disabled}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </div>
            ) : (
              <div className="flex flex-col px-8 gap-4">
                <FormField_Shadcn_
                  key="httpsValues.url"
                  control={form.control}
                  name="httpsValues.url"
                  render={({ field }) => (
                    <FormItemLayout
                      label="URL"
                      description="Supabase Auth will send a HTTPS POST request to this URL each time the hook is triggered."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  key="httpsValues.secret"
                  control={form.control}
                  name="httpsValues.secret"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Secret"
                      description={
                        <ReactMarkdown>
                          It should be a base64 encoded hook secret with a prefix `v1,whsec_`. `v1`
                          denotes the signature version, and `whsec_` signifies a symmetric secret.
                        </ReactMarkdown>
                      }
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
                              form.setValue('httpsValues.secret', authHookSecret)
                            }}
                          >
                            Generate secret
                          </Button>
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </div>
            )}
          </form>
        </Form_Shadcn_>
        <SheetFooter>
          {!isCreating && (
            <div className="flex-1">
              <Button type="danger" onClick={() => onDelete()}>
                Delete hook
              </Button>
            </div>
          )}

          <Button disabled={isUpdatingConfig} type="default" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            form={FORM_ID}
            htmlType="submit"
            disabled={isUpdatingConfig}
            loading={isUpdatingConfig}
          >
            {isCreating ? 'Create' : 'Update'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
