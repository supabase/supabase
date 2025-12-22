import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import Link from 'next/link'

// Used to display ongoing incidents

export const IncidentBanner = () => {
  return (
    <HeaderBanner
      variant="note"
      title="We are investigating a technical issue"
      description={
        <>
          Follow the{' '}
          <Link href="https://status.supabase.com" target="_blank" rel="noopener noreferrer">
            status page
          </Link>{' '}
          for updates
        </>
      }
    />
  )
}
