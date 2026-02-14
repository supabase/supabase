import { Mermaid } from 'ui'

export default function MermaidSequenceAsync() {
  return (
    <Mermaid
      chart={`
sequenceDiagram
    autonumber
    participant P as Postgres
    participant R as Remote Source 
    P->>R: Execute Query
    P->>P: Spawn async task (non-blocking)
    par Async Task
        R->>P: 
        Note over R,P: Stream rows incrementally<br/>Send via bounded channel
    end
    P-->P: Read from channel (blocking_recv)
    P-->P: Convert & emit row immediately
`}
    />
  )
}
