import { Mermaid } from 'ui'

export default function MermaidSequenceSync() {
  return (
    <Mermaid
      chart={`
sequenceDiagram
    autonumber
    participant P as Postgres
    participant R as Remote Source
    P->>R: Execute Query
    R->>P: Wait (blocking)
    Note over R,P: Fetch all rows (or fixed batch)
    P-->P: Buffer all rows in memory
    P-->P: Convert & emit rows in the batch
`}
    />
  )
}
