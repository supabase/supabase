import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import dayjs from 'dayjs'
import { DATE_FORMAT } from 'lib/constants'
import BarChart from './BarChart'
import { generateUsageData } from './Usage.utils'

const Activity = () => {
  const { ref } = useParams()

  const currentDate = 1682669326710 / 1000
  const startDate = dayjs.unix(currentDate).subtract(24, 'hour').format(DATE_FORMAT)
  const endDate = dayjs.unix(currentDate).format(DATE_FORMAT)

  const { data: ioBudgetData, isLoading: isLoadingIoBudgetData } = useInfraMonitoringQuery({
    projectRef: ref,
    attribute: 'disk_io_budget',
    startDate,
    endDate,
    interval: '1h',
  })

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="sticky top-16">
            <p className="text-base">Activity</p>
            <p className="text-sm text-scale-1000">Some description here</p>
          </div>
        </div>
      </div>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">IO Budget</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-1">
                <p>IO budget per day</p>
                <p className="text-sm text-scale-1000">
                  Just FYI for now its a percentage for IO budget, which is different from what the
                  figma designs are (in minutes). We will need o11y or infra to help update this
                </p>
              </div>
              {isLoadingIoBudgetData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute="disk_io_budget"
                  data={generateUsageData('disk_io_budget', 30)}
                  reference={{
                    value: 65,
                    label: 'FREE QUOTA',
                    x: 60,
                    y: 49,
                    width: 200,
                    height: 24,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Activity
