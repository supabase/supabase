import { StatusCode } from 'ui-patterns'

export default function StatusCodeDemo() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">Standard</span>
      <StatusCode method="GET" statusCode="200" />
      <StatusCode method="POST" statusCode="404" />
      <StatusCode method="DELETE" statusCode="500" />
      <StatusCode method="PUT" statusCode="100" />
      <span className="text-sm text-muted-foreground">Aligned</span>
      <StatusCode method="PATCH" statusCode="0" align="left" />
      <StatusCode method="PATCH" statusCode="0" align="right" />
      <span className="text-sm text-muted-foreground">No method</span>
      <StatusCode statusCode="444663" />
    </div>
  )
}
