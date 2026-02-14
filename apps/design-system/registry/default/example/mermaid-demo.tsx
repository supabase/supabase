import { Mermaid } from 'ui'

export default function MermaidDemo() {
  return (
    <Mermaid
      chart={`
flowchart TB
    Client[Your Application]
    
    
    Gateway[API Gateway]
    Auth[Auth]
    API[PostgREST]
    Realtime[Realtime]
    PgBouncer[PgBouncer]
    Postgres[(PostgreSQL)]

    Client --> Gateway
    Client --> PgBouncer
    Client <--> Realtime
    Gateway --> Auth
    Gateway --> API
    Auth --> Postgres
    API --> Postgres
    Realtime <--> Postgres
    PgBouncer --> Postgres
`}
    />
  )
}
