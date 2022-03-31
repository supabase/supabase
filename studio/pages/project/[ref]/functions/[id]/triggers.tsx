import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'

import FunctionsLayout from 'components/interfaces/Functions/FunctionsLayout'

const PageLayout = () => {
  return <FunctionsLayout>Triggers</FunctionsLayout>
}

export default withAuth(observer(PageLayout))
