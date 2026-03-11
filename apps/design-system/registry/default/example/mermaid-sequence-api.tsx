import { Mermaid } from 'ui'

export default function MermaidSequenceApi() {
  return (
    <Mermaid
      chart={`
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant DB
    
    Client->>API: POST /api/data
    API->>Auth: Validate JWT
    Auth-->>API: Token valid
    API->>DB: INSERT query
    DB-->>API: Success
    API-->>Client: 201 Created
`}
    />
  )
}
