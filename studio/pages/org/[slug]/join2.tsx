
import { AccountLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import AuthCode, { AuthCodeRef } from 'react-auth-code-input';
import { useState } from 'react';
import { useRef } from 'react';
import { Button } from '@supabase/ui';
import router, {useRouter} from 'next/router';
import { useOrganizationDetail, useStore } from 'hooks'
import { getAccessToken, get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Transition } from '@headlessui/react';
import { useEffect } from 'react';

const JoinOrg: NextPageWithLayout = () => {
    const router = useRouter();
    const slug = router.query.slug;
    console.log(router);
    return (
        <div className="mt-8 space-y-4 p-4 pt-0">
            <div className="space-y-4">
                <h2 className="text-xl">Join organization</h2>
                <p className="text-md">We sent an invite code to <u>your@email.com</u> to join this organization.</p>
            </div>

            <div className='mt-12'>
                <p className="text-md my-6">Enter or paste the code to join:</p>
                <div className='mb-6'>
                    <InviteCodeInput />
                </div>
            </div>
        </div>
    )
}

const InviteCodeInput = () => {
    const router = useRouter();
    const slug = router.query.slug;
    const { ui } = useStore()
    const [result, setResult] = useState('');
    const [isValidInviteCode, setIsValidInviteCode] = useState( false );
    const [isInputDirty, setIsInputDirty] = useState( false );
    const [isSubmitting, setIsSubmitting] = useState( false )
    const AuthInputRef = useRef<AuthCodeRef>( null );
    const AuthInputFormRef = useRef<HTMLFormElement>( null );

    useEffect(() => {
        if(router.query.token) {
            console.log('yup')
            setResult(router.query.token)
        }
    })
    function handleOnChange( res: string ) {
        res.length < 15 ? setIsValidInviteCode(false) : setIsValidInviteCode(true)
        res.length > 0 ? setIsInputDirty(true) : setIsInputDirty(false)
        setResult( res );
    };

    async function handleSubmitForm( e: any ) {
        //const access_token = getAccessToken()
        e.preventDefault();
        setIsSubmitting( true )

        // Need proper endpoint
        const response = await get( `${API_URL}/organizations/${slug}/join?token=${result}`, {} )
        if ( response.error ) {
            ui.setNotification( {
                category: 'error',
                message: `Failed to join organization: ${response.error.message}`,
            } )
            setIsSubmitting( false )
        } else {
            setIsSubmitting( false )
            // router.push( '/' )
        }
    }



    return (
        <form onSubmit={handleSubmitForm} ref={AuthInputFormRef}>
            <div>
                {/* <AuthCode
                    ref={AuthInputRef}
                    allowedCharacters='alphanumeric'
                    onChange={handleOnChange}
                    length={15}
                    autoFocus={true}
                    containerClassName="join-auth-code-container flex items-center max-w-full"
                    inputClassName="w-[34px]"
                /> */}

                <div className='flex items-center gap-2 mt-8'>
                    <Button disabled={!isValidInviteCode} htmlType="submit" loading={isSubmitting} size="small">
                        Join this organization
                    </Button>

                    <Button htmlType="submit" loading={isSubmitting} size="small" type="text">
                        Decline
                    </Button>

                        <Transition
                            show={isInputDirty}
                            enter="transition ease-out duration-500"
                            enterFrom="transform opacity-0 -translate-x-10"
                            enterTo="transform opacity-100 translate-x-0"
                        >
                            <Button
                                htmlType="reset"
                                type='text'
                                size="small"
                                onClick={() => AuthInputRef.current?.clear()}
                                >
                                Clear
                            </Button>
                        </Transition>

                </div>
            </div>
        </form>
    );
}

JoinOrg.getLayout = ( page ) => (
    <AccountLayout
        title="Join Org"
        breadcrumbs={[
            {
                key: `join-org`,
                label: 'Join Org',
            },
        ]}
    >
        {page}
    </AccountLayout>
)

export default JoinOrg
