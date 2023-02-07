import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Button, IconLock, IconMail, Input, Form, Modal, Select, Toggle } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Snippets from '../Snippets'
import CodeSnippet from '../CodeSnippet'
import { useRouter } from 'next/router'
import { makeRandomString } from 'lib/helpers'
import { useStore, checkPermissions } from 'hooks'

const randomPassword = makeRandomString(20)

export default function UserManagement({ autoApiService, selectedLang, showApiKey }) {
  const { ui } = useStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [execMethod, setExecMethod] = useState(undefined)
  const [execValues, setExecValues] = useState({})
  const [execResult, setExecResult] = useState(null)
  const canInviteUsers = checkPermissions(PermissionAction.AUTH_EXECUTE, 'invite_user')

  const keyToShow = showApiKey ? showApiKey : 'SUPABASE_KEY'

  const handleExec = ({ m, f, s }) => {
    setExecValues({ endpoint: autoApiService.endpoint })
    setExecResult(null)
    setExecMethod({ method: m, fields: f, snippet: s })
    console.log('handleExec', execMethod)
    setOpen(true)
  }

  const signUpUser = async (values) => {
    if (!canInviteUsers) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create user: You need additional permissions to create users`,
      })
      return
    }

    if (!values.key) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create user: You need TO specify an API key`,
      })
      return
    }
    const supabase = createClient(autoApiService.endpoint, values.key)

    let result = null
    if (values.useAdmin) {
      result = await supabase.auth.admin.createUser({
        email: values.email,
        phone: values.phone,
        password: values.password,
        email_confirm: true,
        phone_confirm: true,
      })
    } else {
      result = await supabase.auth.signUp({
        email: values.email,
        phone: values.phone,
        password: values.password,
      })
    }

    setExecResult(result)
    return
  }

  const signInUser = async (values) => {
    if (!values.key) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create user: You need to specify an API key`,
      })
      return
    }
    const supabase = createClient(autoApiService.endpoint, values.key)

    const result = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    setExecResult(result)
    return
  }

  const validate = (values) => {
    const errors = {}
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

    if (values.email.length === 0) {
      errors.email = 'Please enter a valid email'
    } else if (!emailValidateRegex.test(values.email)) {
      errors.email = `${values.email} is an invalid email`
    }

    return errors
  }

  return (
    <>
      <Modal
        size="xxlarge"
        visible={open}
        onCancel={() => setOpen(!open)}
        header={
          <div className="text-scale-1200 flex items-center gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm">Try it out:</h3>
            </div>
          </div>
        }
        contentStyle={{ padding: 0 }}
        hideFooter
      >
        <div className="flex w-full">
          <Form
            validateOnBlur
            initialValues={{ email: '' }}
            validate={validate}
            onSubmit={execMethod?.method}
            className="w-1/2"
          >
            {({ isSubmitting }) => (
              <div className="space-y-6 py-4">
                {execMethod?.fields?.email && (
                  <Modal.Content>
                    <Input
                      autoFocus
                      id="email"
                      className="w-full"
                      label="User email"
                      icon={<IconMail />}
                      type="email"
                      name="email"
                      placeholder="User email"
                      onChange={(e) => setExecValues({ ...execValues, email: e.target.value })}
                    />
                  </Modal.Content>
                )}
                {execMethod?.fields?.password && (
                  <Modal.Content>
                    <Input
                      autoFocus
                      id="password"
                      className="w-full"
                      label="User password"
                      icon={<IconLock />}
                      type="password"
                      name="password"
                      placeholder="User password"
                      onChange={(e) => setExecValues({ ...execValues, password: e.target.value })}
                    />
                  </Modal.Content>
                )}
                {execMethod?.fields?.key && (
                  <Modal.Content>
                    <Select
                      id="key"
                      label="Select supabase API key"
                      onChange={(e) => setExecValues({ ...execValues, key: e.target.value })}
                    >
                      <Select.Option value="">{'--'}</Select.Option>
                      <Select.Option value={autoApiService.defaultApiKey}>ANON_KEY</Select.Option>
                      <Select.Option value={autoApiService.serviceApiKey}>
                        SERVICE_KEY
                      </Select.Option>
                    </Select>
                  </Modal.Content>
                )}
                {execMethod?.fields?.useAdminApi && (
                  <Modal.Content>
                    <Toggle
                      id="useAdmin"
                      className="col-span-8"
                      label="Use admin API method"
                      layout="flex"
                      descriptionText="If this is enabled, according method from admin API will be used."
                      onChange={(e) => setExecValues({ ...execValues, useAdmin: e })}
                    />
                  </Modal.Content>
                )}
                <Modal.Content>
                  <Button
                    block
                    size="small"
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={!canInviteUsers || isSubmitting}
                  >
                    Execute
                  </Button>
                </Modal.Content>
              </div>
            )}
          </Form>
          <article className="code w-1/2 p-4">
            <CodeSnippet selectedLang="js" snippet={execMethod?.snippet(execValues)} />
            <div className="h-1 w-full border-b-2 my-2" />
            {execResult && (
              <CodeSnippet selectedLang="js" snippet={Snippets.execResult(execResult)} />
            )}
          </article>
        </div>
      </Modal>
      <h2 className="doc-heading">User Management</h2>
      <div className="doc-section">
        <article className="text ">
          <p>Supabase makes it easy to manage your users.</p>
          <p>
            Supabase assigns each user a unique ID. You can reference this ID anywhere in your
            database. For example, you might create a <code>profiles</code> table references the
            user using a <code>user_id</code> field.
          </p>
          <p>
            Supabase already has built in the routes to sign up, login, and log out for managing
            users in your apps and websites.
          </p>
        </article>
      </div>
      <div className="flex justify-between">
        <h2 className="doc-heading">Sign up</h2>
        <Button
          size="tiny"
          type="default"
          className="m-4"
          onClick={() =>
            handleExec({
              m: signUpUser,
              f: { email: true, password: true, key: true, useAdminApi: true },
              s: Snippets.authSignupFull,
            })
          }
          // style={{ padding: '2px 5px' }}
        >
          Execute
        </Button>
      </div>
      <div className="doc-section ">
        <article className="text ">
          <p>Allow your users to sign up and create a new account.</p>
          <p>
            After they have signed up, all interactions using the Supabase JS client will be
            performed as "that user".
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authSignup(autoApiService.endpoint, keyToShow, randomPassword)}
          />
        </article>
      </div>

      <div className="flex justify-between">
        <h2 className="doc-heading">Log in with Email/Password</h2>
        <Button
          size="tiny"
          type="default"
          className="m-4"
          onClick={() =>
            handleExec({
              m: signInUser,
              f: { email: true, password: true, key: true, useAdminApi: false },
              s: Snippets.authLoginFull,
            })
          }
          // style={{ padding: '2px 5px' }}
        >
          Execute
        </Button>
      </div>
      <div className="doc-section ">
        <article className="text ">
          <p>If an account is created, users can login to your app.</p>
          <p>
            After they have logged in, all interactions using the Supabase JS client will be
            performed as "that user".
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authLogin(autoApiService.endpoint, keyToShow, randomPassword)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Log in with Magic Link via Email</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>Send a user a passwordless link which they can use to redeem an access_token.</p>
          <p>
            After they have clicked the link, all interactions using the Supabase JS client will be
            performed as "that user".
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMagicLink(autoApiService.endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Sign Up with Phone/Password</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            A phone number can be used instead of an email as a primary account confirmation
            mechanism.
          </p>
          <p>
            The user will receive a mobile OTP via sms with which they can verify that they control
            the phone number.
          </p>
          <p>
            You must enter your own twilio credentials on the auth settings page to enable sms
            confirmations.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authPhoneSignUp(autoApiService.endpoint, keyToShow, randomPassword)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Login via SMS OTP</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            SMS OTPs work like magic links, except you have to provide an interface for the user to
            verify the 6 digit number they receive.
          </p>
          <p>
            You must enter your own twilio credentials on the auth settings page to enable SMS-based
            Logins.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMobileOTPLogin(
              autoApiService.endpoint,
              keyToShow,
              randomPassword
            )}
          />
        </article>
      </div>

      <h2 className="doc-heading">Verify an SMS OTP</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            Once the user has received the OTP, have them enter it in a form and send it for
            verification
          </p>
          <p>
            You must enter your own twilio credentials on the auth settings page to enable SMS-based
            OTP verification.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMobileOTPVerify(
              autoApiService.endpoint,
              keyToShow,
              randomPassword
            )}
          />
        </article>
      </div>

      <h2 className="doc-heading">Log in with Third Party OAuth</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            Users can log in with Third Party OAuth like Google, Facebook, GitHub, and more. You
            must first enable each of these in the Auth Providers settings{' '}
            <span className="text-green-500">
              <Link key={'AUTH'} href={`/project/${router.query.ref}/auth/providers`}>
                here
              </Link>
            </span>{' '}
            .
          </p>
          <p>
            View all the available{' '}
            <a href="https://supabase.com/docs/guides/auth#providers" target="_blank">
              Third Party OAuth providers
            </a>
          </p>
          <p>
            After they have logged in, all interactions using the Supabase JS client will be
            performed as "that user".
          </p>
          <p>
            Generate your Client ID and secret from:{` `}
            <a href="https://console.developers.google.com/apis/credentials" target="_blank">
              Google
            </a>
            ,{` `}
            <a href="https://github.com/settings/applications/new" target="_blank">
              GitHub
            </a>
            ,{` `}
            <a href="https://gitlab.com/oauth/applications" target="_blank">
              GitLab
            </a>
            ,{` `}
            <a href="https://developers.facebook.com/apps/" target="_blank">
              Facebook
            </a>
            ,{` `}
            <a
              href="https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/"
              target="_blank"
            >
              Bitbucket
            </a>
            .
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authThirdPartyLogin(autoApiService.endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">User</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>Get the JSON object for the logged in user.</p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authUser(autoApiService.endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Forgotten Password Email</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            Sends the user a log in link via email. Once logged in you should direct the user to a
            new password form. And use "Update User" below to save the new password.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authRecover(autoApiService.endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Update User</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            Update the user with a new email or password. Each key (email, password, and data) is
            optional
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authUpdate(autoApiService.endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Log out</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            After calling log out, all interactions using the Supabase JS client will be
            "anonymous".
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authLogout(autoApiService.endpoint, keyToShow, randomPassword)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Send a User an Invite over Email</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>Send a user a passwordless link which they can use to sign up and log in.</p>
          <p>
            After they have clicked the link, all interactions using the Supabase JS client will be
            performed as "that user".
          </p>
          <p>
            This endpoint requires you use the <code>service_role_key</code> when initializing the
            client, and should only be invoked from the server, never from the client.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authInvite(autoApiService.endpoint, keyToShow)}
          />
        </article>
      </div>
    </>
  )
}
