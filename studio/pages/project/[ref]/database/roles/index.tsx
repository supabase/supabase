import { observer } from 'mobx-react-lite'
import { DatabaseLayout } from 'components/layouts'
import { RolesList } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'
import { FormsContainer } from 'components/ui/Forms'

const DatabaseRoles: NextPageWithLayout = () => {
  return (
    <FormsContainer>
      <RolesList />
    </FormsContainer>
  )
}

DatabaseRoles.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseRoles)
