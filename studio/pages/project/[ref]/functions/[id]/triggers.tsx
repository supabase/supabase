import FunctionsLayout from 'components/interfaces/Functions/FunctionsLayout'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  return <div>Triggers</div>
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
