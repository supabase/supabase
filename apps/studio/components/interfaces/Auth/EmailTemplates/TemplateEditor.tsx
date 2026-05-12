import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Book, BookOpen } from 'lucide-react'
import type { editor } from 'monaco-editor'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  Input_Shadcn_,
  Label_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import type { AuthTemplate } from './EmailTemplates.types'
import { ResetTemplateDialog } from './ResetTemplateDialog'
import { SpamValidation } from './SpamValidation'
import { PreventNavigationOnUnsavedChanges } from '@/components/ui-patterns/Dialogs/PreventNavigationOnUnsavedChanges'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { InlineLink } from '@/components/ui/InlineLink'
import { TwoOptionToggle } from '@/components/ui/TwoOptionToggle'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useValidateSpamMutation, ValidateSpamResponse } from '@/data/auth/validate-spam-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'

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
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { id, properties } = template
  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const messageSlug = `MAILER_TEMPLATES_${id}_CONTENT` as EmailTemplateContentKey

  const { data: authConfig, isSuccess } = useAuthConfigQuery({ projectRef })

  const [validationResult, setValidationResult] = useState<ValidateSpamResponse>()
  const [bodyValue, setBodyValue] = useState((authConfig && authConfig[messageSlug]) ?? '')
  const [, setHasUnsavedChanges] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [activeView, setActiveView] = useState<'source' | 'preview'>('source')

  // [Joshen] Error state is handled in the parent

  const { mutate: validateSpam } = useValidateSpamMutation()

  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      setIsSavingTemplate(false)
      toast.error(`Failed to update email templates: ${error.message}`)
    },
  })

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
                  setHasUnsavedChanges(false) // Reset the unsaved changes state
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

  // Check if form values have changed
  const formValues = form.watch()
  const baselineValues = INITIAL_VALUES
  const baselineBodyValue = (authConfig && authConfig[messageSlug]) ?? ''
  const hasCustomTemplate =
    authConfig?.MAILER_TEMPLATES_CUSTOM_CONTENTS?.[messageSlug] === true ||
    (subjectSlug !== undefined &&
      authConfig?.MAILER_SUBJECTS_CUSTOM_CONTENTS?.[subjectSlug] === true)
  const hasFormChanges = JSON.stringify(formValues) !== JSON.stringify(baselineValues)
  const hasChanges = hasFormChanges || baselineBodyValue !== bodyValue

  // Function to insert text at cursor position
  const insertTextAtCursor = (text: string) => {
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

      // Focus the editor after insertion
      editor.focus()
    }
  }

  // Update form values when authConfig changes
  useEffect(() => {
    if (authConfig) {
      form.reset(getFormValuesFromConfig(authConfig))
      setBodyValue((authConfig && authConfig[messageSlug]) ?? '')
    }
  }, [authConfig, getFormValuesFromConfig, messageSlug, form])

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent>
          {Object.keys(properties).map((x: string) => {
            const property = properties[x]
            if (property.type === 'string' && x !== messageSlug) {
              return (
                <FormField
                  key={x}
                  control={form.control}
                  name={x}
                  render={({ field }) => (
                    <FormItemLayout className="gap-y-3" layout="vertical" label={property.title}>
                      <FormControl>
                        <Input_Shadcn_ id={x} {...field} disabled={!canUpdateConfig} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              )
            }
            return null
          })}
        </CardContent>

        {messageProperty && (
          <>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <Label_Shadcn_>Body</Label_Shadcn_>
                <TwoOptionToggle
                  width={60}
                  options={['preview', 'source']}
                  activeOption={activeView}
                  onClickOption={(option) => setActiveView(option as 'source' | 'preview')}
                  borderOverride="border-muted"
                />
              </div>
              {activeView === 'source' ? (
                <>
                  <div className="overflow-hidden rounded-md border dark:border-control overflow-hidden [&_.monaco-editor]:outline-0 [&_.monaco-editor-background]:bg-surface-200/30! [&_.monaco-editor_.margin]:bg-surface-200/30! dark:[&_.monaco-editor-background]:bg-surface-300! dark:[&_.monaco-editor_.margin]:bg-surface-300!">
                    <CodeEditor
                      id="code-id"
                      language="html"
                      isReadOnly={!canUpdateConfig}
                      className="mb-0! relative h-96 outline-hidden outline-offset-0 outline-width-0 outline-0"
                      onInputChange={(e: string | undefined) => {
                        setBodyValue(e ?? '')
                        if (bodyValue !== e) setHasUnsavedChanges(true)
                      }}
                      options={{ wordWrap: 'on', contextmenu: false, padding: { top: 16 } }}
                      value={bodyValue}
                      editorRef={editorRef}
                    />
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <div className="flex items-center gap-x-1">
                      <p className="text-sm">Template variables</p>
                      <ButtonTooltip
                        asChild
                        type="text"
                        className="w-7"
                        icon={<BookOpen />}
                        tooltip={{
                          content: {
                            side: 'right',
                            text: 'Documentation',
                          },
                        }}
                      >
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`${DOCS_URL}/guides/local-development/customizing-email-templates#template-variables`}
                        />
                      </ButtonTooltip>
                    </div>
                    <div className="flex flex-wrap gap-x-1">
                      {template.variables.map((variable) => (
                        <Tooltip key={variable.value}>
                          <TooltipTrigger asChild>
                            <Button
                              type="outline"
                              size="tiny"
                              className="rounded-full"
                              onClick={() => insertTextAtCursor(variable.value)}
                            >
                              {variable.value}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {variable.description}

                            {variable.name === 'Token' &&
                              template.variables.some((x) => x.name === 'ConfirmationURL') && (
                                <>
                                  {' '}
                                  Can be used instead of{' '}
                                  <code className="text-code-inline">ConfirmationURL</code>
                                </>
                              )}

                            {variable.name === 'SiteURL' && (
                              <>
                                {' '}
                                as defined in{' '}
                                <InlineLink href={`/project/${projectRef}/auth/url-configuration`}>
                                  URL Configuration
                                </InlineLink>
                              </>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <iframe
                    className="mb-0! mt-0 overflow-hidden h-96 w-full rounded-md border bg-white"
                    title={id}
                    srcDoc={bodyValue}
                    sandbox="allow-scripts allow-forms"
                  />
                  <Admonition
                    type="default"
                    title="Email rendering may differ"
                    description="The preview shown here may differ slightly from how your email appears in the recipient’s email client."
                  />
                </>
              )}
            </CardContent>

            <SpamValidation spamRules={spamRules} />

            <CardFooter className="flex flex-row justify-between gap-2">
              {hasCustomTemplate && !hasChanges && (
                <ResetTemplateDialog
                  template={template}
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
            </CardFooter>
          </>
        )}
      </form>
      <PreventNavigationOnUnsavedChanges hasChanges={hasChanges} />
    </Form>
  )
}
