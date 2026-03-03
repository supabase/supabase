import Link from 'next/link'
import { useParams } from 'common'
import { Gauge } from 'lucide-react'
import { Button } from 'ui'
import { BannerCard } from '../BannerCard'

export const BannerComputeWarning = () => {
  const { ref } = useParams()

  return (
    <BannerCard>
      <div className="flex flex-col gap-y-4">
        <div className="p-2 rounded-lg bg-destructive-300 text-destructive w-fit">
          <Gauge size={16} />
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Query Insights paused</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Your project is under high compute pressure. Query Insights needs CPU and memory
            headroom to collect query data.
          </p>
        </div>
        <Button type="primary" size="tiny" asChild>
          <Link href={`/project/${ref}/settings/compute-and-disk`}>Upgrade compute</Link>
        </Button>
      </div>
    </BannerCard>
  )
}
