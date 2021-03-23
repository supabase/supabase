import ProfileCard from '../components/ProfileCard'
import { Profile } from '../lib/constants'
import { supabase } from '../lib/supabaseClient'
import { useState, useEffect } from 'react'

export default function ProfileList() {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    getPublicProfiles()
  }, [])

  async function getPublicProfiles() {
    try {
      const { data, error } = await supabase
        .from<Profile>('profiles')
        .select('id, username, avatar_url, website, updated_at')
        .order('updated_at', { ascending: false })

      if (error || ! data) {
        throw error || new Error('No data')
      }
      
      setProfiles(data)
    } catch (error) {
      console.log('error', error.message)
    }
  }

  return (
    <>
      {profiles?.map((profile) => (
        <ProfileCard profile={profile} key={profile.id} />
      ))}
    </>
  )
}
