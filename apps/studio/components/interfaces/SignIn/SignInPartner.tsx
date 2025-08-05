import { useEffect } from 'react'
import { auth } from 'lib/gotrue'
import { useRouter } from 'next/router'

const SignInPartner = () => {
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const params = new URLSearchParams(window.location.hash.substring(1))

      const partner = params.get('partner')
      const token = params.get('id_token')

      const { data } = await auth.getSession()

      console.log('@@@@', partner, token, data)

      if (!data.session && partner && token) {
        try {
          await auth.signInWithIdToken({
            provider: partner,
            token,
          })
        } finally {
          router.replace({ pathname: '/sign-in-mfa' })
        }
      } else {
        router.replace({ pathname: '/sign-in' })
      }
    })()
  }, [])

  return <></>
}

export default SignInPartner
