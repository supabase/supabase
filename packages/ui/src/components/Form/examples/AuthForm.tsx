import React, { useReducer, useState } from 'react'
import {
  Button,
  IconArrowRight,
  IconCheck,
  IconChevronUp,
  IconGlobe,
  IconTrash,
  IconX,
  Input,
  InputNumber,
  Tabs,
  Toggle,
} from '../../../../'
import { Form } from './../'

import { Collapsible } from '../../Collapsible'

import { Modal } from '../../Modal'
import AuthFormSchema from './AuthFormSchema.json'

// import GoogleIcon './../../../static/icons/google-icon.svg'

const DocsButton = () => {
  return (
    <button
      className="
                bg-surface-100
                border-default  
                hover:border-strong  
                group
                my-6 flex
                w-full items-center 
                gap-6 
                rounded-md border px-6
                py-4 text-left
                shadow-sm
                transition
              "
    >
      <div className="bg-brand h-10 w-10 rounded p-1 transition duration-500 group-hover:-rotate-3 group-hover:scale-110">
        {/* <img
            className="text-white w-12 h-12"
            src="/icons/docs-illustration.svg"
          /> */}
      </div>
      <div className="grow">
        <h3 className="text-foreground">Use authentication as the backbone of your app</h3>
        <p className="text-foreground-muted text-xs">
          Learn how to use Supabase Auth with Auth Policies to pick and choose what users see what.
        </p>
        <p className="text-brand mt-2 flex items-center gap-1 text-xs">
          See Documenation
          <span className="transition group-hover:translate-x-1">
            <IconArrowRight strokeWidth={2} width={12} />
          </span>
        </p>
      </div>
      <div className="text-foreground-muted">
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
      bg-surface-100 
      border-muted my-8 overflow-hidden rounded-md border shadow"
    >
      {header && <div className="bg-background border-muted border-b px-8 py-4">{header}</div>}
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
        validate={(values) => {
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
                <div className="border-muted border-t"></div>
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
              header={<label className="text-foreground col-span-4 text-sm">User Signups</label>}
            >
              <Toggle
                id="enable_signups"
                className="col-span-8"
                label="Allow new users to sign up"
                layout="flex"
                descriptionText="If this is disabled, new users will not be able to sign up to your application."
              />
            </Section>
            <div className="border-muted border-t"></div>
            <Section
              header={<label className="text-foreground col-span-4 text-sm">User Sessions</label>}
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

const AuthForm = () => {
  const [providersFormState, dispatchProvidersForm] = useReducer(providersReducer, initialState)

  console.log('providersFormState from useState', providersFormState)

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
    <div className="bg-surface-100 border-overlay mx-auto my-8 w-3/4 overflow-hidden rounded-md border shadow">
      {header && <div className="bg-background border-overlay border-b px-8 py-4">{header}</div>}
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

  const CollapsibleContainer = ({
    children,
    header,
  }: {
    children: React.ReactNode
    header?: React.ReactNode
  }) => {
    return (
      <div
        className="
          bg-surface-200 border-default hover:border-strong hover:bg-overlay-hover mx-auto overflow-hidden
          border shadow
          transition first:rounded-tr  
          first:rounded-tl
          last:rounded-br
          last:rounded-bl
        "
      >
        {children}
      </div>
    )
  }

  type formObj = {
    type: string
    name: string
    label: string
    description: string
  }

  interface Provider {
    name: string
    icon: string
    form: formObj[]
  }

  const ProviderForm = ({ provider }: { provider: Provider }) => {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(
      providersFormState[`${provider.name.toLowerCase()}-active`]
    )

    console.log('panel active state', active)

    return (
      // <CollapsibleContainer>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="
            bg-surface-100 
            hover:bg-overlay-hover
            data-open:bg-selection
            border-default 
            hover:border-strong data-open:border-strong

            data-open:pb-px col-span-12 mx-auto
            -space-y-px overflow-hidden
            border shadow  
            
            transition
            first:rounded-tr

            first:rounded-tl
            last:rounded-br last:rounded-bl
            hover:z-50
            "
      >
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="
              
              text-foreground group 
              flex 
              w-full items-center justify-between rounded p-3 px-6"
          >
            <div className="flex items-center gap-3">
              <IconChevronUp
                className="text-border-stronger data-open-parent:rotate-0 data-closed-parent:rotate-180 transition"
                strokeWidth={2}
              />

              <img
                className="w-6 fill-red-400"
                src={`/icons/${provider.icon}.svg`}
                width={21}
                alt={`${provider.name} auth icon`}
              />

              <span className="text-base">{provider.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {active ? (
                <div className="bg-brand-200 border-brand-400 text-brand flex items-center gap-1 rounded-full border py-1 px-1 text-xs">
                  <span className="bg-brand text-brand-200 rounded-full p-0.5 text-xs">
                    <IconCheck strokeWidth={2} size={12} />
                  </span>
                  <span className="px-1">Enabled</span>
                </div>
              ) : (
                <div className="bg-surface-100 border-strong text-foreground-muted rounded-md border py-1 px-3 text-xs">
                  Disabled
                </div>
              )}
            </div>
          </button>
        </Collapsible.Trigger>
        <Form
          name={`provider-${provider.name}-form`}
          initialValues={{
            [`${provider.name.toLowerCase()}-active`]:
              providersFormState[`${provider.name.toLowerCase()}-active`] ||
              // empty form should have this as enabled for UX
              true,
            [`${provider.name.toLowerCase()}-app-id`]:
              providersFormState[`${provider.name.toLowerCase()}-app-id`],
            [`${provider.name.toLowerCase()}-id-key`]:
              providersFormState[`${provider.name.toLowerCase()}-id-key`],
          }}
          validate={(values) => {
            const errors: any = {}

            console.log('validation values', values)

            const input_active = `${provider.name.toLowerCase()}-active`
            const input_app_id = `${provider.name.toLowerCase()}-app-id`
            const input_id_key = `${provider.name.toLowerCase()}-id-key`

            if (values[input_app_id] && values[input_app_id].length < 10)
              errors[input_app_id] = 'App ID must be at least 10 characters long'
            if (values[input_app_id] && values[input_id_key].length < 10)
              errors[input_id_key] = 'Secret must be at least 10 characters long'

            if (values[input_active]) {
              if (!values[input_app_id])
                errors[input_app_id] =
                  'You need to input an application ID if you want to enable this provider.'
              if (!values[input_id_key])
                errors[input_id_key] =
                  'You need to input an application secret if you want to enable this provider.'
            }

            return errors
          }}
          onSubmit={(values: any, { setSubmitting }: any) => {
            setTimeout(() => {
              // alert(JSON.stringify(values, null, 2))
              dispatchProvidersForm({ type: 'update', values: values })
              setActive(values[`${provider.name.toLowerCase()}-active`])
              setSubmitting(false)
              setOpen(false)
            }, 400)
          }}
        >
          {({ isSubmitting, handleReset }: any) => (
            <Collapsible.Content>
              <div
                className="
                  bg-surface-100
                  text-foreground border-default group border-t py-6 px-6
                "
              >
                <div className="mx-auto max-w-md space-y-6">
                  <Toggle
                    id={`${provider.name.toLowerCase()}-active`}
                    name={`${provider.name.toLowerCase()}-active`}
                    label={`Enable ${provider.name} Provider`}
                    layout="flex"
                  />
                  <div className="border-muted border-t"></div>
                  {provider.form.map((x) => {
                    return (
                      <Input
                        id={x.name}
                        key={x.name}
                        name={x.name}
                        label={x.label}
                        descriptionText={x.description}
                        layout="vertical"
                      />
                    )
                  })}
                  <div className="border-muted border-t"></div>
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      htmlType="reset"
                      onClick={() => {
                        handleReset()
                        setOpen(false)
                      }}
                      type="secondary"
                    >
                      Cancel
                    </Button>
                    <Button htmlType="submit" loading={isSubmitting}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </Collapsible.Content>
          )}
        </Form>
      </Collapsible>
      // </CollapsibleContainer>
    )
  }

  return (
    <div className="mx-auto my-8">
      <div className="-space-y-px">
        {AuthFormSchema.map((provider: Provider) => {
          return <ProviderForm provider={provider} />
        })}
      </div>
    </div>
  )
}

// type to do later..
let domainInitialState: any = ['https://summersmuir.com', 'http://localhost:3000']

// AuthFormSchema.map((provider) => {
//   domainInitialState[`${provider.name.toLowerCase()}-active`] =
//     provider.name == 'Email' ? true : false
//   domainInitialState[`${provider.name.toLowerCase()}-app-id`] = ''
//   domainInitialState[`${provider.name.toLowerCase()}-id-key`] = ''
// })

console.log('form domainInitialState', domainInitialState)

// function domainsReducer(state, action) {
//   switch (action.type) {
//     case 'update':
//       let _state = []
//       _state.push(...state)
//       _state.push(action.values.domain)
//       console.log('new state', _state)
//       return _state
//     // case 'remove':
//     //   _state.push(...state)
//     //   _state = _state.filter((e: any) => e !== action.values)
//     //   console.log('new state', _state)
//     //   return _state
//     // case 'decrement':
//     //   return { count: state.count - 1 }
//     default:
//       throw new Error()
//   }
// }

function domainsReducer(state: any, action: any) {
  let _state = []
  switch (action.type) {
    case 'update':
      _state.push(...state)
      _state.push(action.values.domain)
      console.log('new state', _state)
      return _state
    case 'remove':
      _state.push(...state)
      _state = _state.filter((e: any) => e !== action.values)
      console.log('new state', _state)
      return _state
    // case 'decrement':
    //   return { count: state.count - 1 }
    default:
      throw new Error()
  }
}

const DomainsForm = () => {
  const [domainsFormState, dispatchDomainsForm] = useReducer(domainsReducer, domainInitialState)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedDomain, setSelected] = useState('')

  console.log('domainsFormState from useState', domainsFormState)

  type formObj = {
    type: string
    name: string
    label: string
    description: string
  }

  interface Provider {
    name: string
    icon: string
    form: formObj[]
  }

  const DomainsForm = () => {
    // const [active, setActive] = useState(
    //   domainsFormState[`${provider.name.toLowerCase()}-active`]
    // )
    const [open, setOpen] = useState(false)

    // console.log('panel active state', active)

    return (
      <>
        <div className="my-6 flex items-center justify-between">
          <div>
            <h3 className="text-foreground mb-2 text-2xl">Authorised domains</h3>
            <p className="text-foreground-muted text-sm">
              Turn payment methods on and off in one click – no engineering time required.
            </p>
            <p className="text-foreground-muted text-sm">
              Use our guide to check which payment methods are compatible with your integration.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>Add domain</Button>
          <Modal
            size="small"
            visible={open}
            onCancel={() => setOpen(!open)}
            header={
              <div className="text-foreground flex items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm">Add a new domain</h3>
                </div>
              </div>
            }
            contentStyle={{ padding: 0 }}
            hideFooter
          >
            <Form
              id="new-domain-form"
              initialValues={{
                domain: '',
              }}
              validateOnBlur
              onSubmit={(values: any, { setSubmitting }: any) => {
                console.log('submitting domain')
                setTimeout(() => {
                  setSubmitting(false)
                  dispatchDomainsForm({ type: 'update', values: values })
                  setOpen(false)
                }, 400)
              }}
              validate={(values) => {
                const errors: any = {}
                if (!values.domain) {
                  errors.domain = 'A domain is required'
                } else if (
                  !/^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/i.test(
                    values.domain
                  )
                ) {
                  errors.domain = 'Not a valid URL. Please use http:// or https://'
                }
                return errors
              }}
            >
              {({ isSubmitting, errors, touched }: any) => {
                // console.log('errors in form', errors)
                // console.log('touched in form', touched)
                return (
                  <div className="mb-4 space-y-4 pt-4">
                    <div className="px-5">
                      <p className="text-foreground-light text-sm">
                        This will add a domain to a list of allowed domains that can interact with
                        your Authentication services for this project.
                      </p>
                    </div>
                    <div className="border-overlay-border border-t"></div>
                    <div className="px-5">
                      <Input
                        id="domain"
                        name="domain"
                        label="Domain"
                        placeholder="https://mydomain.com"
                      />
                    </div>
                    <div className="border-overlay-border border-t"></div>
                    <div className="px-5">
                      <Button
                        form="new-domain-form"
                        htmlType="submit"
                        block
                        size="medium"
                        loading={isSubmitting}
                      >
                        Add domain
                      </Button>
                    </div>
                  </div>
                )
              }}
            </Form>
          </Modal>
        </div>
      </>
    )
  }

  console.log('RENDER DOMAINS')

  return (
    <div className="mx-auto my-8">
      <DomainsForm />
      <div className="-space-y-px">
        {domainsFormState.map((domain) => {
          return (
            <>
              <div
                className="bg-surface-100 border-default text-foreground flex items-center 
              justify-between gap-2
              border px-6 
              py-4 text-sm
            first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl
            "
              >
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-foreground-muted">
                    <IconGlobe strokeWidth={2} size={14} />
                  </span>
                  {domain}
                </div>
                <Button
                  type="default"
                  icon={<IconTrash />}
                  onClick={() => {
                    setSelected(domain)
                    setDeleteOpen(true)
                  }}
                >
                  Remove
                </Button>
              </div>
            </>
          )
        })}
      </div>
      <Modal
        size="small"
        visible={deleteOpen}
        onCancel={() => setDeleteOpen(!open)}
        header={
          <div className="text-foreground flex items-center gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm">Remove domain</h3>
            </div>
          </div>
        }
        contentStyle={{ padding: 0 }}
        hideFooter
      >
        <div className="mb-4 space-y-4 pt-4">
          <div className="px-5">
            <p className="text-foreground-light mb-2 text-sm">
              Are you sure you want to remove{' '}
              <span className="text-foreground">{selectedDomain}</span>?
            </p>
            <p className="text-foreground-muted text-sm">
              This domain will no longer work with your Authentication configuration.
            </p>
          </div>
          <div className="border-overlay-border border-t"></div>
          <div className="flex gap-3 px-5">
            <Button
              type="secondary"
              block
              size="medium"
              onClick={() => {
                // setOpen(!open)
              }}
            >
              Cancel
            </Button>
            <Button
              block
              size="medium"
              type="warning"
              loading={deleteLoading}
              onClick={() => {
                setDeleteLoading(true)
                setTimeout(() => {
                  dispatchDomainsForm({
                    type: 'remove',
                    values: selectedDomain,
                  })
                  setDeleteOpen(!deleteOpen)
                  setDeleteLoading(false)
                }, 800)
              }}
            >
              {deleteLoading ? 'Removing...' : 'Remove domain'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
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
      bg-surface-100
      
      border-muted my-8 overflow-hidden rounded-md border shadow"
    >
      {header && <div className="bg-background border-muted border-b px-8 py-4">{header}</div>}
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
        validate={(values) => {
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
                <div className="border-muted border-t"></div>
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
                <label className="text-sm text-foreground col-span-4">
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
            <div className="border-muted border-t"></div>
            <Section
              header={
                <div className="w-full">
                  <label className="text-foreground-light text-sm">SMTP details</label>
                  <p className="text-foreground-muted text-sm">
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
      bg-surface-100 
      border-muted mb-8 overflow-hidden rounded-md border shadow"
    >
      {header && <div className="bg-background border-muted border-b px-8 py-4">{header}</div>}
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
        validate={(values) => {
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
                  <div className="border-muted border-t"></div>
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
                <label className="text-sm text-foreground col-span-4">
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
              {/* <div className="border-t border-muted"></div> */}
              <Section
                header={
                  <div className="w-full">
                    <h3 className="text-foreground mb-4 text-base">Confirm Signup</h3>
                    <p className="text-foreground-muted text-sm">
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

export function WholeForm() {
  return (
    <div style={{ width: '820px' }} className="mx-auto">
      <Tabs defaultActiveId="one" type="underlined" size="medium">
        <Tabs.Panel id="one" label="Sign-in method">
          <div className="animate-fade-in space-y-12 py-12">
            <div>
              <h1 className="text-foreground text-3xl">Sign-in method</h1>
            </div>
            <div className="border-muted border-t"></div>
            <div>
              <h3 className="text-foreground mb-2 text-2xl">General settings</h3>
              <p className="text-foreground-muted text-sm">
                Turn payment methods on and off in one click – no engineering time required.
              </p>
              <p className="text-foreground-muted text-sm">
                Use our guide to check which payment methods are compatible with your integration.
              </p>
              <CardForm />
            </div>
            <div>
              <h3 className="text-foreground mb-2 text-2xl">Providers</h3>
              <p className="text-foreground-muted text-sm">
                Turn payment methods on and off in one click – no engineering time required.
              </p>
              <p className="text-foreground-muted text-sm">
                Use our guide to check which payment methods are compatible with your integration.
              </p>
              <AuthForm />
            </div>

            <DomainsForm />
          </div>
        </Tabs.Panel>
        <Tabs.Panel id="two" label="Emails">
          <div className="animate-fade-in space-y-12 py-12">
            <div>
              <h1 className="text-foreground text-3xl">Emails</h1>
            </div>
            <button
              className="
                bg-surface-300
                border-default  
                hover:border-strong
                group
                my-6 flex
                w-full items-center 
                gap-6 
                rounded-md border px-6
                py-4 text-left
                shadow-sm
                transition
              "
            >
              <div className="bg-brand h-10 w-10 rounded p-1 transition duration-500 group-hover:-rotate-3 group-hover:scale-110">
                {/* <img
            className="text-white w-12 h-12"
            src="/icons/docs-illustration.svg"
          /> */}
              </div>
              <div className="grow">
                <h3 className="text-foreground">Use authentication as the backbone of your app</h3>
                <p className="text-foreground-muted text-xs">
                  Learn how to use Supabase Auth with Auth Policies to pick and choose what users
                  see what.
                </p>
                <p className="text-brand mt-2 flex items-center gap-1 text-xs">
                  See Documenation
                  <span className="transition group-hover:translate-x-1">
                    <IconArrowRight strokeWidth={2} width={12} />
                  </span>
                </p>
              </div>
              <div className="text-foreground-muted">
                <IconX />
              </div>
            </button>
            <div className="border-muted border-t"></div>
            <div>
              <h3 className="text-foreground mb-2 text-2xl">Custom SMTP</h3>
              <p className="text-foreground-muted text-sm">
                You can use your own SMTP server instead of the built-in email service.
              </p>
              <SmtpForm />
            </div>
            <div>
              <h3 className="text-foreground mb-2 text-2xl">Templates</h3>
              <p className="text-foreground-muted text-sm">
                You can use your own SMTP server instead of the built-in email service.
              </p>
              <TemplatesForm />
            </div>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

export default WholeForm
