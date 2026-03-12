import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Account from './components/Account'
import { View } from 'react-native'

export default function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getClaims().then(({ data: { claims } }) => {
      if (claims) {
        setUserId(claims.sub)
        setEmail(claims.email)
      }
    })

    supabase.auth.onAuthStateChange(async (_event, _session) => {
      const { data: { claims } } = await supabase.auth.getClaims()
      if (claims) {
        setUserId(claims.sub)
        setEmail(claims.email)
      } else {
        setUserId(null)
        setEmail(undefined)
      }
    })
  }, [])

  return (
    <View>
      {userId ? <Account key={userId} userId={userId} email={email} /> : <Auth />}
    </View>
  )
}
