import { Typography, IconBookOpen, IconGitHub } from '@supabase/ui'
import DashboardLayout from '../components/layouts/DashboardLayout'
import ClientLibrary from 'components/utils/ClientLibrary'
import ExampleProject from 'components/utils/ExampleProject'
import exampleProjects from '../lib/example-projects.json'
import { useContext, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { DataStoreContext } from 'store/StoreContext'
import { fetchOpenApiSpec } from 'lib/api'
import HomeLayout from '../components/layouts/HomeLayout'
import { Button } from '@supabase/ui'

const Home = observer(() => {
  const { database } = useContext(DataStoreContext)

  return (
    <HomeLayout title="Supabase">
      <div className="p-4">
        <Button>New Project</Button>
      </div>
    </HomeLayout>
  )
})

export default Home
