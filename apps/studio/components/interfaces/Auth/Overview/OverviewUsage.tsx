import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { Card } from 'ui'
import Link from 'next/link'
import { useParams } from 'common'
import { ChevronRight } from 'lucide-react'
import { Reports } from 'icons'

export const OverviewUsage = () => {
  const { ref } = useParams()

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex items-center justify-between mb-4">
        <ScaffoldSectionTitle>Usage</ScaffoldSectionTitle>
        <Link
          href={`/project/${ref}/reports/auth`}
          className="text-sm text-link inline-flex items-center gap-x-1.5"
        >
          <Reports size={14} />
          <span>View all reports</span>
          <ChevronRight size={14} />
        </Link>
      </div>
      <ScaffoldSectionContent className="gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="aspect-video" />
          <Card className="aspect-video" />
          <Card className="aspect-video" />
          <Card className="aspect-video" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="aspect-video" />
          <Card className="aspect-video" />
        </div>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
