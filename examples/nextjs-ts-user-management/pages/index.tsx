import Auth from '../components/Auth'
import Account from '../components/Account'
import ProfileList from '../components/ProfileList'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthSession } from '@supabase/supabase-js'
import { Profile } from '../lib/constants'
import Footer from '../components/Footer'

export default function Home() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    setSession(supabase.auth.session())

    supabase.auth.onAuthStateChange((_event: string, session: AuthSession | null) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    getPublicProfiles()
  }, [])

  async function getPublicProfiles() {
    try {
      const { data, error } = await supabase
        .from<Profile>('profiles')
        .select('id, username, avatar_url, website, updated_at')
        .order('updated_at', { ascending: false })

      if (error || !data) {
        throw error || new Error('No data')
      }
      console.log('Public profiles:', data)
      setProfiles(data)
    } catch (error) {
      console.log('error', error.message)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {!session ? (
        <Auth />
      ) : (
        <div className="flex" style={{ width: '75%', maxWidth: '850px', gap: 30 }}>
          <div className="flex column w-half">
            <h3>Account</h3>
            <Account key={session.user.id} session={session} />
          </div>
          <div className="flex column w-half" style={{ gap: 20 }}>
            <h3>Public Profiles</h3>
            <ProfileList profiles={profiles} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
