import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { hooksFactory, usePresetReport } from 'components/interfaces/Reports/Reports.utils'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { renderBotScores, renderUserAgents } from 'components/interfaces/Reports/renderers/ApiBotsRenderers'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'

export const ApiBotsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query
  const config = PRESET_CONFIG[Presets.API_BOTS]
  const hooks = hooksFactory(ref as string, config)
  const userAgents = hooks.userAgents()
  const botScores = hooks.botScores()
  const { isLoading, Layout } = usePresetReport(
    [userAgents, botScores],
  )
  return (
    <Layout title={config.title}>
      <div className="grid  lg:grid-cols-4">
        <ReportWidget
          isLoading={isLoading}
          params={userAgents[0].params}
          className="col-span-4 col-start-1"
          title="Top User Agents"
          description="The types of user agents using the API and their organization source."
          data={userAgents[0].logData}
          renderer={renderUserAgents}
        />
        <ReportWidget
          isLoading={isLoading}
          params={botScores[0].params}
          className="col-span-4 col-start-1"
          title="Bot-like API Requests"
          description="Suspicious bot-like requests, as flagged by Cloudflare"
          data={botScores[0].logData}
          renderer={renderBotScores}
        />
      </div>
    </Layout>
  )
}

ApiBotsPage.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(ApiBotsPage)
