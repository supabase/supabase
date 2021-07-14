import AuthLayout from '../../components/layouts/AuthLayout'
import { Card, Button, Badge, IconSearch, Input } from '@supabase/ui'

export default function Home() {
  let mockTables = [
    {
      name: 'first_table',
      isRLSEnabled: true,
      policies: [{ name: 'Enable access to all users', expression: 'true' }],
    },
    {
      name: 'second_table',
      isRLSEnabled: false,
      policies: [{}],
    },
    {
      name: 'third_table',
      isRLSEnabled: true,
      policies: [
        { name: 'Enable access to all users', expression: 'true' },
        {
          name: 'Enable insert for authenticated users only',
          expression: "(role() = 'authenticated'::text)",
        },
      ],
    },
  ]
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
        {mockTables?.map((table) => {
          return <TableCard table={table} />
        })}
      </div>
    </AuthLayout>
  )
}

const TableCard = ({ table }) => {
  return (
    <div className="border-b my-8">
      <div className="flex">
        <div className="flex-1">
          <Card
            title={
              <div className="flex space-between">
                {table?.name}
                {table?.isRLSEnabled ? (
                  <Badge color="green">RLS Enabled</Badge>
                ) : (
                  <Badge color="yellow">RLS Disabled</Badge>
                )}
              </div>
            }
            titleExtra={
              <div className="flex space-between">
                {table?.isRLSEnabled ? (
                  <Button type="text">Disable RLS</Button>
                ) : (
                  <Button type="text">Enable RLS</Button>
                )}
                <Button type="outline">New Policy</Button>
              </div>
            }
          >
            {table?.policies?.map((policy) => {
              return Object.keys(policy).length !== 0 ? (
                <Card.Meta title={policy?.name} description={policy?.expression} />
              ) : (
                <Card.Meta description="No policies created yet" />
              )
            })}
          </Card>
        </div>
      </div>
    </div>
  )
}
