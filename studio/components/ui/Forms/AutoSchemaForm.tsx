import { Button, Form, InputNumber, Toggle } from '@supabase/ui'
import React from 'react'

const AutoSchemaForm = () => {
  // panel
  const Panel = ({
    children,
    header,
    footer,
  }: {
    children: React.ReactNode
    header?: React.ReactNode
    footer?: React.ReactNode
  }) => (
    <div
      className="
      bg-scale-100 
      dark:bg-scale-300 
      
      border-scale-400 my-8 overflow-hidden rounded-md border shadow"
    >
      {header && (
        <div className="bg-scale-100 dark:bg-scale-200 border-scale-400 border-b px-8 py-4">
          {header}
        </div>
      )}
      <div className="space-y-6 py-6">{children}</div>
      {footer}
    </div>
  )

  const Section = ({
    children,
    header,
  }: {
    children: React.ReactNode
    header?: React.ReactNode
  }) => (
    <div className="grid grid-cols-12 px-8 py-2">
      {header}
      {children}
    </div>
  )

  return (
    <>
      <Form
        id="general_form"
        initialValues={{
          enable_signups: true,
          jwt_expiry: 3600,
        }}
        onSubmit={(values: any, { setSubmitting }: any) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2))
            setSubmitting(false)
          }, 400)
        }}
        validate={(values: any) => {
          const errors: any = {}
          if (!values.jwt_expiry) {
            errors.jwt_expiry = 'This is required'
          }
          if (values.jwt_expiry > 604800) {
            errors.jwt_expiry =
              'The maxiumum allowed is 604,800 seconds. Use a smaller number of seconds.'
          }
          return errors
        }}
      >
        {({ isSubmitting, handleReset }: any) => (
          <Panel
            footer={
              <>
                <div className="border-scale-400 border-t"></div>
                <div className="flex justify-end gap-2 py-3 px-6">
                  <Button type="default" htmlType="reset" onClick={() => handleReset()}>
                    Cancel
                  </Button>
                  <Button
                    loading={isSubmitting}
                    type="primary"
                    htmlType="submit"
                    form="general_form"
                  >
                    Save
                  </Button>
                </div>
              </>
            }
          >
            <Section
              header={<label className="text-scale-1200 col-span-4 text-sm">User Signups</label>}
            >
              <Toggle
                id="enable_signups"
                className="col-span-8"
                label="Allow new users to sign up"
                layout="flex"
                descriptionText="If this is disabled, new users will not be able to sign up to your application."
              />
            </Section>
            <div className="border-scale-400 border-t"></div>
            <Section
              header={<label className="text-scale-1200 col-span-4 text-sm">User Sessions</label>}
            >
              <InputNumber
                className="col-span-8"
                id="jwt_expiry"
                label="JWT expiry limit"
                descriptionText="How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604,800 seconds (one week)."
              />
            </Section>
          </Panel>
        )}
      </Form>
    </>
  )
}

export { AutoSchemaForm }
