import AuthLayout from '../../components/layouts/AuthLayout'
import { Card, Button, Badge, IconSearch, Input } from '@supabase/ui'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMetaStore } from 'store/postgres/MetaStore'

function Policies() {
  const meta = useMetaStore()
  const [filter, setFilter] = useState('')
  const { tables } = meta

  useEffect(() => {
    tables.load()
  }, [])

  return (
    <AuthLayout title="Users">
      <>
        <div className="border-b my-8 mx-4 ">
          <div className="flex justify-between">
            <div>
              <Input
                className="mb-2"
                type="text"
                placeholder="Filter tables"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                icon={<IconSearch />}
              />
            </div>
          </div>
        </div>
        <div>
          {tables
            .list((table) => table.name.indexOf(filter) >= 0)
            .map((table) => {
              return <TableCard table={table} />
            })}
        </div>
      </>
    </AuthLayout>
  )
}
export default observer(Policies)

const TableCard = observer(({ table }) => {
  return (
    <div className="border-b my-8 mx-8">
      <div className="flex">
        <div className="flex-auto">
          <Card
            title={
              <div className="flex space-x-2">
                <div>{table.name}</div>
                <div>
                  {table.rls_enabled ? (
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
                  {table.rls_enabled ? (
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
          ></Card>
        </div>
      </div>
    </div>
  )
})
