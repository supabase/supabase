import { Mermaid } from 'ui'

export default function MermaidErSimple() {
  return (
    <Mermaid
      chart={`
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
`}
    />
  )
}
