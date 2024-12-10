import { Button } from 'ui'
import Panel from '../Panel'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const diskTypes = [
  {
    name: 'General Purpose',
    tagline: 'Balance between price and performance',
    maxSize: '16 TB',
    size: '8 GB included\nthen $0.125 per GB',
    iops: '3,000 IOPS included\nthen $0.024 per IOPS',
    throughput: '125 Mbps included\nthen $0.095 per Mbps',
    durability: '99.9%',
  },
  {
    name: 'High Performance',
    tagline: 'For mission critical applications',
    maxSize: '60 TB',
    size: '$0.195 per GB',
    iops: '$0.119 per IOPS',
    throughput: 'Scales automatically with IOPS',
    durability: '99.999%',
  },
]

const PricingDiskSection = () => (
  <div>
    <div className="text-center mb-8 lg:mb-16">
      <h2 className="text-foreground text-3xl">Advanced disk configurations</h2>
      <p className="text-foreground-light mt-4 text-lg mb-4">
        Scale database storage up to 60 TB and 80,000 IOPS.
      </p>
    </div>
    <Panel outerClassName="gap-4 mx-auto max-w-6xl">
      <div>
        <table className="text-foreground m-0 hidden w-full table-auto overflow-hidden rounded-b lg:table text-sm">
          <thead>
            <tr>
              <th></th>
              <th className="p-3 text-left font-medium">Max Size</th>
              <th className="p-3 text-left font-medium">Size</th>
              <th className="p-3 text-left font-medium">IOPS</th>
              <th className="p-3 text-left font-medium">Throughput</th>
              <th className="p-3 text-left font-medium">Durability</th>
            </tr>
          </thead>
          <tbody>
            {diskTypes.map((diskType) => (
              <tr key={diskType.name} className="bg-surface-100 rounded-lg">
                <td className="p-3">
                  <span className="text-base">{diskType.name}</span>
                  <br />
                  <span className="text-foreground-lighter">{diskType.tagline}</span>
                </td>
                <td className="p-3">{diskType.maxSize}</td>
                <td className="p-3 whitespace-pre-line">{diskType.size}</td>
                <td className="p-3 whitespace-pre-line">{diskType.iops}</td>
                <td className="p-3 whitespace-pre-line">{diskType.throughput}</td>
                <td>{diskType.durability}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="text-foreground m-0 -mt-12 lg:mt-0 w-full table-auto overflow-hidden rounded-b lg:hidden text-xs">
          {diskTypes.map((diskType, idx) => (
            <tbody key={`${diskType.name}-mobile`}>
              <tr>
                <th className="py-3 pl-4 text-left font-medium pt-16 lg:pt-3 w-[60%]">Disk Type</th>
                <td className="px-4 py-3 text-brand pt-16 lg:pt-3">{diskType.name}</td>
              </tr>
              <tr>
                <th className="py-3 pl-4 text-left font-medium ">Max Size</th>
                <td className="px-4 py-3 whitespace-pre-wrap">{diskType.maxSize}</td>
              </tr>
              <tr>
                <th className="py-3 pl-4 text-left font-medium ">Size</th>
                <td className="px-4 py-3 whitespace-pre-wrap">{diskType.size}</td>
              </tr>
              <tr>
                <th className="py-3 pl-4 text-left font-medium ">IOPS</th>
                <td className="px-4 py-3 whitespace-pre-wrap">{diskType.iops}</td>
              </tr>
              <tr>
                <th className="py-3 pl-4 text-left font-medium ">Throughput</th>
                <td className="px-4 py-3 whitespace-pre-wrap">{diskType.throughput}</td>
              </tr>
              <tr>
                <th className="py-3 pl-4 text-left font-medium ">Durability</th>
                <td className="px-4 py-3 whitespace-pre-wrap">{diskType.durability}</td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </Panel>
    <div className="mt-8 flex justify-center">
      <Button asChild size="tiny" type="default" iconRight={<ArrowUpRight className="w-4" />}>
        <Link href="https://supabase.com/docs/guides/platform/compute-and-disk#disk">
          Learn about advanced disk config
        </Link>
      </Button>
    </div>
  </div>
)

export default PricingDiskSection
