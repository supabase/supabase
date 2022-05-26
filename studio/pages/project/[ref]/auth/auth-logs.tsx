import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { NextPageWithLayout } from 'types'

const LogsPage: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <>{project && <LogsPreviewer condensedLayout projectRef={project!.ref} queryType="auth" />}</>
  )
}

LogsPage.getLayout = (page) => <AuthLayout title="Auth Logs">{page}</AuthLayout>

export default observer(LogsPage)
