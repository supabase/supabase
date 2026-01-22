import { StatusCode } from 'ui-patterns'

export default function StatusCodeDemo() {
  return (
    <div className="flex flex-col gap-2">
      <StatusCode type="success" method="GET" statusCode="200" />
      <StatusCode type="warning" method="POST" statusCode="404" />
      <StatusCode type="error" method="DELETE" statusCode="500" />
      <StatusCode type="info" method="PUT" statusCode="100" />
      <StatusCode type="default" method="PATCH" statusCode="0" />
    </div>
  )
}
