import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SidePanel,
} from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorTrigger,
  MultiSelectorList,
  MultiSelectorItem,
} from 'ui-patterns/multi-select'
import type { OAuthApp } from 'pages/project/[ref]/auth/oauth-apps'
import { OAUTH_APP_SCOPES_OPTIONS, OAUTH_APP_TYPE_OPTIONS } from './OAuthAppsList'

interface CreateOAuthAppSidePanelProps {
  visible: boolean
  onClose: () => void
  onSuccess: (app: OAuthApp) => void
}

const CreateOAuthAppSidePanel = ({ visible, onClose, onSuccess }: CreateOAuthAppSidePanelProps) => {
  const initialValues = {
    name: '',
    type: 'manual' as const,
    scopes: ['openid'],
    redirect_uris: [{ value: '' }],
    is_public: false,
  }
  const submitRef = useRef<HTMLButtonElement>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    form.reset(initialValues)
  }, [visible])

  const FormSchema = z.object({
    name: z
      .string()
      .min(1, 'Please provide a name for your OAuth app')
      .max(100, 'Name must be less than 100 characters')
      .default(''),
    type: z.enum(['manual', 'dynamic']).default('manual'),
    scopes: z.array(z.string()).min(1, 'Please select at least one scope').default(['openid']),
    redirect_uris: z
      .object({
        value: z.string().refine((val) => val === '' || z.string().url().safeParse(val).success, {
          message: 'Please provide a valid URL',
        }),
      })
      .array()
      .default([{ value: '' }]),
    is_public: z.boolean().default(false),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  const {
    fields: redirectUriFields,
    append: appendRedirectUri,
    remove: removeRedirectUri,
    move: moveRedirectUri,
  } = useFieldArray({
    name: 'redirect_uris',
    control: form.control,
  })

  const updateOrder = (result: any) => {
    // Dropped outside of the list
    if (!result.destination) return
    moveRedirectUri(result.source.index, result.destination.index)
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsCreating(true)

    try {
      // Generate a unique ID and client_id
      const id = Date.now().toString()
      const client_id = `oauth_${id}`

      // Create the OAuth app object
      const newApp: OAuthApp = {
        id,
        client_id,
        name: data.name,
        type: data.type,
        scopes: data.scopes,
        redirect_uris: data.redirect_uris
          .filter((uri) => uri.value.trim())
          .map((uri) => uri.value.trim()),
        created_at: new Date().toISOString(),
      }

      // Save to localStorage
      const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
      const updatedApps = [...existingApps, newApp]
      localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

      toast.success(`Successfully created OAuth app "${data.name}"`)
      onSuccess(newApp)
      closePanel()
    } catch (error) {
      toast.error('Failed to create OAuth app')
      console.error('Error creating OAuth app:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const closePanel = () => {
    form.reset(initialValues)
    onClose()
  }

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={closePanel}
      header="Create a new OAuth app"
      confirmText="Create app"
      onConfirm={() => {
        if (submitRef.current) submitRef.current.click()
      }}
    >
      <SidePanel.Content className="py-4">
        <Form_Shadcn_ {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout
                  label="OAuth App Name"
                  description="A friendly name for your OAuth application"
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="My OAuth App" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItemLayout label="Registration Type" layout="vertical">
                  <Select_Shadcn_
                    {...field}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger_Shadcn_ className="col-span-8">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {OAUTH_APP_TYPE_OPTIONS.map((type) => (
                        <SelectItem_Shadcn_ key={`type-option-${type.value}`} value={type.value}>
                          {type.name}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="scopes"
              render={({ field }) => (
                <FormItemLayout
                  label="Scopes"
                  layout="vertical"
                  description="Select the permissions your app will request from users"
                >
                  <FormControl_Shadcn_>
                    <MultiSelector values={field.value} onValuesChange={field.onChange}>
                      <MultiSelectorTrigger label="Select scopes..." showIcon={false} />
                      <MultiSelectorContent>
                        <MultiSelectorList>
                          {OAUTH_APP_SCOPES_OPTIONS.map(
                            (scope: { value: string; name: string }) => (
                              <MultiSelectorItem key={scope.value} value={scope.value}>
                                {scope.name}
                              </MultiSelectorItem>
                            )
                          )}
                        </MultiSelectorList>
                      </MultiSelectorContent>
                    </MultiSelector>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="redirect_uris"
              render={() => (
                <FormItemLayout
                  label="Redirect URIs"
                  layout="vertical"
                  description="URLs where users will be redirected after authentication. You can leave the
                    input empty if not needed."
                >
                  <DragDropContext onDragEnd={(result: any) => updateOrder(result)}>
                    <Droppable droppableId="redirect_uris_droppable">
                      {(droppableProvided: DroppableProvided) => (
                        <div ref={droppableProvided.innerRef} className="space-y-2">
                          {redirectUriFields.map((field, index) => (
                            <FormField_Shadcn_
                              control={form.control}
                              key={field.id}
                              name={`redirect_uris.${index}.value`}
                              render={({ field: inputField }) => (
                                <FormItem_Shadcn_>
                                  <FormControl_Shadcn_>
                                    <div className="flex items-center space-x-2">
                                      <Input_Shadcn_
                                        {...inputField}
                                        placeholder="https://example.com/callback (optional)"
                                        className="flex-1"
                                      />
                                      {redirectUriFields.length > 1 && (
                                        <Button
                                          type="default"
                                          size="tiny"
                                          icon={<Trash2 size={14} />}
                                          onClick={() => removeRedirectUri(index)}
                                        />
                                      )}
                                    </div>
                                  </FormControl_Shadcn_>
                                  <FormMessage_Shadcn_ />
                                </FormItem_Shadcn_>
                              )}
                            />
                          ))}
                          {droppableProvided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <Button
                    type="default"
                    icon={<Plus strokeWidth={1.5} />}
                    onClick={() => appendRedirectUri({ value: '' })}
                    className="mt-2"
                  >
                    Add redirect URI
                  </Button>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItemLayout
                  label="Is public"
                  layout="flex"
                  description="If enabled, this app will be publicly accessible."
                >
                  <FormControl_Shadcn_>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <Button ref={submitRef} htmlType="submit" type="default" className="hidden">
              Create
            </Button>
          </form>
        </Form_Shadcn_>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CreateOAuthAppSidePanel
