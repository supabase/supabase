import React from 'react'
import { observer } from 'mobx-react-lite'
import { useProfile, useStore, withAuth } from 'hooks'
import { AccountLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { toJS } from 'mobx'
import { Button, Typography } from '@supabase/ui';
import { useState } from 'react';
import router, {useRouter} from 'next/router';
import Link from 'next/link';


const User = () => {
    const router = useRouter()
    const { ui } = useStore()
    const user = ui.profile
    const [isSubmitting, setIsSubmitting] = useState( false )
    console.log('router', router.query)
    console.log('join-a user:', toJS(user))

  return (
    <div className="flex h-full min-h-screen w-full flex-col place-items-center items-center justify-center bg-secondary px-3">
        <div className="mt-16 space-y-4 p-12 max-w-md mx-auto border-2 rounded-md ">
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

                <h2 className="text-xl">Join organization</h2>
                <p className="text-md">We sent an invite code to <u>your@email.com</u> to join this organization.</p>
            </div>

            <div className='flex items-center gap-2 mt-8'>
                <Button htmlType="submit" loading={isSubmitting} size="small">
                    Join this organization
                </Button>

                <Button htmlType="submit" loading={isSubmitting} size="small" type="text">
                    Decline
                </Button>
            </div>
        </div>
    </div>
  )
}


export default withAuth(observer(User))






