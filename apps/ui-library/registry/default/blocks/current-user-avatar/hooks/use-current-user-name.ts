import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const { data, error } = await createClient().auth.getSession()
      if (error) {
        console.error(error)
      }

      const githubIdentity = data.session?.user.identities?.find((i) => i.provider === 'github')
      if (githubIdentity) {
        const name = (githubIdentity.identity_data?.name ??
          githubIdentity.identity_data?.fullName) as string

        const username = githubIdentity.identity_data?.username as string

        setName(name ?? username)
      }
    }

    fetchProfileName()
  }, [])

  return name || '?'
}
