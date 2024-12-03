import { Button } from 'ui'
import Panel from '../Panel'
import Link from 'next/link'

const PricingDiskSection = () => (
  <div>
    <div className="text-center mb-8 lg:mb-16">
      <h2 className="text-foreground text-3xl">Advanced disk configurations</h2>
      <p className="text-foreground-light mt-4 text-lg mb-4">
        Scale database storage up to 64 TB and 80,000 IOPS.
      </p>
    
    </div>
    <Panel outerClassName="gap-4 mx-auto max-w-6xl">
      <table className="text-foreground m-0 hidden w-full table-auto overflow-hidden rounded-b lg:table text-sm">
        <thead>
          <tr>
            <th></th>
            <th className="p-3 text-left font-medium">Size</th>
            <th className="p-3 text-left font-medium">IOPS</th>
            <th className="p-3 text-left font-medium">Throughput</th>
            <th className="p-3 text-left font-medium">Durability</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-surface-100 rounded-lg">
            <td className="p-3">
              <span className="text-base">General Purpose</span>
              <br />
              <span className="text-foreground-lighter">Balance between price and performance</span>
            </td>
            <td className="p-3">
              8 GB included
              <br />
              then $0.125 per GB
            </td>
            <td className="p-3">
              3,000 IOPS included
              <br />
              then $0.024 per IOPS
            </td>
            <td className="p-3">
              125 Mbps included
              <br />
              then $0.095 per Mbps
            </td>
            <td>99.9%</td>
          </tr>
          <tr className="bg-surface-100 rounded-lg">
            <td className="p-3">
              <span className="text-base">High Performance</span>
              <br />
              <span className="text-foreground-lighter">For mission critical applications</span>
            </td>
            <td className="p-3">$0.195 per GB</td>
            <td className="p-3">$0.119 per IOPS</td>
            <td className="p-3">Scales automatically with IOPS</td>
            <td>99.999%</td>
          </tr>
        </tbody>
      </table>
    </Panel>
    <div className='mt-8 flex justify-center'>
    <Button asChild size="tiny" type="default">
        <Link href="https://supabase.com/docs/guides/platform/compute-and-disk#disk">
          Learn about advanced disk config
        </Link>
      </Button>
    </div>
  </div>
)

export default PricingDiskSection
