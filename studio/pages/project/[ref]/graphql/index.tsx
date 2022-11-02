import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { GraphiQL } from 'graphiql'
import { observer } from 'mobx-react-lite'
import 'graphiql/graphiql.css'

import { ProjectLayoutWithAuth } from 'components/layouts'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

const fetcher = createGraphiQLFetcher({
  url: 'https://yrjyofbjvjypdsexuvvu.supabase.red/graphql/v1',
  fetch,
  headers: {
    apikey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyanlvZmJqdmp5cGRzZXh1dnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjczNTg0OTIsImV4cCI6MTk4MjkzNDQ5Mn0.CMVzrM7R0ym8ukt5miDoNL0ELhsM9fxOx2Qpm0hsLFE',
  },
})

const GraphiQLPage: NextPageWithLayout = () => {
  const { ui } = useStore()

  const project = ui.selectedProject
  console.log('project:', project)

  return <GraphiQL fetcher={fetcher} />
}

GraphiQLPage.getLayout = (page) => (
  <ProjectLayoutWithAuth>
    <main className="flex-1">{page}</main>
  </ProjectLayoutWithAuth>
)

export default observer(GraphiQLPage)
