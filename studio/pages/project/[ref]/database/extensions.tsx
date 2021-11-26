import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { Extensions } from 'components/interfaces/Database'

const DatabaseExtensions: NextPage = () => {
  return (
    <DatabaseLayout title="Database">
      <div className="p-4">
        <Extensions />
      </div>
    </DatabaseLayout>
  )
}

export default withAuth(observer(DatabaseExtensions))
