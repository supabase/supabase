import { PermissionAction } from '@supabase/shared-types/out/constants'
import { debounce } from 'lodash'
import { Code, Monitor } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

import { useParams } from 'common'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import InformationBox from 'components/ui/InformationBox'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useValidateSpamMutation, ValidateSpamResponse } from 'data/auth/validate-spam-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { FormSchema } from 'types'
import {
  Form,
  Input,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { SpamValidation } from './SpamValidation'

interface TemplateEditorProps {
  template: FormSchema
}

const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const { ref: projectRef } = useParams()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

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

  const formId = `auth-config-email-templates-${id}`
  const INITIAL_VALUES = useMemo(() => {
    const result: { [x: string]: string } = {}
    Object.keys(properties).forEach((key) => {
      result[key] = ((authConfig && authConfig[key as keyof typeof authConfig]) ?? '') as string
    })
    return result
  }, [authConfig, properties])

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

  const onSubmit = (values: any, { resetForm }: any) => {
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
                  resetForm({
                    values: values,
                    initialValues: values,
                  })
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

  return (
    <Form id={formId} className="!border-t-0" initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
      {({ resetForm, values, initialValues }: any) => {
        const message = (authConfig && authConfig[messageSlug]) ?? ''
        const hasChanges =
          JSON.stringify(values) !== JSON.stringify(initialValues) || message !== bodyValue

        return (
          <>
            <FormSection className="!border-t-0 pb-8 pt-4">
              <FormSectionContent loading={false}>
                {Object.keys(properties).map((x: string) => {
                  const property = properties[x]
                  if (property.type === 'string') {
                    return (
                      <div key={x} className="space-y-3">
                        <label className="col-span-12 text-sm text-foreground lg:col-span-5">
                          {property.title}
                        </label>
                        <Input
                          size="small"
                          layout="vertical"
                          id={x}
                          key={x}
                          name={x}
                          descriptionText={
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
                          disabled={!canUpdateConfig}
                        />
                      </div>
                    )
                  }
                })}
              </FormSectionContent>
            </FormSection>
            <FormSection className="!mt-0 grid-cols-12 !border-t-0 !pt-0 pb-7">
              <FormSectionContent fullWidth loading={false}>
                {messageProperty && (
                  <>
                    <div className="space-y-3">
                      <FormSectionLabel>
                        <span>{messageProperty.title}</span>
                      </FormSectionLabel>
                      <InformationBox
                        defaultVisibility
                        title="Message variables"
                        hideCollapse={false}
                        description={
                          messageProperty.description && (
                            <ReactMarkdown>{messageProperty.description}</ReactMarkdown>
                          )
                        }
                      />
                    </div>
                    <Tabs_Shadcn_ defaultValue="source">
                      <TabsList_Shadcn_ className="gap-3">
                        <TabsTrigger_Shadcn_ value="source" className="gap-2">
                          <Code size={14} />
                          Source
                        </TabsTrigger_Shadcn_>
                        <TabsTrigger_Shadcn_ value="preview" className="gap-2">
                          <Monitor size={14} />
                          Preview
                        </TabsTrigger_Shadcn_>
                      </TabsList_Shadcn_>
                      <TabsContent_Shadcn_ value="source" className="-space-y-px">
                        <CodeEditor
                          id="code-id"
                          language="html"
                          isReadOnly={!canUpdateConfig}
                          className="!mb-0 relative h-96 overflow-hidden rounded border rounded-b-none"
                          onInputChange={(e: string | undefined) => {
                            setBodyValue(e ?? '')
                            if (bodyValue !== e) setHasUnsavedChanges(true)
                          }}
                          options={{ wordWrap: 'on', contextmenu: false }}
                          value={bodyValue}
                        />
                        <SpamValidation validationResult={validationResult} />
                      </TabsContent_Shadcn_>
                      <TabsContent_Shadcn_ value="preview">
                        <Admonition
                          type="default"
                          title="The preview may differ slightly from the actual rendering in the email client"
                        />
                        <iframe
                          className="!mb-0 overflow-hidden h-96 w-full rounded border"
                          title={id}
                          srcDoc={bodyValue}
                        />
                      </TabsContent_Shadcn_>
                    </Tabs_Shadcn_>
                  </>
                )}
                <div className="col-span-12 flex w-full">
                  <FormActions
                    handleReset={() => {
                      resetForm({
                        values: authConfig,
                        initialValues: authConfig,
                      })
                      setBodyValue((authConfig && authConfig[messageSlug]) ?? '')
                    }}
                    form={formId}
                    isSubmitting={isSavingTemplate}
                    hasChanges={hasChanges}
                    disabled={!canUpdateConfig}
                    helper={
                      preventSaveFromSpamCheck
                        ? 'Please rectify all spam warnings before saving while using the built-in email service'
                        : !canUpdateConfig
                          ? 'You need additional permissions to update authentication settings'
                          : undefined
                    }
                  />
                </div>
              </FormSectionContent>
            </FormSection>
          </>
        )
      }}
    </Form>
  )
}

export default TemplateEditor
