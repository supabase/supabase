import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'

export default function ApiKeysLegacyPage() {
  const router = useRouter()
  const { ref } = useParams()

  // For backward compatibility, check if there's a view query parameter
  const view = router.query.view as string

  // Get the view from local storage if no query parameter
  const [storedView] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.API_KEYS_VIEW(ref ?? ''), 'new-keys')

  // Determine which page to redirect to
  const targetView = view || storedView || 'new-keys'

  useEffect(() => {
    // Redirect to the appropriate page
    router.replace(`/project/${ref}/settings/api-keys/${targetView}`)
  }, [])

  return null
}
