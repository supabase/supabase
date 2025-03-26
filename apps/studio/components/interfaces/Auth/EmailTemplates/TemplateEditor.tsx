import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Code, Monitor } from 'lucide-react'
import { editor } from 'monaco-editor'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

import { useParams } from 'common'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useValidateSpamMutation, ValidateSpamResponse } from 'data/auth/validate-spam-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { FormSchema } from 'types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SpamValidation } from './SpamValidation'

interface TemplateEditorProps {
  template: FormSchema
}

const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const { ref: projectRef } = useParams()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  // Add a ref to the code editor
  const editorRef = useRef<editor.IStandaloneCodeEditor>()

  // [Joshen] Error state is handled in the parent
  const { data: authConfig, isSuccess } = useAuthConfigQuery({ projectRef })

  const { mutate: validateSpam } = useValidateSpamMutation({
    onSuccess: (res) => setValidationResult(res),
  })

  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      setIsSavingTemplate(false)
      toast.error(`Failed to update email templates: ${error.message}`)
    },
  })

  const { id, properties } = template

  const messageSlug = `MAILER_TEMPLATES_${id}_CONTENT` as keyof typeof authConfig
  const messageProperty = properties[messageSlug]
  const builtInSMTP =
    isSuccess &&
    authConfig &&
    (!authConfig.SMTP_HOST || !authConfig.SMTP_USER || !authConfig.SMTP_PASS)

  const [validationResult, setValidationResult] = useState<ValidateSpamResponse>()
  const [bodyValue, setBodyValue] = useState((authConfig && authConfig[messageSlug]) ?? '')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const spamRules = (validationResult?.rules ?? []).filter((rule) => rule.score > 0)
  const preventSaveFromSpamCheck = builtInSMTP && spamRules.length > 0

  // Create form values
  const INITIAL_VALUES = useMemo(() => {
    const result: { [x: string]: string } = {}
    Object.keys(properties).forEach((key) => {
      result[key] = ((authConfig && authConfig[key as keyof typeof authConfig]) ?? '') as string
    })
    return result
  }, [authConfig, properties])

  // Setup React Hook Form
  const form = useForm({
    defaultValues: INITIAL_VALUES,
  })

  // Update form values when authConfig changes
  useEffect(() => {
    if (authConfig) {
      const values: { [key: string]: string } = {}
      Object.keys(properties).forEach((key) => {
        values[key] = ((authConfig && authConfig[key as keyof typeof authConfig]) ?? '') as string
      })
      form.reset(values)
      setBodyValue((authConfig && authConfig[messageSlug]) ?? '')
    }
  }, [authConfig, properties, messageSlug, form])

  const onSubmit = (values: any) => {
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
                  toast.success('Successfully updated settings')
                  setHasUnsavedChanges(false) // Reset the unsaved changes state
                },
              }
            )
          }
        },
        onError: () => setIsSavingTemplate(false),
      }
    )
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // deprecated, but older browsers still require this
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

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

  // Single useMemo hook to parse and prepare message variables
  const messageVariables = useMemo(() => {
    if (!messageProperty?.description) return []

    // Parse bullet point format: - `{{ .Variable }}` : Description
    const lines = messageProperty.description.split('\n')
    const variables: { variable: string; description: string }[] = []

    for (const line of lines) {
      // Match lines that start with a bullet point followed by a variable in the format {{ .Variable }}
      // Handle variations in formatting (with or without backticks, different spacing)
      const match = line.match(/-\s*`?({{\s*\.\w+\s*}})`?\s*(?::|-)?\s*(.+)/)
      if (match && match[1] && match[2]) {
        variables.push({
          variable: match[1].replace(/`/g, '').trim(),
          description: match[2].trim(),
        })
      }
    }

    return variables
  }, [messageProperty?.description])

  // Check if form values have changed
  const formValues = form.watch()
  const hasFormChanges = JSON.stringify(formValues) !== JSON.stringify(INITIAL_VALUES)
  const hasChanges = hasFormChanges || ((authConfig && authConfig[messageSlug]) ?? '') !== bodyValue

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

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent>
          {Object.keys(properties).map((x: string) => {
            const property = properties[x]
            if (property.type === 'string' && x !== messageSlug) {
              return (
                <FormField_Shadcn_
                  key={x}
                  control={form.control}
                  name={x}
                  render={({ field }) => (
                    <FormItemLayout
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
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ id={x} {...field} disabled={!canUpdateConfig} />
                      </FormControl_Shadcn_>
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
            <CardContent className="p-0">
              <Label_Shadcn_ className="p-6 pb-4 block">Message body</Label_Shadcn_>
              <Tabs_Shadcn_ defaultValue="source">
                <TabsList_Shadcn_ className="gap-3 px-6">
                  <TabsTrigger_Shadcn_ value="source" className="gap-2">
                    <Code size={14} />
                    Source
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="preview" className="gap-2">
                    <Monitor size={14} />
                    Preview
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_ value="source" className="p-0 mt-0">
                  <CodeEditor
                    id="code-id"
                    language="html"
                    isReadOnly={!canUpdateConfig}
                    className="!mb-0 relative h-96 overflow-hidden p-0"
                    onInputChange={(e: string | undefined) => {
                      setBodyValue(e ?? '')
                      if (bodyValue !== e) setHasUnsavedChanges(true)
                    }}
                    options={{ wordWrap: 'on', contextmenu: false, padding: { top: 16 } }}
                    value={bodyValue}
                    editorRef={editorRef}
                  />
                  {messageVariables.length > 0 && (
                    <div className="px-6 py-3 border-t bg-surface-200">
                      <div className="flex flex-wrap gap-1">
                        {messageVariables.map(({ variable, description }) => (
                          <Tooltip key={variable}>
                            <TooltipTrigger asChild>
                              <Button
                                type="outline"
                                size="tiny"
                                className="rounded-full"
                                onClick={() => insertTextAtCursor(variable)}
                              >
                                {variable}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{description || 'Variable description not available'}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="preview" className="pt-0 mt-0">
                  <iframe
                    className="!mb-0 mt-0 overflow-hidden h-96 w-full"
                    title={id}
                    srcDoc={bodyValue}
                  />
                  <Admonition
                    type="default"
                    title="The preview may differ slightly from the actual rendering in the email client"
                    className="rounded-none border-0 mb-0"
                  />
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </CardContent>
            <CardContent>
              <SpamValidation validationResult={validationResult} />
            </CardContent>
            <CardFooter className="justify-end space-x-2">
              {hasChanges && (
                <Button
                  type="default"
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
                disabled={
                  !canUpdateConfig || isSavingTemplate || !hasChanges || preventSaveFromSpamCheck
                }
                loading={isSavingTemplate}
              >
                Save changes
              </Button>
            </CardFooter>
          </>
        )}
      </form>
    </Form_Shadcn_>
  )
}

export default TemplateEditor
