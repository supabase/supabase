import AuthLayout from '../../components/layouts/AuthLayout'
import { Button, IconPlus, IconSearch, Input } from '@supabase/ui'

export default function Users() {

  return (
    <AuthLayout title="Users">
      <div className="border-b my-8 mx-4">
        <div className="flex justify-between">
          <div>
            <Input
              className="mb-2"
              type="text"
              placeholder="Search by email"
              icon={<IconSearch />}
            />
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
