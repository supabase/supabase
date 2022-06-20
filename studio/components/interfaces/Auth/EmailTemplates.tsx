import { Form, Input, Tabs } from '@supabase/ui'
import CodeEditor from 'components/ui/CodeEditor'
import InformationBox from 'components/ui/InformationBox'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { TEMPLATES_SCHEMAS } from 'stores/authConfig/schema'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '../../ui/Forms'

const EmailTemplates = observer(() => {
  const { authConfig, ui } = useStore()

  const isLoaded = authConfig.isLoaded

  return (
    <div>
      <FormHeader
        title="Email Templates"
        description={`You can use your own SMTP server instead of the built-in email service.`}
      />
      <FormPanel>
        <Tabs
          defaultActiveId={TEMPLATES_SCHEMAS[0].title.trim().replace(/\s+/g, '-')}
          type="underlined"
          listClassNames="px-8 pt-4"
          size="small"
          scrollable
        >
          {TEMPLATES_SCHEMAS.map((template) => {
            const INITIAL_VALUES: { [x: string]: string } = {}

            /**
             * construct values for INITIAL_VALUES
             *
             * return empty string `""` rather than `null`
             * as it breaks form. null is not a valid value.
             */
            Object.keys(template.properties).forEach((key) => {
              INITIAL_VALUES[key] = authConfig.config[key] ?? ''
            })

            const messageSlug = `MAILER_TEMPLATES_${template.id}_CONTENT`
            const messageProperty = template.properties[messageSlug]

            return (
              <Tabs.Panel id={template.title.trim().replace(/\s+/g, '-')} label={template.title}>
                <Form
                  id="auth-config-email-templates"
                  className="!border-t-0"
                  initialValues={INITIAL_VALUES}
                  onSubmit={async (values: any, { setSubmitting, resetForm }: any) => {
                    const payload = { ...values }

                    try {
                      setSubmitting(true)
                      await authConfig.update(payload)
                      setSubmitting(false)

                      ui.setNotification({
                        category: 'success',
                        message: `Updated settings`,
                      })
                    } catch (error) {
                      ui.setNotification({
                        category: 'error',
                        message: `Failed to update settings`,
                      })
                      setSubmitting(false)
                    }
                  }}
                >
                  {({ isSubmitting, handleReset, resetForm, values, initialValues }: any) => {
                    /**
                     * Tracks changes in form
                     */
                    const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

                    /**
                     * Form is reset once remote data is loaded in store
                     */
                    useEffect(() => {
                      resetForm({
                        values: authConfig.config,
                        initialValues: authConfig.config,
                      })
                    }, [authConfig.isLoaded])

                    return (
                      <>
                        <FormSection
                          className="!border-t-0"
                          header={
                            <FormSectionLabel>
                              <span>SMTP Provider Settings</span>
                              <p className="text-scale-900 my-4">
                                Your SMTP Credentials will always be encrypted in our database.
                              </p>
                            </FormSectionLabel>
                          }
                        >
                          <FormSectionContent loading={!isLoaded}>
                            {Object.keys(template.properties).map((x: string) => {
                              /**
                               * Properties of the form
                               */
                              const properties = template.properties[x]

                              /**
                               * Conditionally hide properties based on value of key
                               */
                              if (properties.type === 'code') {
                                return null
                              }

                              switch (properties.type) {
                                case 'string':
                                  return (
                                    <Input
                                      size="small"
                                      layout="vertical"
                                      id={x}
                                      key={x}
                                      name={x}
                                      label={properties.title}
                                      descriptionText={
                                        properties.description ? (
                                          <ReactMarkdown
                                            unwrapDisallowed
                                            disallowedElements={['p']}
                                          >
                                            {properties.description}
                                          </ReactMarkdown>
                                        ) : null
                                      }
                                      //
                                      // @ts-expect-error
                                      //
                                      // to do: change to "string" | React.ReactNode | undefined
                                      //
                                      labelOptional={
                                        properties.descriptionOptional ? (
                                          <ReactMarkdown
                                            unwrapDisallowed
                                            disallowedElements={['p']}
                                          >
                                            {properties.descriptionOptional}
                                          </ReactMarkdown>
                                        ) : null
                                      }
                                    />
                                  )
                                  break
                              }
                            })}
                          </FormSectionContent>
                        </FormSection>
                        <FormSection className="!mt-0 grid-cols-12 !border-t-0 !pt-0">
                          <FormSectionContent loading={!isLoaded} fullWidth>
                            {messageProperty && (
                              <>
                                <FormSectionLabel>
                                  <span>{messageProperty.title}</span>
                                </FormSectionLabel>
                                <InformationBox
                                  title={'Message variables'}
                                  hideCollapse={false}
                                  defaultVisibility={true}
                                  description={
                                    messageProperty.description && (
                                      <ReactMarkdown>{messageProperty.description}</ReactMarkdown>
                                    )
                                  }
                                />
                                <div className="relative">
                                  <CodeEditor
                                    id="code-id"
                                    loading={!isLoaded}
                                    language="html"
                                    className="!mb-0 h-96 overflow-hidden rounded border"
                                    defaultValue={authConfig?.config?.[messageSlug] || ''}
                                    onInputChange={(e) => console.log(e)}
                                    options={{ wordWrap: 'off', contextmenu: false }}
                                  />
                                </div>
                              </>
                            )}
                            <div className="col-span-12 flex w-full justify-between">
                              <FormActions
                                handleReset={() => {
                                  resetForm({
                                    values: authConfig.config,
                                    initialValues: authConfig.config,
                                  })
                                }}
                                isSubmitting={isSubmitting}
                                hasChanges={hasChanges}
                                helper={'Learn more about global Auth settings'}
                              />
                            </div>
                          </FormSectionContent>
                        </FormSection>
                      </>
                    )
                  }}
                </Form>
              </Tabs.Panel>
            )
          })}
        </Tabs>
      </FormPanel>
    </div>
  )
})

export { EmailTemplates }
