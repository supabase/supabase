import AuthLayout from '../../components/layouts/AuthLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { Card, Button, Badge, IconSearch, Input } from '@supabase/ui'

export default function Home() {
  const { tables, isLoading, error } = fetchOpenApiSpec()

  if (isLoading) return <Loading />
  if (error) return <Error />

  return (
    <AuthLayout title="Users">
      <div className="border-b my-8 ">
        <div className="flex justify-between">
          <div>
            <Input type="text" placeholder="Filter tables" icon={<IconSearch />} />
          </div>
          <div>
            <Button type="outline">What is RLS</Button>
          </div>
        </div>
      </div>
      <div>
        {tables?.map((table) => {
          return <TableCard table={table} />
        })}
      </div>
    </AuthLayout>
  )
}

const TableCard = ({ table }) => {
  console.log(table)
  let is_enabled = true
  return (
    <div className="border-b my-8">
      <div className="flex">
        <div className="flex-1">
          <Card
            title={
              <div className="flex space-between">
                {table?.name}
                {<Badge color="green">RLS Enabled</Badge>}
              </div>
            }
            titleExtra={
              <div className="flex space-between">
                <Button type="text">Disable RLS</Button>
                <Button type="outline">New Policy</Button>
              </div>
            }
          >
            <Card.Meta title="Enable access to all users" description="True" />
          </Card>
        </div>
      </div>
    </div>
  )
}
