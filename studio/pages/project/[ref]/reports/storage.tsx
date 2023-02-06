import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { hooksFactory, usePresetReport } from 'components/interfaces/Reports/Reports.utils'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  renderCacheHitRate,
  renderLargestObjectsPerBucket,
  renderMostFiles,
  renderStaleFiles,
  renderTopDownloaded,
  renderTopSizes,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import Divider from 'components/ui/Divider'

export const StorageReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query
  const config = PRESET_CONFIG[Presets.STORAGE]
  const hooks = hooksFactory(ref as string, config)
  const largestObjectsPerBucket = hooks.largestObjectsPerBucket()
  const topDownloaded = hooks.topDownloaded()
  const mostFiles = hooks.mostFiles()
  const staleFiles = hooks.staleFiles()
  const topSizes = hooks.topSizes()
  const cacheHitRate = hooks.cacheHitRate()

  const { isLoading, Layout } = usePresetReport([
    largestObjectsPerBucket,
    topDownloaded,
    mostFiles,
    staleFiles,
    topSizes,
    cacheHitRate,
  ])
  return (
    <Layout title={config.title}>
      <div className="flex flex-col grid  lg:grid-cols-6 gap-4">
        <ReportWidget
          isLoading={isLoading}
          params={cacheHitRate[0].params}
          className="col-span-3 col-start-1"
          title="Cache Hit Rate"
          description="Edge Network Cache Hit Rate"
          data={cacheHitRate[0]?.logData || []}
          renderer={renderCacheHitRate}
        />

        <ReportWidget
          isLoading={isLoading}
          params={largestObjectsPerBucket[0].params}
          className="col-span-3 col-start-1"
          title="Largest Objects"
          description="Large objects in each bucket"
          data={largestObjectsPerBucket[0]?.data || []}
          renderer={renderLargestObjectsPerBucket}
        />
        <ReportWidget
          isLoading={isLoading}
          params={topDownloaded[0].params}
          className="col-span-3 col-start-1"
          title="Top Downloaded Objects"
          description="Top download objectss"
          data={topDownloaded[0]?.data || []}
          renderer={renderTopDownloaded}
        />

        <Divider light />

        <ReportWidget
          isLoading={isLoading}
          params={mostFiles[0].params}
          className="col-span-3 col-start-1"
          title="Users with Most Files"
          description="Users with the most associated storage files"
          data={mostFiles[0]?.data || []}
          renderer={renderMostFiles}
        />

        <ReportWidget
          isLoading={isLoading}
          params={staleFiles[0].params}
          className="col-span-3 col-start-1"
          title="Stale Objects"
          description="Objects by months from last access"
          data={staleFiles[0]?.data || []}
          renderer={renderStaleFiles}
        />

        <ReportWidget
          isLoading={isLoading}
          params={topSizes[0].params}
          className="col-span-3 col-start-1"
          title="Top Object Sizes"
          description="Most frequently used object sizes"
          data={topSizes[0]?.logData || []}
          renderer={renderTopSizes}
        />
      </div>
    </Layout>
  )
}

StorageReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(StorageReport)
