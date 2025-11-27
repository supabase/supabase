import { Mermaid } from 'ui'

export default function MermaidDemo() {
  return (
    <Mermaid
      chart={`
flowchart TB
    subgraph Client
        App[Your Application]
    end

    subgraph Gateway
        Kong[Kong API Gateway]
    end

    subgraph Services
        Auth[GoTrue<br/>Auth]
        API[PostgREST<br/>REST API]
        Realtime[Realtime<br/>WebSockets]
        Storage[Storage API<br/>S3-compatible]
        Meta[postgres-meta<br/>DB Management]
        Functions[Deno<br/>Edge Functions]
        GraphQL[pg_graphql<br/>GraphQL]
    end

    subgraph Data
        Postgres[(PostgreSQL)]
        Supavisor[Supavisor<br/>Connection Pooler]
    end

    App --> Kong
    Kong --> Auth
    Kong --> API
    Kong --> Realtime
    Kong --> Storage
    Kong --> Meta
    Kong --> Functions
    Kong --> GraphQL

    Auth --> Supavisor
    API --> Supavisor
    Realtime --> Supavisor
    Storage --> Supavisor
    Meta --> Supavisor
    GraphQL --> Supavisor
    Supavisor --> Postgres
`}
    />
  )
}
