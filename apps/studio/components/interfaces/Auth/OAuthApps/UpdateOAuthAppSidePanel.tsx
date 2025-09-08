import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ExternalLink, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SidePanel,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
} from 'ui'
import { MultiSelector } from 'ui-patterns/multi-select'
import type { OAuthApp } from 'pages/project/[ref]/auth/oauth-apps'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { OAUTH_APP_TYPE_OPTIONS, OAUTH_APP_SCOPES_OPTIONS } from './OAuthAppsList'

interface UpdateOAuthAppSidePanelProps {
  visible: boolean
  onClose: () => void
  onSuccess: (app: OAuthApp) => void
  selectedApp?: OAuthApp
}

const UpdateOAuthAppSidePanel = ({
  visible,
  onClose,
  onSuccess,
  selectedApp,
}: UpdateOAuthAppSidePanelProps) => {
  const initialValues = {
    name: selectedApp?.name || '',
    type: (selectedApp?.type as 'manual' | 'dynamic') || 'manual',
    scopes: selectedApp?.scopes || ['openid'],
    redirect_uris: selectedApp?.redirect_uris?.length
      ? selectedApp.redirect_uris.map((uri) => ({ value: uri }))
      : [{ value: '' }],
  }
  const submitRef = useRef<HTMLButtonElement>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (selectedApp) {
      const values = {
        name: selectedApp.name,
        type: selectedApp.type,
        scopes: selectedApp.scopes,
        redirect_uris: selectedApp.redirect_uris?.length
          ? selectedApp.redirect_uris.map((uri) => ({ value: uri }))
          : [{ value: '' }],
      }
      form.reset(values)
    }
  }, [visible, selectedApp])

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
    if (!selectedApp) return

    setIsUpdating(true)

    try {
      // Update the OAuth app object
      const updatedApp: OAuthApp = {
        ...selectedApp,
        name: data.name,
        type: data.type,
        scopes: data.scopes,
        redirect_uris: data.redirect_uris
          .filter((uri) => uri.value.trim())
          .map((uri) => uri.value.trim()),
      }

      // Update in localStorage
      const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
      const updatedApps = existingApps.map((app: OAuthApp) =>
        app.id === selectedApp.id ? updatedApp : app
      )
      localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

      toast.success(`Successfully updated OAuth app "${data.name}"`)
      onSuccess(updatedApp)
      closePanel()
    } catch (error) {
      toast.error('Failed to update OAuth app')
      console.error('Error updating OAuth app:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const closePanel = () => {
    form.reset(initialValues)
    onClose()
  }

  return (
    <SidePanel
      loading={isUpdating}
      visible={visible}
      onCancel={closePanel}
      header="Update OAuth app"
      confirmText="Update app"
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
                  <Select_Shadcn_ {...field} defaultValue={field.value}>
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
                      <MultiSelector.Trigger>
                        <MultiSelector.Input placeholder="Select scopes..." />
                      </MultiSelector.Trigger>
                      <MultiSelector.Content>
                        <MultiSelector.List>
                          {OAUTH_APP_SCOPES_OPTIONS.map((scope) => (
                            <MultiSelector.Item key={scope.value} value={scope.value}>
                              {scope.name}
                            </MultiSelector.Item>
                          ))}
                        </MultiSelector.List>
                      </MultiSelector.Content>
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

            <Button ref={submitRef} htmlType="submit" type="default" className="hidden">
              Update
            </Button>
          </form>
        </Form_Shadcn_>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default UpdateOAuthAppSidePanel
