import Link from 'next/link'
import React from 'react'

import { useParams } from 'common'
import { useSelectedOrganization } from 'hooks'

export default function UsageWarningBanner() {
  const { ref } = useParams()
  const organization = useSelectedOrganization()

  return (
    <div className="w-full bg-orange-500">
      Project is experiencing high [product] usage. <Link href="#">Learn more</Link>
    </div>
  )
}
