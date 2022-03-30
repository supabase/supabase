import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'

import FunctionLayout from 'components/interfaces/Functions/FunctionLayout'

const PageLayout = () => {
  return <FunctionLayout>Triggers</FunctionLayout>
}

export default withAuth(observer(PageLayout))
