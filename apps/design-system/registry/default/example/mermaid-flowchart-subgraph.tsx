import { Mermaid } from 'ui-patterns/Mermaid'

export default function MermaidFlowchartSubgraph() {
  return (
    <Mermaid
      chart={`
flowchart LR
    subgraph Frontend
        A[React App] --> B[API Client]
    end
    
    subgraph Backend
        C[Edge Functions] --> D[Database]
        C --> E[Storage]
    end
    
    B --> C
`}
    />
  )
}
