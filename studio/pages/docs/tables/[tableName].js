import DocsLayout from '../../../components/layouts/DocsLayout'
import Loading from '../../../components/utils/Loading'
import Error from '../../../components/utils/Error'
import { fetchOpenApiSpec } from '../../../lib/api'
import { useRouter } from 'next/router'
import { Typography } from '@supabase/ui'

export default function Home() {
  const router = useRouter()
  const { data, tables, isLoading, error } = fetchOpenApiSpec()
  const { tableName } = router.query
  const table = tables.find((table) => table.name === tableName)

  if (isLoading) return <Loading />
  if (error) return <Error />

  console.log(table)

  return (
    <DocsLayout title={`API: ${tableName}`}>
      <div className="flex h-screen">
        <div className="flex-1">
          <Typography.Title level={1}>
            <code>{tableName}</code>
          </Typography.Title>
          <div>
            {table.fields.map((field) => (
              <Field
                name={field.name}
                type={field.type}
                format={field.format}
                description={field.description}
                required={field.required}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 border-l bg-gray-50">JavaScript | Bash</div>
      </div>
    </DocsLayout>
  )
}

const Field = ({ name, type, required, description, format }) => {
  return (
    <div className="border-b my-8">
      <div className="flex">
        <div className="flex-1">
          <Typography.Title level={3}>
            <code>
              {name}: {type}
            </code>
          </Typography.Title>
        </div>
        <div className="text-right">
          <Typography.Text>
            <code>{required ? 'required' : ''}</code>
          </Typography.Text>
        </div>
      </div>
      <div>
        <Typography.Text>{format}</Typography.Text>
      </div>
      <div>
        <input
          className="border-2 w-full"
          type="text"
          placeholder={description}
          value={description}
        />
      </div>
    </div>
  )
}
