import Link from 'next/link'

import { HeaderBanner } from 'components/interfaces/Organization/resource-banner'

const IncidentBanner = () => {
  return (
    <Link href="https://status.supabase.com" target="_blank" rel="noreferrer">
      <HeaderBanner
        type="incident"
        title="We are currently investigating a technical issue"
        message="follow status.supabase.com for updates"
      />
    </Link>
  )
}

export default IncidentBanner
