import { Mermaid } from 'ui'

export default function MermaidFlowchart() {
  return (
    <Mermaid
      chart={`
flowchart TD
    A[Client Request] --> B{Auth Check}
    B -->|Valid| C[Query Postgres]
    B -->|Invalid| D[Return 401]
    C --> E[Apply RLS Policies]
    E --> F[Return Data]
`}
    />
  )
}
