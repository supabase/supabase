import Link from 'next/link'
import Snippets from '../Snippets'
import CodeSnippet from '../CodeSnippet'
import { useRouter } from 'next/router'
import { makeRandomString } from 'lib/helpers'

const randomPassword = makeRandomString(20)

export default function UserManagement({ autoApiService, selectedLang, showApiKey }) {
  const router = useRouter()

  const keyToShow = showApiKey ? showApiKey : 'SUPABASE_KEY'

  return (
    <>
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

      <h2 className="doc-heading">Sign up</h2>
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

      <h2 className="doc-heading">Log in with Email/Password</h2>
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
            must first enable each of these in the{' '}
            <span className="text-green-500">
              <Link key={'AUTH'} href={`/project/${router.query.ref}/auth/settings`}>
                Auth Settings
              </Link>
            </span>{' '}
            tab.
          </p>
          <p>
            View all the available{' '}
            <a href="https://supabase.com/docs/guides/auth#providers" target="_blank">
              Third Part OAuth providers
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
