import { Mermaid } from 'ui'

export default function MermaidBasic() {
  return (
    <Mermaid
      chart={`
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
`}
    />
  )
}
