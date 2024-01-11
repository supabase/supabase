import { Button, IconExternalLink } from 'ui'
import { useRouter } from 'next/router'
import { useProfile } from 'lib/profile'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useLocalStorage } from 'hooks'

// [Joshen] For this notice specifically, just FYI
// 1 month after 26th Jan we'll need to add some contextual information about this deprecation
// in the database settings pooling config section, for projects created before September 27th 2023

export const NoticeBanner = () => {
  const router = useRouter()
  const { isLoading } = useProfile()

  const [isDismissed, setIsDismissed] = useLocalStorage(
    LOCAL_STORAGE_KEYS.PGBOUNCER_DEPRECATION_WARNING,
    false
  )

  if (isLoading || router.pathname.includes('sign-in') || isDismissed) return null

  return (
    <div
      className="flex items-center justify-center gap-x-4 bg-surface-100 py-3 transition text-foreground box-border border-b border-default"
      style={{ height: '44px' }}
    >
      <p className="text-sm">PgBouncer and IPv4 will be deprecated after 26th January 2024</p>
      <div className="flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<IconExternalLink />}>
          <a
            href="https://github.com/orgs/supabase/discussions/17817"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        </Button>
        <Button type="text" className="opacity-75" onClick={() => setIsDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
