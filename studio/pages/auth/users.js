import AuthLayout from '../../components/layouts/AuthLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { Button, IconPlus, IconSearch, Input } from '@supabase/ui'

export default function Home() {
  const { isLoading, error } = fetchOpenApiSpec()

  if (isLoading) return <Loading />
  if (error) return <Error />

  return (
    <AuthLayout title="Users">
      <div className="border-b my-8 ">
        <div className="flex justify-between">
          <div>
            <Input type="text" placeholder="Search by email" icon={<IconSearch />} />
          </div>
          <div>
            <Button icon={<IconPlus />}>Invite</Button>
          </div>
          {/* Add table when table components will be supported by Supabase UI */}
        </div>
      </div>
    </AuthLayout>
  )
}
