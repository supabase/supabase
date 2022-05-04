import { observer } from 'mobx-react-lite'

import { DatabaseLayout } from 'components/layouts'
import { Extensions } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'

const DatabaseExtensions: NextPageWithLayout = () => {
  return (
    <div className="p-4">
      <Extensions />
    </div>
  )
}

DatabaseExtensions.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseExtensions)
