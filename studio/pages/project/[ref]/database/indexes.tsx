import clsx from 'clsx'

import Indexes from 'components/interfaces/Database/Indexes/Indexes'
import { DatabaseLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const IndexesPage: NextPageWithLayout = () => {
  return (
    <div
      className={clsx(
        'mx-auto flex flex-col px-5 pt-6 pb-14',
        'lg:pt-8 lg:px-14 1xl:px-28 2xl:px-32 h-full'
      )}
    >
      <Indexes />
    </div>
  )
}

IndexesPage.getLayout = (page) => <DatabaseLayout title="Indexes">{page}</DatabaseLayout>

export default IndexesPage
