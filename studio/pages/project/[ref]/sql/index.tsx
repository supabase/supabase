import { SQLEditorLayout } from 'components/layouts'
import TabWelcome from 'components/to-be-cleaned/SqlEditor/TabWelcome'
import React from 'react'
import { NextPageWithLayout } from 'types'

const SqlEditorPage: NextPageWithLayout = () => {
  return <TabWelcome />
}

SqlEditorPage.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default SqlEditorPage
