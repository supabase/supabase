import { SettingsLayout } from 'components/layouts'
import { StorageSettings } from 'components/to-be-cleaned/Storage'
import { S3Connection } from 'components/to-be-cleaned/Storage/StorageSettings/S3Connection'
import { useFlag } from 'hooks'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const showS3Connection = useFlag('showS3Connection')

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-y-10 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 pb-32">
      <StorageSettings />
      {showS3Connection && <S3Connection />}
    </div>
  )
}

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>
export default PageLayout
