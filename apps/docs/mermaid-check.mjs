import { renderMermaidSVG } from 'beautiful-mermaid'

const charts = {
  totp: `flowchart TD
    InitS((Setup flow)) --> SAAL1[/Session is AAL1/]
    SAAL1 --> Enroll[Enroll API]
    Enroll --> ShowQR[Show QR code]
    ShowQR --> Scan([User: Scan QR code in authenticator])
    Scan --> Enter([User: Enter code])
    Enter --> Verify[Challenge + Verify API]
    Verify --> Check{{Is code correct?}}
    Check -->|Yes| AAL2[/Upgrade to AAL2/]
    AAL2 --> Done((Done))
    Check -->|No| Enter
    InitA((Login flow)) --> SignIn([User: Sign-in])
    SignIn --> AAL1[/Upgrade to AAL1/]
    AAL1 --> ListFactors[List Factors API]
    ListFactors -->|1 or more factors| OpenAuth([User: Open authenticator])
    OpenAuth --> Enter
    ListFactors -->|0 factors| Setup[[Setup flow]]`,
  phone: `flowchart TD
    InitS((Setup flow)) --> SAAL1[/Session is AAL1/]
    SAAL1 --> Enroll[Enroll API]
    Enroll --> ChallengeAPI[Challenge API]
    ChallengeAPI --> Scan[/Code sent to User/]
    Scan --> Enter[User: Enter code]
    Enter --> Verify[Verify API]
    Verify --> Check{{Is code correct?}}
    Check -->|Yes| AAL2[/Upgrade to AAL2/]
    AAL2 --> Done((Done))
    Check -->|No| Enter
    InitA((Login flow)) --> SignIn([User: Sign-in])
    SignIn --> AAL1[/Upgrade to AAL1/]
    AAL1 --> ListFactors[List Factors API]
    ListFactors -->|1 or more factors| OpenAuth([User: Select phone factor])
    OpenAuth --> Enter
    ListFactors -->|0 factors| Setup[[Setup flow]]`,
  signingKeys: `stateDiagram-v2
    [*] --> standby: A new key is created and advertized
    standby --> in_use: Once all components have picked up the new key, new JWTs can be issued with it
    in_use --> previously_used: Rotation, JWT remain accepted
    previously_used --> revoked: Once all JWTs created with the previous key expire (or sooner)
    revoked --> [*]: Delete permanently after 7 days
    previously_used --> standby
    revoked --> standby`,
  readReplicas: `flowchart TD
    A[Database slowing down] --> B{CPU above 70% sustained?}
    B -->|No| C[Monitor, do not scale yet]
    B -->|Yes| D{Queries optimized? Indexes in place?}
    D -->|No| E[Run EXPLAIN ANALYZE<br/>Add missing indexes<br/>Optimize first]
    E --> D
    D -->|Yes| F{Workload 80%+ reads?}
    F -->|No| G[Upgrade compute<br/>Replicas will not help writes]
    F -->|Yes| H{Already at 16XL?}
    H -->|Yes| I[Read Replicas<br/>Only horizontal option left]
    H -->|No| J{Need workload isolation<br/>or geo-distribution?}
    J -->|Yes| K[Read Replicas]
    J -->|No| L[Either works<br/>Compute is simpler<br/>Replicas scale further]`,
  connDecision: `flowchart TD
    A[Where are you connecting from?] --> B[Persistent Backend]
    A --> C[Serverless / Edge]
    B --> D{IPv6 Supported?<br/>IPv4 Add-on?}
    B --> E{IPv4 Needed?}
    C --> H{IPv6 Supported?<br/>IPv4 Add-on?}
    C --> I{IPv4 Needed?}
    D --> F[Use Direct Connection]
    E --> G[Use Supavisor Session Mode]
    H --> J[Use Dedicated Pooler PgBouncer Pro]
    I --> K[Use Supavisor Transaction Mode]`,
}

let ok = true
for (const [name, chart] of Object.entries(charts)) {
  try {
    const svg = await renderMermaidSVG(chart, { transparent: true })
    const len = (typeof svg === 'string' ? svg : String(svg)).length
    console.log(`PASS ${name} (svg ${len} bytes)`) 
  } catch (e) {
    ok = false
    console.log(`FAIL ${name}: ${e?.message || e}`)
  }
}
process.exit(ok ? 0 : 1)
