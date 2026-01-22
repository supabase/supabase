import { StatusCode } from 'ui-patterns'

export default function StatusCodeDemo() {
  return (
    <div className="flex flex-col gap-2">
      <StatusCode method="GET" statusCode="200" />
      <StatusCode method="POST" statusCode="404" />
      <StatusCode method="DELETE" statusCode="500" />
      <StatusCode method="PUT" statusCode="100" />
      <StatusCode method="PATCH" statusCode="0" />
    </div>
  )
}
