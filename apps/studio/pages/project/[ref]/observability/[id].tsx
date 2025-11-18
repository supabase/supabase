import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import Reports from 'components/interfaces/Reports/Reports'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => (
  <div className="mx-auto flex flex-col gap-4 w-full flex-grow">
    <ReportPadding>
      <Reports />
    </ReportPadding>
  </div>
)

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default PageLayout
