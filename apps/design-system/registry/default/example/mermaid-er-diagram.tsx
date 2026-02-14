import { Mermaid } from 'ui'

export default function MermaidERDiagram() {
  return (
    <Mermaid
      chart={`
erDiagram
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    POSTS ||--o{ COMMENTS : has
    USERS {
        uuid id PK
        string email
        timestamp created_at
    }
    POSTS {
        uuid id PK
        uuid user_id FK
        string title
        text content
    }
    COMMENTS {
        uuid id PK
        uuid user_id FK
        uuid post_id FK
        text content
    }
`}
    />
  )
}
