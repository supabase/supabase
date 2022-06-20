import React from 'react'
import { useStore, withAuth } from 'hooks'
import { Button, IconAlertCircle, Typography } from '@supabase/ui'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { API_URL } from 'lib/constants'
import { get, post, delete_ } from 'lib/common/fetch'
import { useEffect } from 'react'

interface TokenInfo {
  organization_name: string | undefined
  token_does_not_exist: boolean
  email_match: boolean
  authorized_user: boolean
  expired_token: boolean
  invite_id: number
}

const User = () => {
  const router = useRouter()
  const { slug, token } = router.query
  const { ui } = useStore()
  const [isSubmitting, setIsSubmitting] = useState( false )
  const [tokenValidationInfo, setTokenValidationInfo] = useState<TokenInfo>()
  const [tokenInfoLoaded, setTokenInfoLoaded] = useState( false )
  const {
    token_does_not_exist,
    email_match,
    authorized_user,
    expired_token,
    organization_name,
    invite_id,
  } = tokenValidationInfo || {}

  useEffect( () => {
    let cancel = false

    async function fetchTokenInfo() {
      const response = await get( `${API_URL}/organizations/${slug}/members/join?token=${token}`, {} )
      if ( !cancel ) {
        setTokenValidationInfo( response )
        setTokenInfoLoaded( true )
      }
    }

    if ( router.query.token ) {
      fetchTokenInfo()
    }

    return () => {
      cancel = true
    }
  }, [] )

  async function handleJoinOrganization() {
    setIsSubmitting( true )
    const response = await post( `${API_URL}/organizations/${slug}/members/join?token=${token}`, {} )
    if ( response.error ) {
      ui.setNotification( {
        category: 'error',
        message: `Failed to join organization: ${response.error.message}`,
      } )
      setIsSubmitting( false )
    } else {
      setIsSubmitting( false )
      router.push( '/' )
    }
  }

  async function handleDeclineJoinOrganization() {
    setIsSubmitting( true )
    const response = await delete_(
      `${API_URL}/organizations/${slug}/members/invite?invited_id=${invite_id}`,
      {}
    )
    if ( response.error ) {
      ui.setNotification( {
        category: 'error',
        message: `Failed to decline invitation: ${response.error.message}`,
      } )
      setIsSubmitting( false )
    } else {
      setIsSubmitting( false )
      router.push( '/' )
    }
  }

  return (
    <div className="bg-secondary flex h-full min-h-screen w-full flex-col place-items-center items-center justify-center px-3">
      <div className="mx-auto mt-16 max-w-md space-y-6 rounded-md border-2 p-12 ">
        <div className="space-y-4">
          <Link href="/">
            <a className="flex items-center gap-4">
              <img
                src="/img/supabase-logo.svg"
                alt="Supabase"
                className="block h-[30px] cursor-pointer rounded"
              />
              <Typography.Title level={3} className="mb-0">
                Supabase
              </Typography.Title>
            </a>
          </Link>

          <h2 className="text-xl">
            Join {organization_name && email_match ? organization_name : 'a new organization'}
          </h2>

          {!token_does_not_exist ? (
            <p className="text-md">
              You have been invited to join{' '}
              {organization_name && email_match
                ? `${organization_name}'s organization`
                : 'a new organization'}{' '}
              at Supabase.
            </p>
          ) : (
            <div className="w-96" />
          )}
        </div>

        {authorized_user && !expired_token && email_match && tokenInfoLoaded && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleJoinOrganization}
              htmlType="submit"
              loading={isSubmitting}
              size="small"
            >
              Join this organization
            </Button>

            <Button
              onClick={handleDeclineJoinOrganization}
              htmlType="submit"
              size="small"
              type="text"
            >
              Decline
            </Button>
          </div>
        )}

        {tokenInfoLoaded && (
          <div className="mt-4 flex gap-4 border-t pt-4 text-sm">
            {token_does_not_exist || !email_match || expired_token && <IconAlertCircle size={24} strokeWidth={2} />}

            {token_does_not_exist
              ? 'The invite token is invalid. Try copying and pasting the link from the invite email, or ask the organization owner to invite you again.'
              : !email_match
                ? 'The email address does not match. Are you signed in with right GitHub account?'
                : expired_token
                  ? 'The invite token has expired. Please request a new one from the organization owner.'
                  : ''}
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(User)
