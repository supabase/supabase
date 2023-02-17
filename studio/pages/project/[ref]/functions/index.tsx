import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import { EdgeFunctionsList, FunctionsEmptyState } from 'components/interfaces/Functions'

const PageLayout: NextPageWithLayout = () => {
  const { functions } = useStore()
  const hasFunctions = functions.list().length > 0

  return hasFunctions ? (
    <div className="py-6">
      <EdgeFunctionsList />
    </div>
  ) : (
    <FunctionsEmptyState />
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
