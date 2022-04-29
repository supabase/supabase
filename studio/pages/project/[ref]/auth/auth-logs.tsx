import { observer } from 'mobx-react-lite'
import { withAuth, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'

const Auth = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <AuthLayout title="Auth Logs">
      {project && <LogsPreviewer condensedLayout projectRef={project!.ref} queryType="auth" />}
    </AuthLayout>
  )
}

export default withAuth(observer(Auth))
