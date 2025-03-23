import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      const { data, error } = await createClient().auth.getSession()
      if (error) {
        console.error(error)
      }

      const githubIdentity = data.session?.user.identities?.find((i) => i.provider === 'github')
      if (githubIdentity) {
        setImage(githubIdentity.identity_data?.avatar_url)
      }
    }
    fetchUserImage()
  }, [])

  return image
}
