import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Profile } from '../lib/constants'
import { AuthSession } from '@supabase/supabase-js'

export default function Account({ session }: { session: AuthSession }) {
  const [loading, setLoading] = useState<boolean>(true)
  const [username, setUsername] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
  }, [session])

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.log('Error logging out:', error.message)
  }

  function setProfile(profile: Profile) {
    setUsername(profile.username)
    setWebsite(profile.website)
  }

  async function getProfile() {
    try {
      setLoading(true)
      const user = supabase.auth.user()

      let { data, error } = await supabase
        .from<Profile>('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', user.id)
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
    } catch (error) {
      console.log('error', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setLoading(true)
      const user = supabase.auth.user()

      const updates = {
        id: user.id,
        username,
        website,
        updated_at: new Date(),
      }

      let { error } = await supabase.from('profiles').upsert(updates, {
        returning: 'minimal', // Don't return the value after inserting
      })

      if (error) {
        throw error
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minWidth: 250,
        maxWidth: 600,
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={session.user.email} disabled />
      </div>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username || ''}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="website"
          value={website || ''}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <button className="button block primary" onClick={() => updateProfile()} disabled={loading}>
          {loading ? 'Loading ...' : 'Update'}
        </button>
      </div>

      <div>
        <button className="button block" onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
