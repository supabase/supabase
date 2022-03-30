import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'

import FunctionLayout from '../../../../../components/interfaces/functions/FunctionLayout'

const PageLayout = () => {
  return <FunctionLayout>Triggers</FunctionLayout>
}

export default withAuth(observer(PageLayout))
