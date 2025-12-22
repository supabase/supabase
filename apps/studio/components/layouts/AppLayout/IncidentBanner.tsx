import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import Link from 'next/link'

export const IncidentBanner = () => {
  return (
    <HeaderBanner
      title="We are investigating a technical issue"
      type="note"
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
