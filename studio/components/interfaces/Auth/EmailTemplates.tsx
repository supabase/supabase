import { Form, Input, Tabs } from '@supabase/ui'
import CodeEditor from 'components/ui/CodeEditor'
import InformationBox from 'components/ui/InformationBox'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
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
          {TEMPLATES_SCHEMAS.map((template, i) => {
            const [bodyValue, setBodyValue] = useState('')

            const INITIAL_VALUES: { [x: string]: string } = {}

            // console.log('template.properties', template.properties)

            /**
             * construct values for INITIAL_VALUES
             *
             * return empty string `""` rather than `null`
             * as it breaks form. null is not a valid value.
             */
            Object.keys(template.properties).forEach((key) => {
              INITIAL_VALUES[key] = authConfig.config[key] ?? ''
            })

            console.log(`INITIAL_VALUES for ${template.id}`, INITIAL_VALUES)

            const messageSlug = `MAILER_TEMPLATES_${template.id}_CONTENT`
            const messageProperty = template.properties[messageSlug]

            const panelId = template.title.trim().replace(/\s+/g, '-')
            const formId = `auth-config-email-templates--${template.id}`

            delete INITIAL_VALUES[messageSlug]

            return (
              <Tabs.Panel id={panelId} label={template.title} key={panelId}>
                <Form
                  id={formId}
                  className="!border-t-0"
                  initialValues={INITIAL_VALUES}
                  onSubmit={async (values: any, { setSubmitting, resetForm }: any) => {
                    console.log('hello world')

                    const payload = { ...values }

                    // remove rendundant value
                    delete payload[messageSlug]

                    if (messageProperty) {
                      payload[messageSlug] = bodyValue
                    }

                    console.log('payload', payload)

                    try {
                      setSubmitting(true)
                      await authConfig.update(payload)
                      setSubmitting(false)

                      ui.setNotification({
                        category: 'success',
                        message: `Updated settings`,
                      })

                      resetForm({
                        values: values,
                        initialValues: values,
                      })
                      setBodyValue(authConfig?.config?.[messageSlug])
                    } catch (error) {
                      ui.setNotification({
                        category: 'error',
                        message: `Failed to update settings`,
                      })
                      setSubmitting(false)
                    }
                  }}
                >
                  {({ isSubmitting, resetForm, values, initialValues }: any) => {
                    /**
                     * Tracks changes in form
                     */
                    const hasChanges = () => {
                      if (JSON.stringify(values) !== JSON.stringify(initialValues)) return true

                      if (authConfig?.config?.[messageSlug]) {
                        if (
                          authConfig?.config?.[messageSlug] &&
                          authConfig?.config?.[messageSlug] !== bodyValue
                        )
                          return true
                      }

                      return false
                    }

                    /**
                     * Form is reset once remote data is loaded in store
                     */
                    useEffect(() => {
                      resetForm({
                        values: INITIAL_VALUES,
                        initialValues: INITIAL_VALUES,
                      })
                      setBodyValue(authConfig?.config?.[messageSlug])
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
                                    // defaultValue={bodyValue}
                                    onInputChange={(e) => setBodyValue(e)}
                                    options={{ wordWrap: 'off', contextmenu: false }}
                                    value={bodyValue}
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
                                  setBodyValue(authConfig?.config?.[messageSlug])
                                }}
                                form={formId}
                                isSubmitting={isSubmitting}
                                hasChanges={hasChanges()}
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
