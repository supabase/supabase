import { Mermaid } from 'ui'

export default function MermaidOAuthFlow() {
  return (
    <Mermaid
      chart={`
flowchart TD
    A["Third-party App"]
    B["Your Authorization Endpoint"]
    C["Supabase Auth Server"]
    D["Third-party App"]
    E["Supabase Auth Server"]
    F["Third-party App can now access resources"]

    A -- "(1) Authorization request" --> B
    B -- "(2) User authenticates & approves" --> C
    C -- "(3) Authorization code issued" --> D
    D -- "(4) Exchange code for access token" --> E
    E -- "(5) Access token + refresh token" --> F
`}
    />
  )
}
