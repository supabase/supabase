import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button, IconCheckSquare, Loading } from 'ui'

import { useOrganizationJoinDeclineMutation } from 'data/organizations/organization-join-decline-mutation'
import { useOrganizationJoinMutation } from 'data/organizations/organization-join-mutation'
import {
  TokenInfo,
  validateTokenInformation,
} from 'data/organizations/organization-join-token-validation-query'
import { useStore } from 'hooks'
import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'

const JoinOrganizationPage = () => {
  const router = useRouter()
  const { slug, token, name } = useParams()
  const { ui } = useStore()
  const { profile } = useProfile()
  const signOut = useSignOut()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<any>()
  const [tokenValidationInfo, setTokenValidationInfo] = useState<TokenInfo>(undefined)
  const [tokenInfoLoaded, setTokenInfoLoaded] = useState(false)
  const { token_does_not_exist, email_match, expired_token, organization_name, invite_id } =
    tokenValidationInfo || {}

  const loginRedirectLink = `/?returnTo=${encodeURIComponent(`/join?token=${token}&slug=${slug}`)}`

  const { mutate: joinOrganization } = useOrganizationJoinMutation({
    onSuccess: () => {
      setIsSubmitting(false)
      router.push('/')
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to join organization: ${error.message}`,
      })
      setIsSubmitting(false)
    },
  })

  const { mutate: declineOrganization } = useOrganizationJoinDeclineMutation({
    onSuccess: () => {
      setIsSubmitting(false)
      router.push('/')
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to decline invitation: ${error.message}`,
      })
      setIsSubmitting(false)
    },
  })

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!slug) return console.error('Slug is required')
      if (!token) return console.error('Token is required')

      try {
        const response = await validateTokenInformation({ slug, token })
        setTokenInfoLoaded(true)
        setTokenValidationInfo(response)
      } catch (error) {
        setError(error)
        setTokenInfoLoaded(true)
      }
    }

    if (!tokenInfoLoaded && token) {
      fetchTokenInfo()
    }

    /**
     * if params are empty then redirect
     * user to the homepage of app
     */
    // if (!slug && !token) router.push('/')
  }, [token, router.asPath])

  async function handleJoinOrganization() {
    if (!slug) return console.error('Slug is required')
    if (!token) return console.error('Token is required')
    setIsSubmitting(true)
    joinOrganization({ slug, token })
  }

  async function handleDeclineJoinOrganization() {
    if (!slug) return console.error('Slug is required')
    if (!invite_id) return console.error('Invite ID is required')
    setIsSubmitting(true)
    declineOrganization({ slug, invited_id: invite_id })
  }

  const isError =
    error ||
    !!(tokenInfoLoaded && token_does_not_exist) ||
    (tokenInfoLoaded && !email_match) ||
    (tokenInfoLoaded && expired_token)

  const ErrorMessage = () => {
    const Container = ({ children }: { children: React.ReactNode }) => (
      <div
        className={[
          'flex flex-col items-center justify-center gap-3 text-sm',
          isError ? 'text-foreground-light' : 'text-foreground',
        ].join(' ')}
      >
        {children}
      </div>
    )

    const message = error ? (
      <p>There was an error requesting details for this invitation. ({error.message})</p>
    ) : token_does_not_exist ? (
      <>
        <p>The invite token is invalid.</p>
        <p className="text-foreground-lighter">
          Try copying and pasting the link from the invite email, or ask the organization owner to
          invite you again.
        </p>
      </>
    ) : !email_match ? (
      <>
        <p>
          Your email address {profile?.primary_email} does not match the email address this
          invitation was sent to.
        </p>
        <p className="text-foreground-lighter">
          To accept this invitation, you will need to{' '}
          <a
            className="cursor-pointer text-brand"
            onClick={async () => {
              await signOut()
              router.reload()
            }}
          >
            sign out
          </a>{' '}
          and then sign in or create a new account using the same email address used in the
          invitation.
        </p>
      </>
    ) : expired_token ? (
      <>
        <p>The invite token has expired.</p>
        <p className="text-foreground-lighter">
          Please request a new one from the organization owner.
        </p>
      </>
    ) : (
      ''
    )

    return isError ? <Container>{message}</Container> : null
  }

  const Content = () => (
    <>
      <div className="flex flex-col gap-2 px-6 py-8">
        <>
          <p className="text-sm text-foreground">You have been invited to join </p>
          {organization_name ? (
            <>
              <p className="text-3xl text-foreground">
                {name ? name : organization_name ? `${organization_name}` : 'an organization'}
              </p>
              {!token_does_not_exist && (
                <p className="text-sm text-foreground-lighter">an organization on Supabase</p>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl text-foreground">{'an organization'}</p>
            </>
          )}
          {slug && (
            <p className="text-xs text-foreground-lighter">{`organization slug: ${slug}`}</p>
          )}
        </>
      </div>

      <div
        className={['border-t border-muted', isError ? 'bg-alternative' : 'bg-transparent'].join(
          ' '
        )}
      >
        <div className="flex flex-col gap-4 px-6 py-4 ">
          {profile && !isError && (
            <div className="flex flex-row items-center justify-center gap-3">
              <Button onClick={handleDeclineJoinOrganization} htmlType="submit" type="default">
                Decline
              </Button>
              <Button
                onClick={handleJoinOrganization}
                htmlType="submit"
                loading={isSubmitting}
                type="primary"
                icon={<IconCheckSquare />}
              >
                Join organization
              </Button>
            </div>
          )}

          {tokenInfoLoaded && <ErrorMessage />}

          {!profile && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-foreground-lighter">
                You will need to sign in to accept this invitation
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild type="default">
                  <Link href={loginRedirectLink}>Sign in</Link>
                </Button>
                <Button asChild type="default">
                  <Link href={loginRedirectLink}>Create an account</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div
      className={[
        'flex h-full min-h-screen bg-background',
        'w-full flex-col place-items-center',
        'items-center justify-center gap-8 px-5',
      ].join(' ')}
    >
      <Link href="/projects" className="flex items-center justify-center gap-4">
        <img
          src={`${router.basePath}/img/supabase-logo.svg`}
          alt="Supabase"
          className="block h-[24px] cursor-pointer rounded"
        />
      </Link>
      <div
        className="
          mx-auto overflow-hidden rounded-md border
          border-muted bg-alternative text-center shadow
          md:w-[400px]
          "
      >
        <Loading active={!tokenInfoLoaded}>
          <Content />
        </Loading>
      </div>
    </div>
  )
}

export default JoinOrganizationPage
