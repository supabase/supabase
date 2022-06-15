import React from 'react'
import { observer } from 'mobx-react-lite'
import { useProfile, useStore, withAuth } from 'hooks'
import { AccountLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { toJS } from 'mobx'
import { Button, Typography } from '@supabase/ui';
import { useState } from 'react';
import router, { useRouter } from 'next/router';
import Link from 'next/link';
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import { useEffect } from 'react'

const User = () => {
    const router = useRouter()
    const {email, slug, token} = router.query;
    const { app, ui } = useStore()
    const user = ui.profile
    const [isSubmitting, setIsSubmitting] = useState( false )
    // console.log( 'router', router.query )
    // console.log( 'join-a user:', toJS( user ) )
    console.log( 'ui org slug:', toJS( ui.selectedOrganization?.slug ) )

    //console.log('org name: ', toJS(app.organizations.data['91']))
    //console.log('org name: ', toJS(app.organizations.list()))

    // const organizationsLinks = app.organizations
    // .list()
    // .map((x: any) => ({
    //   isActive: router.pathname.startsWith('/org/') && ui.selectedOrganization?.slug == x.slug,
    //   label: x.name,
    //   href: `/org/${x.slug}/settings`,
    // }))


    async function handleSubmitForm() {
        setIsSubmitting( true )
        // curl -X GET 'http://localhost:8080/platform/organizations/slug/members/join?token=XXX'
        const response = await get( `${API_URL}/organizations/${slug}/members/join?token=${token}`, {} )
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

    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-screen px-3 place-items-center bg-secondary">
            <div className="max-w-md p-12 mx-auto mt-16 space-y-4 border-2 rounded-md ">
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

                    <h2 className="text-xl">Join ORG NAME</h2>
                    <p className="text-md">We sent an invite code to <u>{email}</u> to join this organization.</p>
                </div>

                {/* Check that the user in the query param matches the current logged in users email */}
                {user && user?.primary_email == email && (
                <div className='flex items-center gap-2 mt-8'>
                    <Button onClick={handleSubmitForm} htmlType="submit" loading={isSubmitting} size="small">
                        Join this organization
                    </Button>

                    <Button htmlType="submit" loading={isSubmitting} size="small" type="text">
                        Decline
                    </Button>
                </div>
                )}

                {user?.primary_email !== email && (
                    <div className='pt-4 mt-4 border-t'>Sign to that account to accept this invitation.</div>
                )}
            </div>
        </div>
    )
}

export default withAuth( observer( User ) )