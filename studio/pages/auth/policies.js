import AuthLayout from '../../components/layouts/AuthLayout'
import { Card, Button, Badge, IconSearch, Input, Divider } from '@supabase/ui'

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
      <div className="border-b my-8 mx-4 ">
        <div className="flex justify-between">
          <div>
            <Input className="mb-2" type="text" placeholder="Filter tables" icon={<IconSearch />} />
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
    <div className="border-b my-8 mx-8">
      <div className="flex">
        <div className="flex-auto">
          <Card
            title={
              <div className="flex space-x-2">
                <div>{table?.name}</div>
                <div>
                  {table?.isRLSEnabled ? (
                    <Badge color="green">RLS Enabled</Badge>
                  ) : (
                    <Badge color="yellow">RLS Disabled</Badge>
                  )}
                </div>
              </div>
            }
            titleExtra={
              <div className="flex space-x-2">
                <div>
                  {table?.isRLSEnabled ? (
                    <Button type="text">Disable RLS</Button>
                  ) : (
                    <Button type="text">Enable RLS</Button>
                  )}
                </div>
                <div>
                  <Button type="outline">New Policy</Button>
                </div>
              </div>
            }
          >
            {table?.policies?.map((policy, index) => {
              return Object.keys(policy).length !== 0 ? (
                <div>
                  <Card.Meta title={policy?.name} description={policy?.expression} />
                  {index + 1 !== table?.policies.length ? <Divider className="my-4" /> : null}
                </div>
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
