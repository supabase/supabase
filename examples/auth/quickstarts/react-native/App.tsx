import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import { View, Text } from 'react-native'
import { User } from '@supabase/supabase-js'

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  return (
    <View>
      <Auth />
      {user && <Text>{user.id}</Text>}
    </View>
  )
}
