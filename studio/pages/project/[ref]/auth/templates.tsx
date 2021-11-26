import { observer } from 'mobx-react-lite'
import { withAuth, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { Templates } from 'components/interfaces/Authentication'

const Auth = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <AuthLayout title="Auth">
      <div className="p-4">
        <Templates project={project} />
      </div>
    </AuthLayout>
  )
}

export default withAuth(observer(Auth))
