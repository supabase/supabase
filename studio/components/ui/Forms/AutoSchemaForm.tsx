import { Button, Form, Input, InputNumber, Toggle } from '@supabase/ui'
import { useStore } from 'hooks'
import React from 'react'

const AutoSchemaForm = () => {
  const { authConfig, ui } = useStore()

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
    
      border-scale-400 overflow-hidden rounded-md border shadow"
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
        id="auth-config-general-form"
        initialValues={{
          DISABLE_SIGNUP: !authConfig.config.DISABLE_SIGNUP,
          JWT_EXP: authConfig.config.JWT_EXP,
          SITE_URL: authConfig.config.SITE_URL,
        }}
        onSubmit={async (values: any, { setSubmitting }: any) => {
          const payload = values
          payload.DISABLE_SIGNUP = !values.DISABLE_SIGNUP
          console.log('payload', payload)
          try {
            setSubmitting(true)
            await authConfig.update(payload)
            setSubmitting(false)
          } catch (error) {
            setSubmitting(false)
          }
        }}
        validate={(values: any) => {
          const errors: any = {}
          // if (!values.jwt_expiry) {
          //   errors.jwt_expiry = 'This is required'
          // }
          // if (values.jwt_expiry > 604800) {
          //   errors.jwt_expiry =
          //     'The maxiumum allowed is 604,800 seconds. Use a smaller number of seconds.'
          // }
          return errors
        }}
      >
        {({ isSubmitting, handleReset, values }: any) => (
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
                    form="auth-config-general-form"
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
              <div className="col-span-8 flex flex-col gap-6">
                <Toggle
                  id="DISABLE_SIGNUP"
                  size="small"
                  className="col-span-8"
                  label="Allow new users to sign up"
                  layout="flex"
                  descriptionText="If this is disabled, new users will not be able to sign up to your application."
                />
              </div>
            </Section>
            <div className="border-scale-400 border-t"></div>
            <Section
              header={<label className="text-scale-1200 col-span-4 text-sm">User Sessions</label>}
            >
              <div className="col-span-8 flex flex-col gap-6">
                {/**
                 *
                 * permitted redirects
                 * for anything on that domain
                 *
                 * talk to @kangming about this
                 *
                 */}
                <Input
                  id="SITE_URL"
                  size="small"
                  className="col-span-8"
                  label="Site URL"
                  descriptionText="The base URL of your website. Used as an allow-list for redirects and for constructing URLs used in emails."
                />
                <InputNumber
                  id="JWT_EXP"
                  size="small"
                  className="col-span-8"
                  label="JWT expiry limit"
                  descriptionText="How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604,800 seconds (one week)."
                />
              </div>
            </Section>
          </Panel>
        )}
      </Form>
    </>
  )
}

export { AutoSchemaForm }
