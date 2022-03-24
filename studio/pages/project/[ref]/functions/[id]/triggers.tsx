import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'

import FunctionLayout from './../interfaces/FunctionLayout'

const PageLayout = () => {
  return <FunctionLayout>Triggers</FunctionLayout>
}

export default withAuth(observer(PageLayout))
