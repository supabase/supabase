import { useParams } from 'common'

import CodeSnippet from '../CodeSnippet'
import { DocSection } from '../DocSection'
import Snippets from '../Snippets'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'
import { makeRandomString } from '@/lib/helpers'

const randomPassword = makeRandomString(20)

interface UserManagementProps {
  selectedLang: 'bash' | 'js'
  showApiKey: string
}

export const UserManagement = ({ selectedLang, showApiKey }: UserManagementProps) => {
  const { ref: projectRef } = useParams()
  const keyToShow = showApiKey ? showApiKey : 'SUPABASE_KEY'

  const { authenticationSignInProviders } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
  ])

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint ?? ''
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  return (
    <div className="flex flex-col flex-1">
      <DocSection
        title="User Management"
        content={
          <>
            <p>Supabase makes it easy to manage your users.</p>
            <p>
              Supabase assigns each user a unique ID. You can reference this ID anywhere in your
              database. For example, you might create a <code>profiles</code> table that references
              the user using a <code>user_id</code> field.
            </p>
            <p>
              Supabase already has built in the routes to sign up, sign in, and sign out for
              managing users in your apps and websites.
            </p>
          </>
        }
      />

      <DocSection
        title="Sign up"
        content={
          <>
            <p>Allow your users to sign up and create a new account.</p>
            <p>
              After they have signed up, all interactions using the Supabase JS client will be
              performed as "that user".
            </p>
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authSignup(endpoint, keyToShow, randomPassword)}
          />
        }
      />

      <DocSection
        title="Sign in with email/password"
        content={
          <>
            <p>If an account is created, users can sign in to your app.</p>
            <p>
              After they have signed in, all interactions using the Supabase JS client will be
              performed as "that user".
            </p>
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authLogin(endpoint, keyToShow, randomPassword)}
          />
        }
      />

      <DocSection
        title="Sign in with magic link"
        content={
          <>
            <p>Send a user a passwordless link which they can use to redeem an access_token.</p>
            <p>
              After they have clicked the link, all interactions using the Supabase JS client will
              be performed as "that user".
            </p>
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMagicLink(endpoint, keyToShow)}
          />
        }
      />

      <DocSection
        title="Sign Up with Phone/Password"
        content={
          <>
            <p>
              A phone number can be used instead of an email as a primary account confirmation
              mechanism.
            </p>
            <p>
              The user will receive a mobile OTP via sms with which they can verify that they
              control the phone number.
            </p>
            <p>
              You must enter your own twilio credentials on the auth settings page to enable sms
              confirmations.
            </p>
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authPhoneSignUp(endpoint, keyToShow)}
          />
        }
      />

      <DocSection
        title="Sign in via SMS OTP"
        content={
          <>
            <p>
              SMS OTPs work like magic links, except you have to provide an interface for the user
              to verify the 6 digit number they receive.
            </p>
            <p>
              You must enter your own twilio credentials on the auth settings page to enable
              SMS-based sign-in.
            </p>
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMobileOTPLogin(endpoint, keyToShow)}
          />
        }
      />

      <DocSection
        title="Verify an SMS OTP"
        content={
          <>
            <p>
              Once the user has received the OTP, have them enter it in a form and send it for
              verification
            </p>
            <p>
              You must enter your own twilio credentials on the auth settings page to enable
              SMS-based OTP verification.
            </p>
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMobileOTPVerify(endpoint, keyToShow)}
          />
        }
      />

      {authenticationSignInProviders && (
        <DocSection
          title="Sign in with third-party OAuth"
          content={
            <>
              <p>
                Users can sign in with third-party OAuth like Google, Facebook, GitHub, and more.
                You must first enable each of these in the Auth Providers settings{' '}
                <span className="text-green-500">
                  <InlineLink key={'AUTH'} href={`/project/${projectRef}/auth/providers`}>
                    here
                  </InlineLink>
                </span>{' '}
                .
              </p>
              <p>
                View all the available{' '}
                <InlineLink href={`${DOCS_URL}/guides/auth#providers`}>
                  Third Party OAuth providers
                </InlineLink>
              </p>
              <p>
                After they have signed in, all interactions using the Supabase JS client will be
                performed as "that user".
              </p>
              <p>
                Generate your Client ID and secret from:{` `}
                <InlineLink href="https://console.developers.google.com/apis/credentials">
                  Google
                </InlineLink>
                ,{` `}
                <InlineLink href="https://github.com/settings/applications/new">GitHub</InlineLink>,
                {` `}
                <InlineLink href="https://gitlab.com/oauth/applications">GitLab</InlineLink>,{` `}
                <InlineLink href="https://developers.facebook.com/apps/">Facebook</InlineLink>,{` `}
                <InlineLink href="https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/">
                  Bitbucket
                </InlineLink>
                .
              </p>
            </>
          }
          snippets={
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.authThirdPartyLogin(endpoint, keyToShow)}
            />
          }
        />
      )}

      <DocSection
        title="User"
        content={<p>Get the JSON object for the signed-in user.</p>}
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authUser(endpoint, keyToShow)}
          />
        }
      />

      <DocSection
        title="Forgotten Password Email"
        content={
          <p>
            Sends the user a sign-in link via email. Once signed in you should direct the user to a
            new password form. And use "Update User" below to save the new password.
          </p>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authRecover(endpoint, keyToShow)}
          />
        }
      />

      <DocSection
        title="Update User"
        content={
          <p>
            Update the user with a new email or password. Each key (email, password, and data) is
            optional
          </p>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authUpdate(endpoint, keyToShow)}
          />
        }
      />

      <DocSection
        title="Sign out"
        content={
          <p>
            After calling log out, all interactions using the Supabase JS client will be
            "anonymous".
          </p>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authLogout(endpoint, keyToShow)}
          />
        }
      />

      <DocSection
        title="Send a User an Invite over Email"
        content={
          <>
            <p>Send a user a passwordless link which they can use to sign up and sign in.</p>
            <p>
              After they have clicked the link, all interactions using the Supabase JS client will
              be performed as "that user".
            </p>
            <p>
              This endpoint requires you use the <code>service_role_key</code> when initializing the
              client, and should only be invoked from the server, never from the client.
            </p>
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authInvite(endpoint, keyToShow)}
          />
        }
      />
    </div>
  )
}
