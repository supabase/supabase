import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { Templates } from 'components/interfaces/Authentication'
import { NextPageWithLayout } from 'types'

const TemplatesPage: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div className="p-4">
      <Templates project={project} />
    </div>
  )
}

TemplatesPage.getLayout = (page) => <AuthLayout title="Auth">{page}</AuthLayout>

export default observer(TemplatesPage)
