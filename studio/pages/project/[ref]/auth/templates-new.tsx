import {
  Button,
  Collapsible,
  Form,
  IconArrowRight,
  IconCheck,
  IconChevronUp,
  IconGlobe,
  IconTrash,
  IconX,
  Input,
  InputNumber,
  Modal,
  Tabs,
  Toggle,
} from '@supabase/ui'
import { AuthLayout } from 'components/layouts'
import AutoSchemaForm from 'components/ui/Forms/AutoSchemaForm'
import { withAuth } from 'hooks'
import { observer } from 'mobx-react-lite'
import React, { useReducer, useState } from 'react'
import AuthFormSchema from './AuthFormSchema.json'

// import GoogleIcon './../../../static/icons/google-icon.svg'

const DocsButton = () => {
  return (
    <button
      className="
        bg-scale-300
        dark:bg-scale-100
        border-scale-500  
        hover:border-scale-700  
        dark:border-scale-300 
        dark:hover:border-scale-500 group
        my-6 flex
        w-full items-center 
        gap-6 
        rounded-md border px-6
        py-4 text-left
        shadow-sm
        transition
      "
    >
      <div className="bg-brand-900 h-10 w-10 rounded p-1 transition duration-500 group-hover:-rotate-3 group-hover:scale-110">
        {/* <img
            className="text-white w-12 h-12"
            src="/icons/docs-illustration.svg"
          /> */}
      </div>
      <div className="grow">
        <h3 className="text-scale-1200">Use authentication as the backbone of your app</h3>
        <p className="text-scale-900 text-xs">
          Learn how to use Supabase Auth with Auth Policies to pick and choose what users see what.
        </p>
        <p className="text-brand-900 mt-2 flex items-center gap-1 text-xs">
          See Documenation
          <span className="transition group-hover:translate-x-1">
            <IconArrowRight strokeWidth={2} width={12} />
          </span>
        </p>
      </div>
      <div className="text-scale-900">
        <IconX />
      </div>
    </button>
  )
}

const CardForm = () => {
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
      <AutoSchemaForm />
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
        validate={(values: Values) => {
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

// type to do later..
let initialState: any = {}

AuthFormSchema.map((provider) => {
  initialState[`${provider.name.toLowerCase()}-active`] = provider.name == 'Email' ? true : false
  initialState[`${provider.name.toLowerCase()}-app-id`] = ''
  initialState[`${provider.name.toLowerCase()}-id-key`] = ''
})

console.log('form initialState', initialState)

function providersReducer(state: any, action: any) {
  switch (action.type) {
    case 'update':
      return Object.assign(state, action.values)
    // case 'decrement':
    //   return { count: state.count - 1 }
    default:
      throw new Error()
  }
}

const SmtpForm = () => {
  const [active, setActive] = useState(true)

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
    <div className="grid grid-cols-12 gap-8 px-8 py-2">
      {header && <div className="col-span-4">{header}</div>}
      {children}
    </div>
  )

  return (
    <>
      <Form
        id="general_form"
        initialValues={{
          enable_smtp: false,
          jwt_expiry: 3600,
        }}
        onSubmit={(values: any, { setSubmitting }: any) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2))
            setSubmitting(false)
          }, 400)
        }}
        validate={(values: Values) => {
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
        {({ isSubmitting, handleReset, values }: any) => (
          <Panel
            footer={
              <>
                <div className="border-scale-400 border-t"></div>
                <div className="flex justify-end gap-2 py-3 px-6">
                  <Button
                    loading={isSubmitting}
                    type="secondary"
                    htmlType="reset"
                    onClick={() => handleReset()}
                  >
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
            {/* <Section
              header={
                <label className="text-sm text-scale-1200 col-span-4">
                  Enable SMTP
                </label>
              }
            > */}
            <Toggle
              // onChange={() => setActive(!active)}
              // checked={active}
              name="enable_smtp"
              className="col-span-8 mx-8"
              label="Enable Custom SMTP"
              layout="flex"
              descriptionText="If this is disabled, new users will not be able to sign up to your application."
            />
            {/* </Section> */}
            <div className="border-scale-400 border-t"></div>
            <Section
              header={
                <div className="w-full">
                  <label className="text-scale-1100 text-sm">SMTP details</label>
                  <p className="text-scale-900 text-sm">
                    These settings can be found in your SMTP provider config
                  </p>
                </div>
              }
            >
              <div className="col-span-8 space-y-6">
                <Input label="Sender address" type="url" disabled={!values.enable_smtp} />
                <Input label="SMTP server host" disabled={!values.enable_smtp} />
                <InputNumber label="SMTP server port" disabled={!values.enable_smtp} />
                <Input label="SMTP account username" disabled={!values.enable_smtp} />
                <Input
                  label="SMTP account password"
                  type="password"
                  disabled={!values.enable_smtp}
                />
              </div>
            </Section>
            {values.enable_smtp && (
              <div className="mx-8">
                <DocsButton />
              </div>
            )}
          </Panel>
        )}
      </Form>
    </>
  )
}

const TemplatesForm = () => {
  const [active, setActive] = useState(true)

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
      border-scale-400 mb-8 overflow-hidden rounded-md border shadow"
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
    <div className="grid grid-cols-12 gap-8 px-8 py-2">
      {header && <div className="col-span-4">{header}</div>}
      {children}
    </div>
  )

  return (
    <>
      <Form
        id="general_form"
        initialValues={{
          enable_smtp: false,
          jwt_expiry: 3600,
        }}
        onSubmit={(values: any, { setSubmitting }: any) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2))
            setSubmitting(false)
          }, 400)
        }}
        validate={(values: Values) => {
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
        {({ isSubmitting, handleReset, values }: any) => (
          <>
            <div className="my-4">
              <Tabs
                defaultActiveId="confirm_signup"
                type="underlined"
                // listClassNames="px-8"
                size="medium"
              >
                <Tabs.Panel id={'confirm_signup'} label="Confirm Signup" />
                <Tabs.Panel id={'reset_password'} label="Reset Password" />
                <Tabs.Panel id={'magic_link'} label="Magic Link" />
                <Tabs.Panel id={'change_email_address'} label="Change Email Address" />
                <Tabs.Panel id={'invite_user'} label="Invite User" />
              </Tabs>
            </div>
            <Panel
              footer={
                <>
                  <div className="border-scale-400 border-t"></div>
                  <div className="flex justify-end gap-2 py-3 px-6">
                    <Button
                      loading={isSubmitting}
                      type="secondary"
                      htmlType="reset"
                      onClick={() => handleReset()}
                    >
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
              {/* <Section
              header={
                <label className="text-sm text-scale-1200 col-span-4">
                  Enable SMTP
                </label>
              }
            > */}
              {/* <Toggle
              // onChange={() => setActive(!active)}
              // checked={active}
              name="enable_smtp"
              className="col-span-8 mx-8"
              label="Enable Custom SMTP"
              layout="flex"
              descriptionText="If this is disabled, new users will not be able to sign up to your application."
            /> */}
              {/* </Section> */}
              {/* <div className="border-t border-scale-400"></div> */}
              <Section
                header={
                  <div className="w-full">
                    <h3 className="text-scale-1200 mb-4 text-base">Confirm Signup</h3>
                    <p className="text-scale-900 text-sm">
                      When a user signs up using an email address and password, you can send them a
                      confirmation email to verify their registered email address. Learn more
                    </p>
                  </div>
                }
              >
                <div className="col-span-8 space-y-6">
                  <Input label="Sender address" type="url" />
                  <Input label="SMTP server host" />
                  <InputNumber label="SMTP server port" />
                  <Input label="SMTP account username" />
                  <Input.TextArea
                    label="SMTP account password"
                    type="password"
                    rows={8}
                    defaultValue={`<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
                  `}
                  />
                </div>
              </Section>
              {values.enable_smtp && (
                <div className="mx-8">
                  <DocsButton />
                </div>
              )}
            </Panel>
          </>
        )}
      </Form>
    </>
  )
}

const Auth = () => {
  return (
    <AuthLayout title="Auth">
      <div className="p-4">
        <WholeForm />
      </div>
    </AuthLayout>
  )
}

export function WholeForm() {
  return (
    <div style={{ width: '820px' }} className="mx-auto">
      <div className="animate-fade-in space-y-12 py-12">
        <div>
          <h1 className="text-scale-1200 text-3xl">Emails</h1>
        </div>
        <button
          className="
                bg-scale-300
                dark:bg-scale-100
                border-scale-500  
                hover:border-scale-700  
                dark:border-scale-300 
                dark:hover:border-scale-500 group
                my-6 flex
                w-full items-center 
                gap-6 
                rounded-md border px-6
                py-4 text-left
                shadow-sm
                transition
              "
        >
          <div className="bg-brand-900 h-10 w-10 rounded p-1 transition duration-500 group-hover:-rotate-3 group-hover:scale-110">
            {/* <img
            className="text-white w-12 h-12"
            src="/icons/docs-illustration.svg"
          /> */}
          </div>
          <div className="grow">
            <h3 className="text-scale-1200">Use authentication as the backbone of your app</h3>
            <p className="text-scale-900 text-xs">
              Learn how to use Supabase Auth with Auth Policies to pick and choose what users see
              what.
            </p>
            <p className="text-brand-900 mt-2 flex items-center gap-1 text-xs">
              See Documenation
              <span className="transition group-hover:translate-x-1">
                <IconArrowRight strokeWidth={2} width={12} />
              </span>
            </p>
          </div>
          <div className="text-scale-900">
            <IconX />
          </div>
        </button>
        <div className="border-scale-400 border-t"></div>
        <div>
          <h3 className="text-scale-1200 mb-2 text-2xl">Custom SMTP</h3>
          <p className="text-scale-900 text-sm">
            You can use your own SMTP server instead of the built-in email service.
          </p>
          <SmtpForm />
        </div>
        <div>
          <h3 className="text-scale-1200 mb-2 text-2xl">Templates</h3>
          <p className="text-scale-900 text-sm">
            You can use your own SMTP server instead of the built-in email service.
          </p>
          <TemplatesForm />
        </div>
      </div>
    </div>
  )
}

export default withAuth(observer(Auth))
