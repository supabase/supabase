import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import type { editor } from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { Button, Form, FormControl, FormField, Input, Label, Switch } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { useEmailTemplateEditor } from './EmailTemplateEditorContext'
import type { AuthTemplate } from './EmailTemplates.types'
import { ResetTemplateDialog } from './ResetTemplateDialog'
import { SpamValidation } from './SpamValidation'
import { PreventNavigationOnUnsavedChanges } from '@/components/ui-patterns/Dialogs/PreventNavigationOnUnsavedChanges'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { TwoOptionToggle } from '@/components/ui/TwoOptionToggle'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useValidateSpamMutation, ValidateSpamResponse } from '@/data/auth/validate-spam-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

interface TemplateEditorProps {
  template: AuthTemplate
}

type EmailTemplateContentKey = Extract<
  keyof AuthConfigResponse,
  `MAILER_TEMPLATES_${string}_CONTENT`
>
type EmailTemplateSubjectKey = Exclude<
  Extract<keyof AuthConfigResponse, `MAILER_SUBJECTS_${string}`>,
  'MAILER_SUBJECTS_CUSTOM_CONTENTS'
>

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const { ref: projectRef } = useParams()
  const { registerInsertVariable } = useEmailTemplateEditor()
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { id, properties } = template
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const messageSlug = `MAILER_TEMPLATES_${id}_CONTENT` as EmailTemplateContentKey

  const { data: authConfig, isSuccess } = useAuthConfigQuery({ projectRef })

  const [validationResult, setValidationResult] = useState<ValidateSpamResponse>()
  const [bodyValue, setBodyValue] = useState((authConfig && authConfig[messageSlug]) ?? '')
  const [, setHasUnsavedChanges] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [activeView, setActiveView] = useState<'source' | 'preview'>('source')

  const { mutate: validateSpam } = useValidateSpamMutation()

  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      setIsSavingTemplate(false)
      toast.error(`Failed to update email templates: ${error.message}`)
    },
  })

  const isSecurityTemplate = template.misc?.emailTemplateType === 'security'
  const templateEnabledKey = isSecurityTemplate
    ? (`MAILER_NOTIFICATIONS_${template.id?.replace('_NOTIFICATION', '')}_ENABLED` as string)
    : null

  const subjectSlug = Object.keys(properties).find((key) => key.startsWith('MAILER_SUBJECTS_')) as
    | EmailTemplateSubjectKey
    | undefined

  const messageProperty = properties[messageSlug]
  const builtInSMTP =
    isSuccess &&
    authConfig &&
    (!authConfig.SMTP_HOST || !authConfig.SMTP_USER || !authConfig.SMTP_PASS)

  const spamRules = (validationResult?.rules ?? []).filter((rule) => rule.score > 0)

  const getFormValuesFromConfig = useCallback(
    (config: AuthConfigResponse | undefined) => {
      const result: { [x: string]: string } = {}
      Object.keys(properties).forEach((key) => {
        result[key] = ((config && config[key as keyof typeof config]) ?? '') as string
      })
      return result
    },
    [properties]
  )

  const INITIAL_VALUES = useMemo(() => {
    return getFormValuesFromConfig(authConfig)
  }, [authConfig, getFormValuesFromConfig])

  const form = useForm({
    defaultValues: INITIAL_VALUES,
    resolver: zodResolver(template.validationSchema),
  })

  const NotificationFormSchema = templateEnabledKey
    ? z.object({
        [templateEnabledKey]: z.boolean(),
      })
    : z.object({})

  const notificationDefaultValues = templateEnabledKey
    ? {
        [templateEnabledKey]: authConfig
          ? Boolean(authConfig[templateEnabledKey as keyof typeof authConfig])
          : false,
      }
    : {}

  const notificationForm = useForm<z.infer<typeof NotificationFormSchema>>({
    resolver: zodResolver(NotificationFormSchema),
    defaultValues: notificationDefaultValues,
  })

  const onSubmit = (values: z.infer<typeof template.validationSchema>) => {
    if (!projectRef) return console.error('Project ref is required')

    setIsSavingTemplate(true)

    const payload = { ...values }

    // Because the template content uses the code editor which is not a form component
    // its state is kept separately from the form state, hence why we manually inject it here
    delete payload[messageSlug]
    if (messageProperty) payload[messageSlug] = bodyValue

    const [subjectKey] = Object.keys(properties)

    validateSpam(
      {
        projectRef,
        template: {
          subject: payload[subjectKey],
          content: payload[messageSlug],
        },
      },
      {
        onSuccess: (res) => {
          setValidationResult(res)
          const spamRules = (res?.rules ?? []).filter((rule) => rule.score > 0)
          const preventSaveFromSpamCheck = builtInSMTP && spamRules.length > 0

          if (preventSaveFromSpamCheck) {
            setIsSavingTemplate(false)
            toast.error(
              'Please rectify all spam warnings before saving while using the built-in email service'
            )
          } else {
            updateAuthConfig(
              { projectRef: projectRef, config: payload },
              {
                onSuccess: () => {
                  setIsSavingTemplate(false)
                  setHasUnsavedChanges(false)
                  toast.success('Successfully updated email template')
                },
              }
            )
          }
        },
        onError: () => setIsSavingTemplate(false),
      }
    )
  }

  const onSubmitNotification = (values: z.infer<typeof NotificationFormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    updateAuthConfig(
      { projectRef, config: { ...values }, skipInvalidation: true },
      {
        onSuccess: () => {
          toast.success('Successfully updated settings')
        },
        onError: (error) => {
          toast.error(`Failed to update settings: ${error?.message}`)
        },
      }
    )
  }

  const formValues = form.watch()
  const baselineValues = INITIAL_VALUES
  const baselineBodyValue = (authConfig && authConfig[messageSlug]) ?? ''
  const hasCustomTemplate =
    authConfig?.MAILER_TEMPLATES_CUSTOM_CONTENTS?.[messageSlug] === true ||
    (subjectSlug !== undefined &&
      authConfig?.MAILER_SUBJECTS_CUSTOM_CONTENTS?.[subjectSlug] === true)
  const hasFormChanges = JSON.stringify(formValues) !== JSON.stringify(baselineValues)
  const hasChanges = hasFormChanges || baselineBodyValue !== bodyValue

  const insertTextAtCursor = useCallback((text: string) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const selection = editor.getSelection()

    if (selection) {
      const range = {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn,
      }

      editor.executeEdits('insert-variable', [
        {
          range,
          text,
          forceMoveMarkers: true,
        },
      ])

      editor.focus()
    }
  }, [])

  const registerInsertVariableEvent = useStaticEffectEvent(registerInsertVariable)
  const insertTextAtCursorEvent = useStaticEffectEvent(insertTextAtCursor)

  useEffect(() => {
    registerInsertVariableEvent(insertTextAtCursorEvent)
  }, [registerInsertVariableEvent, insertTextAtCursorEvent])

  useEffect(() => {
    if (authConfig) {
      form.reset(getFormValuesFromConfig(authConfig))
      setBodyValue((authConfig && authConfig[messageSlug]) ?? '')
    }
  }, [authConfig, getFormValuesFromConfig, messageSlug, form])

  useEffect(() => {
    if (authConfig && templateEnabledKey) {
      notificationForm.reset({
        [templateEnabledKey]: Boolean(authConfig[templateEnabledKey as keyof typeof authConfig]),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authConfig, templateEnabledKey])

  useEffect(() => {
    if (projectRef && id && !!authConfig) {
      const [subjectKey] = Object.keys(properties)

      validateSpam({
        projectRef,
        template: {
          subject: authConfig[subjectKey as keyof typeof authConfig] as string,
          content: authConfig[messageSlug],
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!hasChanges) setValidationResult(undefined)
  }, [hasChanges])

  const subjectFields = Object.keys(properties).map((x: string) => {
    const property = properties[x]
    if (property.type === 'string' && x !== messageSlug) {
      return (
        <FormField
          key={x}
          control={form.control}
          name={x}
          render={({ field }) => (
            <FormItemLayout
              className="gap-y-3"
              layout="vertical"
              label={property.title}
              description={
                property.description ? (
                  <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                    {property.description}
                  </ReactMarkdown>
                ) : null
              }
              labelOptional={
                property.descriptionOptional ? (
                  <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                    {property.descriptionOptional}
                  </ReactMarkdown>
                ) : null
              }
            >
              <FormControl>
                <Input id={x} {...field} disabled={!canUpdateConfig} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      )
    }
    return null
  })

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-1 flex-col"
        >
          <div className="flex shrink-0 flex-col gap-6 border-b p-4">
            {templateEnabledKey && (
              <Form {...notificationForm}>
                <form
                  onSubmit={notificationForm.handleSubmit(onSubmitNotification)}
                  className="space-y-4"
                >
                  <FormField
                    control={notificationForm.control}
                    name={templateEnabledKey as keyof z.infer<typeof NotificationFormSchema>}
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Enable notification"
                        description="Send this email to users when triggered"
                      >
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canUpdateConfig}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                  {notificationForm.formState.isDirty && (
                    <div className="flex justify-end gap-2">
                      <Button type="default" onClick={() => notificationForm.reset()}>
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        disabled={!canUpdateConfig || isUpdatingConfig}
                        loading={isUpdatingConfig}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            )}

            <div className="space-y-4">{subjectFields}</div>
          </div>

          {messageProperty && (
            <>
              <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
                <Label>Body</Label>
                <TwoOptionToggle
                  width={60}
                  options={['preview', 'source']}
                  activeOption={activeView}
                  onClickOption={(option) => setActiveView(option as 'source' | 'preview')}
                  borderOverride="border-muted"
                />
              </div>

              <div className="relative flex min-h-0 flex-1">
                {activeView === 'source' ? (
                  <div className="h-full w-full [&_.monaco-editor]:[--vscode-focusBorder:transparent] [&_.monaco-editor]:outline-none! [&_.monaco-editor.focused]:outline-none! [&_.monaco-editor-background]:bg-surface-200/30! [&_.monaco-editor_.margin]:bg-surface-200/30! [&_.overflow-guard]:outline-none! [&_.scroll-decoration]:hidden! [&_section]:outline-none! [&_section]:ring-0! [&_section]:shadow-none! dark:[&_.monaco-editor-background]:bg-surface-300! dark:[&_.monaco-editor_.margin]:bg-surface-300!">
                    <CodeEditor
                      id="code-id"
                      language="html"
                      isReadOnly={!canUpdateConfig}
                      className="mb-0! relative h-full w-full"
                      onInputChange={(e: string | undefined) => {
                        setBodyValue(e ?? '')
                        if (bodyValue !== e) setHasUnsavedChanges(true)
                      }}
                      options={{
                        wordWrap: 'on',
                        contextmenu: false,
                        renderLineHighlight: 'none',
                        overviewRulerBorder: false,
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                      }}
                      value={bodyValue}
                      editorRef={editorRef}
                    />
                  </div>
                ) : (
                  <>
                    <iframe
                      className="h-full w-full border-0 bg-white"
                      title={id}
                      srcDoc={bodyValue}
                      sandbox="allow-scripts allow-forms"
                    />
                    <div className="absolute bottom-3 left-3 right-3 z-10 max-w-md">
                      <Admonition
                        type="default"
                        title="Email rendering may differ"
                        description="The preview shown here may differ slightly from how your email appears in the recipient’s email client."
                      />
                    </div>
                  </>
                )}
              </div>

              <SpamValidation spamRules={spamRules} />

              <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-surface-100 p-4">
                {hasCustomTemplate && (
                  <ResetTemplateDialog
                    template={template}
                    hasUnsavedChanges={hasChanges}
                    onResetSuccess={(config: AuthConfigResponse) => {
                      form.reset(getFormValuesFromConfig(config))
                      setBodyValue((config && config[messageSlug]) ?? '')
                      setValidationResult(undefined)
                      setHasUnsavedChanges(false)
                    }}
                  />
                )}
                <div className="ml-auto flex flex-row gap-2">
                  {hasChanges && (
                    <Button
                      type="default"
                      htmlType="button"
                      onClick={() => {
                        form.reset(INITIAL_VALUES)
                        setBodyValue((authConfig && authConfig[messageSlug]) ?? '')
                        setHasUnsavedChanges(false)
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!canUpdateConfig || isSavingTemplate || !hasChanges}
                    loading={isSavingTemplate}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
        <PreventNavigationOnUnsavedChanges hasChanges={hasChanges} />
      </Form>
    </div>
  )
}
