import { Admonition } from 'ui-patterns/Admonition'

export function FunctionObservabilityDisabled() {
  return (
    <Admonition type="default" title="Function logs are not enabled" className="m-6">
      Enable the logging services with the docker-compose.logs.yml override to view function metrics
      and logs.
    </Admonition>
  )
}
