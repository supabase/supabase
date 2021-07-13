import AuthLayout from '../../components/layouts/AuthLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/openApi'

export default function Home() {
  const { isLoading, error } = fetchOpenApiSpec()

  if (isLoading) return <Loading />
  if (error) return <Error />

  return (
    <AuthLayout title="Users">
      <div>{/* Add table when table components will be supported by Supabase UI */}</div>
    </AuthLayout>
  )
}
