import React from 'react'
import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'
import { Button, Typography } from '@supabase/ui';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { API_URL } from 'lib/constants'
import { get, post, delete_ } from 'lib/common/fetch'
import { useEffect } from 'react'

interface tokenInfo {
    organization_name: string | undefined,
    token_does_not_exist: boolean,
    email_match: boolean,
    authorized_user: boolean,
    expired_token: boolean,
    invite_id: number
}

const User = () => {
    const router = useRouter()
    const {slug, token} = router.query
    const { ui } = useStore()
    const [isSubmitting, setIsSubmitting] = useState( false )
    const [tokenValidationInfo, setTokenValidationInfo] = useState<tokenInfo>()
    const {
        token_does_not_exist,
        email_match,
        authorized_user,
        expired_token,
        organization_name,
        invite_id
    } = tokenValidationInfo || {}

    async function fetchTokenInfo() {
        const response = await get( `${API_URL}/organizations/${slug}/members/join?token=${token}`, {} )
        setTokenValidationInfo(response);
    }

    useEffect(() => {
        if(router.query.token) {
            fetchTokenInfo()
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
        const response = await delete_(`${API_URL}/organizations/${slug}/members/invite?invited_id=${invite_id}`, {})
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
        <div className="flex flex-col items-center justify-center w-full h-full min-h-screen px-3 place-items-center bg-secondary">
            <div className="max-w-md p-12 mx-auto mt-16 space-y-6 border-2 rounded-md ">
                <div className="space-y-4">
                    <Link href="/">
                        <a className="flex items-center gap-4">
                            <img
                                src="/img/supabase-logo.svg"
                                alt="Supabase"
                                className="h-[30px] block cursor-pointer rounded"
                            />
                            <Typography.Title level={3} className="mb-0">Supabase</Typography.Title>
                        </a>
                    </Link>

                    <h2 className="text-xl">Join {organization_name ? organization_name : 'a new organization'}</h2>
                    <p className="text-md">You have been invited to join {organization_name ? organization_name : 'a new organization'} organization at Supabase.</p>
                </div>

                { authorized_user && !expired_token && (
                    <div className='flex items-center gap-2'>
                        <Button onClick={handleJoinOrganization} htmlType="submit" loading={isSubmitting} size="small">
                            Join this organization
                        </Button>

                        <Button onClick={handleDeclineJoinOrganization} htmlType="submit" size="small" type="text">
                            Decline
                        </Button>
                    </div>
                )}

                {!tokenValidationInfo && (
                    <div className='pt-4 mt-4 border-t'>That invite token is invalid.</div>
                )}

                {tokenValidationInfo && !email_match && (
                    <div className='pt-4 mt-4 border-t'>Sign in to that account to accept this invitation.</div>
                )}

                {expired_token || token_does_not_exist && (
                    <p className='pt-4 mt-4 border-t'>
                        That invite token is expired. Request a new one from the organization owner.
                    </p>
                )}
            </div>
        </div>
    )
}

export default withAuth( observer( User ) )