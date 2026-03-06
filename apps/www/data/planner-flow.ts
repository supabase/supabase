/**
 * Database Planner Flow Definition
 *
 * This file contains the Mermaid diagram that powers the Database Planner.
 * To modify the flow, edit the MERMAID_DIAGRAM string below.
 * The UI is automatically generated from this diagram.
 */

export const MERMAID_DIAGRAM = `
flowchart TD
    subgraph SYMPTOMS["Observable symptoms"]
        S1["Slow query performance"]
        S2["High CPU utilization"]
        S3["Connection errors / timeouts"]
        S4["High latency for distant users"]
        S5["Analytics slowing production"]
        S6["Traffic spikes overwhelming DB"]
        S7["Database growing too large"]
        S8["Need disaster recovery"]
        S9["Out of memory errors"]
        S10["Deadlocks or lock timeouts"]
        S11["Slow write performance"]
        S12["Database periodically unresponsive"]
        S13["Table bloat / vacuum issues"]
        S14["Statement timeout errors"]
        S15["Permission denied errors"]
        S16["Low cache hit ratio"]
        S17["REST API 5xx errors"]
        S18["Realtime not working"]
        S19["Read replica lag"]
        S20["Duplicate key errors"]
        S21["JOINs extremely slow"]
        S22["Can't connect from corporate network"]
        S23["Need private database access"]
        S24["Want custom API domain"]
        S25["Need to restrict access by IP"]
        S26["Need to export logs externally"]
        S27["Need isolated test environments"]
    end

    subgraph DIAGNOSTICS["Diagnostic questions"]
        D1{"Is your workload read-heavy or write-heavy?"}
        D2{"How many concurrent connections do you typically have?"}
        D3{"Where are your users located?"}
        D4{"Are you running BI or analytics tools on production?"}
        D5{"What is your current compute tier?"}
        D6{"What type of queries are causing issues?"}
        D7{"What level of recovery do you need?"}
        D8{"Are you at the maximum compute tier?"}
        D9{"What error message are you seeing?"}
        D10{"When do these timeouts occur?"}
        D11{"What is causing the database growth?"}
        D12{"When do out of memory errors occur?"}
        D13{"What is causing the lock contention?"}
        D14{"What symptoms occur during traffic spikes?"}
        D15{"When does the database become unresponsive?"}
        D16{"What type of write operations are you performing?"}
        D17{"What is your application architecture?"}
        D18{"Are writes happening across many tables?"}
        D19{"What queries are timing out?"}
        D20{"What resource is permission denied for?"}
        D21{"What is the exact error code?"}
        D22{"What type of Realtime issue?"}
        D23{"When did the duplicate key errors start?"}
        D24{"Are the JOINs on indexed columns?"}
        D25{"What type of network restriction do you need?"}
        D26{"Where are you connecting from?"}
        D27{"What is your compliance requirement?"}
    end

    subgraph SOLUTIONS["Supabase solutions"]
        SOL_RR["READ REPLICAS"]
        SOL_POOL["CONNECTION POOLING"]
        SOL_COMPUTE["COMPUTE SCALING"]
        SOL_ETL["DATA STREAMING"]
        SOL_PITR["POINT-IN-TIME RECOVERY"]
        SOL_EDGE["EDGE FUNCTIONS"]
        SOL_STORAGE["SUPABASE STORAGE"]
        SOL_OPTIMIZE["QUERY OPTIMIZATION"]
        SOL_MULTIGRES["MULTIGRES"]
        SOL_RLS["ROW LEVEL SECURITY"]
        SOL_REALTIME["REALTIME SETUP"]
        SOL_INDEXES["INDEX MANAGEMENT"]
        SOL_IPV4["DEDICATED IPV4"]
        SOL_PRIVATE_LINK["PRIVATE LINK"]
        SOL_CUSTOM_DOMAIN["CUSTOM DOMAIN"]
        SOL_NETWORK["NETWORK RESTRICTIONS"]
        SOL_LOG_DRAIN["LOG DRAIN"]
        SOL_BRANCHING["DATABASE BRANCHING"]
    end

    %% S1: Slow query performance
    S1 --> D1
    D1 -- "Read-heavy (mostly SELECTs)" --> D4
    D1 -- "Write-heavy (INSERTs/UPDATEs)" --> D16
    D1 -- "Mixed workload" --> D4
    D4 -- "Yes, running BI tools" --> D6
    D4 -- "No, just application queries" --> SOL_OPTIMIZE
    D6 -- "Simple queries, need lower latency" --> SOL_RR
    D6 -- "Complex analytics queries" --> SOL_ETL

    %% S2: High CPU utilization
    S2 --> D2
    D2 -- "More than 100 connections" --> SOL_POOL
    D2 -- "50-100 connections" --> D5
    D2 -- "Under 50 connections" --> D5
    D5 -- "Micro, Small, or Medium" --> SOL_COMPUTE
    D5 -- "Large or XL" --> D8
    D5 -- "2XL to 16XL" --> D8
    D8 -- "Yes, at 16XL" --> SOL_RR
    D8 -- "No, still have room to scale" --> SOL_COMPUTE

    %% S3: Connection errors / timeouts
    S3 --> D9
    D9 -- "Too many connections error" --> SOL_POOL
    D9 -- "Connection timeout error" --> D10
    D9 -- "Connection refused error" --> D5
    D10 -- "Only during traffic spikes" --> SOL_POOL
    D10 -- "Happens consistently" --> D17
    D17 -- "Serverless / Edge functions" --> SOL_POOL
    D17 -- "Traditional server" --> D5

    %% S4: High latency for distant users
    S4 --> D3
    D3 -- "Users across multiple continents" --> SOL_RR
    D3 -- "Users in one region, but far from DB" --> SOL_RR
    D3 -- "Users near the database region" --> SOL_OPTIMIZE

    %% S5: Analytics slowing production
    S5 --> D6

    %% S6: Traffic spikes overwhelming DB
    S6 --> D14
    D14 -- "Connection errors during spikes" --> SOL_POOL
    D14 -- "Queries slow down during spikes" --> D2
    D14 -- "Database becomes unresponsive" --> SOL_COMPUTE

    %% S7: Database growing too large
    S7 --> D11
    D11 -- "Large files (images, videos, PDFs)" --> SOL_STORAGE
    D11 -- "Historical or archival data" --> SOL_ETL
    D11 -- "Growing transactional data" --> SOL_OPTIMIZE

    %% S8: Disaster recovery
    S8 --> D7
    D7 -- "Need to restore to any point in time" --> SOL_PITR
    D7 -- "Just need backup redundancy" --> SOL_RR
    D7 -- "Need automatic failover" --> SOL_MULTIGRES

    %% S9: Out of memory errors
    S9 --> D12
    D12 -- "During specific large queries" --> SOL_OPTIMIZE
    D12 -- "Under high concurrent load" --> D5
    D12 -- "When running analytics" --> SOL_RR

    %% S10: Deadlocks or lock timeouts
    S10 --> D13
    D13 -- "Long-running transactions" --> SOL_OPTIMIZE
    D13 -- "Many concurrent updates to same rows" --> SOL_OPTIMIZE
    D13 -- "Analytics blocking production" --> SOL_RR

    %% S11: Slow write performance
    S11 --> D16
    D16 -- "Bulk loading large datasets" --> SOL_OPTIMIZE
    D16 -- "High-frequency small writes" --> D18
    D18 -- "Yes, writes to many tables" --> SOL_OPTIMIZE
    D18 -- "No, concentrated in few tables" --> D5

    %% S12: Database periodically unresponsive
    S12 --> D15
    D15 -- "During nightly maintenance" --> SOL_OPTIMIZE
    D15 -- "During peak traffic hours" --> D14
    D15 -- "At random unpredictable times" --> D5

    %% S13: Table bloat / vacuum issues
    S13 --> D15

    %% S14: Statement timeout errors
    S14 --> D19
    D19 -- "Long-running analytics queries" --> SOL_RR
    D19 -- "Specific slow queries" --> SOL_OPTIMIZE
    D19 -- "All queries timing out" --> D5

    %% S15: Permission denied errors
    S15 --> D20
    D20 -- "Table or schema access" --> SOL_RLS
    D20 -- "Function execution" --> SOL_RLS
    D20 -- "API endpoint access" --> D21

    %% D21: Error code routing
    D21 -- "42501 error code" --> SOL_RLS
    D21 -- "401 or 403 HTTP status" --> SOL_RLS
    D21 -- "Other error codes" --> SOL_OPTIMIZE

    %% S16: Low cache hit ratio
    S16 --> D5

    %% S17: REST API 5xx errors
    S17 --> D21

    %% S18: Realtime not working
    S18 --> D22
    D22 -- "Events not firing at all" --> SOL_REALTIME
    D22 -- "Events delayed or slow" --> SOL_COMPUTE
    D22 -- "Only some tables not working" --> SOL_RLS
    D22 -- "Connection drops frequently" --> SOL_POOL

    %% S19: Read replica lag
    S19 --> D8

    %% S20: Duplicate key errors
    S20 --> D23
    D23 -- "After a data migration or import" --> SOL_INDEXES
    D23 -- "During normal operations" --> SOL_OPTIMIZE
    D23 -- "After restoring from backup" --> SOL_INDEXES

    %% S21: JOINs extremely slow
    S21 --> D24
    D24 -- "No, columns are not indexed" --> SOL_INDEXES
    D24 -- "Yes, columns are indexed" --> SOL_OPTIMIZE
    D24 -- "Not sure" --> SOL_INDEXES

    %% S22: Can't connect from corporate network
    S22 --> D26
    D26 -- "Corporate network blocking IPv6" --> SOL_IPV4
    D26 -- "Legacy system without IPv6 support" --> SOL_IPV4
    D26 -- "Need static IP for firewall rules" --> SOL_IPV4
    D26 -- "AWS/GCP private VPC" --> SOL_PRIVATE_LINK

    %% S23: Need private database access
    S23 --> D27
    D27 -- "Compliance - no public internet" --> SOL_PRIVATE_LINK
    D27 -- "Connecting from cloud VPC" --> SOL_PRIVATE_LINK
    D27 -- "Just need IP allowlisting" --> SOL_NETWORK

    %% S24: Want custom API domain
    S24 --> SOL_CUSTOM_DOMAIN

    %% S25: Need to restrict access by IP
    S25 --> D25
    D25 -- "Allow specific IPs only" --> SOL_NETWORK
    D25 -- "Block certain IPs/regions" --> SOL_NETWORK
    D25 -- "Need private networking" --> SOL_PRIVATE_LINK

    %% S26: Need to export logs externally
    S26 --> SOL_LOG_DRAIN

    %% S27: Need isolated test environments
    S27 --> SOL_BRANCHING

    %% Optimization paths to next steps
    SOL_OPTIMIZE -.-> SOL_COMPUTE
    SOL_OPTIMIZE -.-> SOL_RR

    %% Future path to Multigres
    SOL_RR -.-> |"When you outgrow replicas"| SOL_MULTIGRES
    SOL_COMPUTE -.-> |"When you hit 16XL"| SOL_MULTIGRES

    %% Styling - using Supabase brand green
    classDef symptom fill:#3ecf8e20,stroke:#3ecf8e,color:#fff
    classDef diagnostic fill:#3ecf8e15,stroke:#3ecf8e80,color:#fff
    classDef solution fill:#3ecf8e,stroke:#3ecf8e,color:#000
    classDef future fill:#3ecf8e40,stroke:#3ecf8e60,color:#fff

    class S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11,S12,S13,S14,S15,S16,S17,S18,S19,S20,S21,S22,S23,S24,S25,S26,S27 symptom
    class D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12,D13,D14,D15,D16,D17,D18,D19,D20,D21,D22,D23,D24,D25,D26,D27 diagnostic
    class SOL_RR,SOL_POOL,SOL_COMPUTE,SOL_ETL,SOL_PITR,SOL_EDGE,SOL_STORAGE,SOL_OPTIMIZE,SOL_RLS,SOL_REALTIME,SOL_INDEXES,SOL_IPV4,SOL_PRIVATE_LINK,SOL_CUSTOM_DOMAIN,SOL_NETWORK,SOL_LOG_DRAIN,SOL_BRANCHING solution
    class SOL_MULTIGRES future
`

/**
 * Solution metadata - enriched information for each solution node
 * This is kept separate from the Mermaid diagram for maintainability
 */
export type DestinationType = 'feature' | 'docs' | 'video'

export interface SolutionDetails {
  title: string
  subtitle: string
  description: string
  benefits: string[]
  pricing?: string
  docsUrl: string
  icon: 'replicas' | 'pool' | 'compute' | 'etl' | 'pitr' | 'edge' | 'storage' | 'optimize' | 'multigres' | 'lock' | 'traffic' | 'ipv4' | 'privatelink' | 'domain' | 'network' | 'logs' | 'branch'
  isFuture?: boolean
  availability?: string
  /** Type of destination: feature page, documentation, or video tutorial */
  destinationType: DestinationType
  /** YouTube video ID for video destinations */
  videoId?: string
}

export const SOLUTION_DETAILS: Record<string, SolutionDetails> = {
  SOL_RR: {
    title: 'Read Replicas',
    subtitle: 'Distribute read load across multiple database instances',
    description:
      'Read Replicas allow you to create copies of your database that handle read queries, reducing load on your primary database and enabling geographic distribution for lower latency.',
    benefits: [
      'Distribute read load across instances',
      'Geographic proximity for lower latency',
      'Isolate analytics from production',
      'Scale reads independently',
    ],
    pricing: 'Starting at $16/mo for Small',
    docsUrl: '/docs/guides/platform/read-replicas',
    icon: 'replicas',
    destinationType: 'feature',
  },
  SOL_POOL: {
    title: 'Connection Pooling',
    subtitle: 'Supavisor - Efficient connection management',
    description:
      'Supavisor is a high-performance connection pooler that multiplexes thousands of client connections into a small number of database connections, perfect for serverless environments.',
    benefits: [
      'Multiplex thousands of connections',
      'Reduce memory overhead',
      'Enable serverless at scale',
      'Transaction and session pooling modes',
    ],
    pricing: 'Included in all plans',
    docsUrl: '/docs/guides/database/connecting-to-postgres#connection-pooler',
    icon: 'pool',
    destinationType: 'feature',
  },
  SOL_COMPUTE: {
    title: 'Compute Scaling',
    subtitle: 'Vertical scaling for immediate relief',
    description:
      'Increase your database compute resources to handle higher loads. Supabase offers compute sizes from Micro to 16XL with proportional CPU, memory, and connection limits.',
    benefits: [
      'Immediate performance improvement',
      'More CPU and RAM',
      'Higher connection limits',
      'No code changes required',
    ],
    pricing: 'Micro to 16XL tiers available',
    docsUrl: '/docs/guides/platform/compute-and-disk',
    icon: 'compute',
    destinationType: 'feature',
  },
  SOL_ETL: {
    title: 'Data Streaming with ETL',
    subtitle: 'Stream data to Iceberg, BigQuery, and more',
    description:
      'Stream your data to columnar storage formats optimized for analytics. Separate your OLAP workloads entirely from your production database for better performance and lower costs at scale.',
    benefits: [
      'Stream to Iceberg or BigQuery',
      'Columnar storage for OLAP',
      'Cheaper analytics at scale',
      'Keep production fast',
    ],
    docsUrl: '/docs/guides/database/etl',
    icon: 'etl',
    destinationType: 'docs',
  },
  SOL_PITR: {
    title: 'Point-in-Time Recovery',
    subtitle: 'Restore your database to any point in time',
    description:
      'PITR allows you to restore your database to any second within your backup retention window. Essential for compliance requirements and disaster recovery scenarios.',
    benefits: [
      'Restore to any point in time',
      'Meet compliance requirements',
      'Disaster recovery protection',
      'Up to 7-day retention',
    ],
    pricing: 'Starting at $100/mo',
    docsUrl: '/docs/guides/platform/backups#point-in-time-recovery',
    icon: 'pitr',
    destinationType: 'feature',
  },
  SOL_EDGE: {
    title: 'Edge Functions',
    subtitle: 'Process requests at the edge',
    description:
      'Run serverless functions close to your users to reduce database round-trips. Perfect for webhook preprocessing, data transformation, and custom API logic.',
    benefits: [
      'Process at the edge',
      'Reduce database round-trips',
      'Webhook preprocessing',
      'Custom business logic',
    ],
    pricing: 'Included in Pro+ plans',
    docsUrl: '/docs/guides/functions',
    icon: 'edge',
    destinationType: 'feature',
  },
  SOL_STORAGE: {
    title: 'Supabase Storage',
    subtitle: 'Offload large files from your database',
    description:
      'Store large files, images, and media in object storage instead of your database. Includes CDN delivery for fast global access and automatic image transformations.',
    benefits: [
      'Offload large files',
      'CDN delivery worldwide',
      'Image transformations',
      'Reduce database size',
    ],
    pricing: 'Included in all plans',
    docsUrl: '/docs/guides/storage',
    icon: 'storage',
    destinationType: 'feature',
  },
  SOL_OPTIMIZE: {
    title: 'Query Optimization Guide',
    subtitle: 'Tune your queries for better performance',
    description:
      'Learn how to use built-in tools like pg_stat_statements and index_advisor to identify slow queries and missing indexes. This video tutorial walks you through the process.',
    benefits: [
      'pg_stat_statements analysis',
      'index_advisor extension',
      'EXPLAIN ANALYZE insights',
      'No additional cost',
    ],
    pricing: 'Free - included with Postgres',
    docsUrl: '/docs/guides/database/inspect',
    icon: 'optimize',
    destinationType: 'video',
    videoId: 'CKhPdBNFaFY',
  },
  SOL_MULTIGRES: {
    title: 'Multigres',
    subtitle: 'Future: Horizontal scaling and automatic failover',
    description:
      'The next evolution of Supabase infrastructure. Automatic failover, write scaling, and horizontal sharding for the most demanding workloads.',
    benefits: [
      'Automatic failover',
      'Write scaling',
      '99.95% SLA target',
      'Horizontal sharding',
    ],
    availability: 'Expected Q2 2026+',
    docsUrl: '/blog',
    icon: 'multigres',
    isFuture: true,
    destinationType: 'docs',
  },
  SOL_RLS: {
    title: 'Row Level Security Guide',
    subtitle: 'Configure permissions and access control',
    description:
      'Row Level Security (RLS) controls which rows users can access in your tables. Learn how to write effective policies and troubleshoot common permission errors.',
    benefits: [
      'Fine-grained access control',
      'Secure by default',
      'Works with all Supabase APIs',
      'Per-user data isolation',
    ],
    pricing: 'Included with Postgres',
    docsUrl: '/docs/guides/database/postgres/row-level-security',
    icon: 'lock',
    destinationType: 'docs',
  },
  SOL_REALTIME: {
    title: 'Realtime Setup Guide',
    subtitle: 'Configure real-time subscriptions',
    description:
      'Supabase Realtime enables you to listen to database changes in real-time. Learn how to configure tables for Realtime and troubleshoot common issues.',
    benefits: [
      'Live data updates',
      'Presence tracking',
      'Broadcast messages',
      'Works with RLS',
    ],
    pricing: 'Included in all plans',
    docsUrl: '/docs/guides/realtime',
    icon: 'traffic',
    destinationType: 'docs',
  },
  SOL_INDEXES: {
    title: 'Index Management Guide',
    subtitle: 'Create and manage database indexes',
    description:
      'Indexes are critical for query performance. Learn how to identify missing indexes, create them properly, and fix sequence issues after data migrations.',
    benefits: [
      'Faster query execution',
      'Fix duplicate key errors',
      'Optimize JOIN performance',
      'Reduce table scans',
    ],
    pricing: 'Free - included with Postgres',
    docsUrl: '/docs/guides/database/postgres/indexes',
    icon: 'optimize',
    destinationType: 'docs',
  },
  SOL_IPV4: {
    title: 'Dedicated IPv4 Address',
    subtitle: 'Static IPv4 for legacy systems and corporate networks',
    description:
      'Get a dedicated IPv4 address for your database. Essential for connecting from corporate networks that block IPv6, legacy systems, or when you need a static IP for firewall allowlisting.',
    benefits: [
      'Static IP for firewall rules',
      'Corporate network compatibility',
      'Legacy system support',
      'Predictable networking',
    ],
    pricing: '$4/month add-on',
    docsUrl: '/docs/guides/platform/ipv4-address',
    icon: 'ipv4',
    destinationType: 'feature',
  },
  SOL_PRIVATE_LINK: {
    title: 'Private Link / AWS PrivateLink',
    subtitle: 'Private connectivity without public internet',
    description:
      'Connect to your Supabase database privately through AWS PrivateLink. Traffic never traverses the public internet, meeting strict compliance requirements for regulated industries.',
    benefits: [
      'No public internet exposure',
      'Compliance friendly (HIPAA, SOC2)',
      'Lower latency from VPC',
      'Enhanced security',
    ],
    pricing: 'Enterprise plan feature',
    docsUrl: '/docs/guides/platform/privatelink',
    icon: 'privatelink',
    destinationType: 'feature',
  },
  SOL_CUSTOM_DOMAIN: {
    title: 'Custom Domain',
    subtitle: 'Use your own domain for Supabase APIs',
    description:
      'Replace the default Supabase domain with your own custom domain. Perfect for white-labeling, branded experiences, and keeping your infrastructure details private.',
    benefits: [
      'Branded API URLs',
      'White-label solutions',
      'Hide infrastructure details',
      'Custom auth callback URLs',
    ],
    pricing: '$10/month add-on',
    docsUrl: '/docs/guides/platform/custom-domains',
    icon: 'domain',
    destinationType: 'feature',
  },
  SOL_NETWORK: {
    title: 'Network Restrictions',
    subtitle: 'Control access with IP allowlisting',
    description:
      'Restrict database access to specific IP addresses or ranges. Add an extra layer of security by ensuring only trusted networks can connect to your database.',
    benefits: [
      'IP allowlisting',
      'Block unwanted access',
      'Compliance requirements',
      'Defense in depth',
    ],
    pricing: 'Included in Pro+ plans',
    docsUrl: '/docs/guides/platform/network-restrictions',
    icon: 'network',
    destinationType: 'feature',
  },
  SOL_LOG_DRAIN: {
    title: 'Log Drain',
    subtitle: 'Export logs to external systems',
    description:
      'Stream your Supabase logs to external logging services like Datadog, Logflare, or your own infrastructure. Essential for compliance, monitoring, and long-term retention.',
    benefits: [
      'External log storage',
      'Compliance retention',
      'Centralized monitoring',
      'Custom alerting',
    ],
    pricing: 'Team plan feature',
    docsUrl: '/docs/guides/platform/log-drains',
    icon: 'logs',
    destinationType: 'feature',
  },
  SOL_BRANCHING: {
    title: 'Database Branching',
    subtitle: 'Isolated environments for development and testing',
    description:
      'Create isolated database branches for development, testing, and preview deployments. Each branch is a full copy of your database that can be safely modified without affecting production.',
    benefits: [
      'Preview environments',
      'Safe testing',
      'CI/CD integration',
      'Git-like workflow',
    ],
    pricing: 'Pro plan feature',
    docsUrl: '/docs/guides/platform/branching',
    icon: 'branch',
    destinationType: 'feature',
  },
}

/**
 * Symptom metadata - enriched information for each symptom
 */
export interface SymptomDetails {
  title: string
  description: string
  icon:
    | 'slow'
    | 'cpu'
    | 'connection'
    | 'latency'
    | 'analytics'
    | 'traffic'
    | 'size'
    | 'disaster'
    | 'memory'
    | 'lock'
    | 'write'
    | 'unresponsive'
    | 'vacuum'
    | 'timeout'
    | 'permission'
    | 'cache'
    | 'api'
    | 'realtime'
    | 'replica'
    | 'duplicate'
    | 'join'
    | 'corporate'
    | 'private'
    | 'domain'
    | 'firewall'
    | 'logs'
    | 'branch'
}

export const SYMPTOM_DETAILS: Record<string, SymptomDetails> = {
  S1: {
    title: 'Slow query performance',
    description: 'Queries are taking longer than expected to complete',
    icon: 'slow',
  },
  S2: {
    title: 'High CPU utilization',
    description: 'Database CPU is consistently high or maxing out',
    icon: 'cpu',
  },
  S3: {
    title: 'Connection errors / timeouts',
    description: 'Users are experiencing connection failures or timeouts',
    icon: 'connection',
  },
  S4: {
    title: 'High latency for distant users',
    description: 'Users far from your database region experience slow responses',
    icon: 'latency',
  },
  S5: {
    title: 'Analytics slowing production',
    description: 'BI tools or analytics queries are impacting production performance',
    icon: 'analytics',
  },
  S6: {
    title: 'Traffic spikes overwhelming DB',
    description: 'Sudden increases in traffic cause performance degradation',
    icon: 'traffic',
  },
  S7: {
    title: 'Database growing too large',
    description: 'Database size is becoming difficult to manage or expensive',
    icon: 'size',
  },
  S8: {
    title: 'Need disaster recovery',
    description: 'Need to protect against data loss and ensure business continuity',
    icon: 'disaster',
  },
  S9: {
    title: 'Out of memory errors',
    description: 'Database is running out of memory or connections are being killed',
    icon: 'memory',
  },
  S10: {
    title: 'Deadlocks or lock timeouts',
    description: 'Transactions are blocking each other or timing out waiting for locks',
    icon: 'lock',
  },
  S11: {
    title: 'Slow write performance',
    description: 'INSERT, UPDATE, or DELETE operations are taking too long',
    icon: 'write',
  },
  S12: {
    title: 'Database periodically unresponsive',
    description: 'Database becomes slow or unresponsive at certain times',
    icon: 'unresponsive',
  },
  S13: {
    title: 'Table bloat / vacuum issues',
    description: 'Tables are growing larger than expected or autovacuum is struggling',
    icon: 'vacuum',
  },
  S14: {
    title: 'Statement timeout errors',
    description: 'Queries are being cancelled due to statement timeout limits',
    icon: 'timeout',
  },
  S15: {
    title: 'Permission denied errors',
    description: 'Getting 42501, 401, or 403 errors when accessing data',
    icon: 'permission',
  },
  S16: {
    title: 'Low cache hit ratio',
    description: 'Database cache hit ratio is below 99%, queries hitting disk',
    icon: 'cache',
  },
  S17: {
    title: 'REST API 5xx errors',
    description: 'Getting HTTP 500, 520, or other 5xx errors from the API',
    icon: 'api',
  },
  S18: {
    title: 'Realtime not working',
    description: 'Realtime subscriptions not receiving events or connection issues',
    icon: 'realtime',
  },
  S19: {
    title: 'Read replica lag',
    description: 'Read replicas showing stale data or high replication lag',
    icon: 'replica',
  },
  S20: {
    title: 'Duplicate key errors',
    description: 'Getting unique constraint violations on auto-increment columns',
    icon: 'duplicate',
  },
  S21: {
    title: 'JOINs extremely slow',
    description: 'Queries with JOINs taking much longer than expected',
    icon: 'join',
  },
  S22: {
    title: "Can't connect from corporate network",
    description: 'Connection issues from office networks, VPNs, or legacy systems',
    icon: 'corporate',
  },
  S23: {
    title: 'Need private database access',
    description: 'Require private connectivity without public internet exposure',
    icon: 'private',
  },
  S24: {
    title: 'Want custom API domain',
    description: 'Need branded URLs or white-label API endpoints',
    icon: 'domain',
  },
  S25: {
    title: 'Need to restrict access by IP',
    description: 'Want to limit database access to specific IP addresses',
    icon: 'firewall',
  },
  S26: {
    title: 'Need to export logs externally',
    description: 'Require log retention, external monitoring, or compliance logging',
    icon: 'logs',
  },
  S27: {
    title: 'Need isolated test environments',
    description: 'Want separate database instances for development and testing',
    icon: 'branch',
  },
}

/**
 * Diagnostic question metadata
 */
export interface DiagnosticDetails {
  title: string
  helpText?: string
}

export const DIAGNOSTIC_DETAILS: Record<string, DiagnosticDetails> = {
  D1: {
    title: 'Is your workload read-heavy or write-heavy?',
    helpText: 'Consider how your application uses the database. Read-heavy means mostly SELECT queries, write-heavy means lots of INSERT, UPDATE, or DELETE.',
  },
  D2: {
    title: 'How many concurrent connections do you have?',
    helpText: 'Check your connection count in the Supabase dashboard under Database > Connections. Serverless apps often have many short-lived connections.',
  },
  D3: {
    title: 'Are your users located in multiple regions?',
    helpText: 'Do you have significant user traffic from different geographic regions? This affects latency for database queries.',
  },
  D4: {
    title: 'Are you running BI tools on your production database?',
    helpText: 'Tools like Metabase, Tableau, Looker, or custom analytics dashboards can impact production performance with heavy queries.',
  },
  D5: {
    title: 'What is your current compute tier?',
    helpText: 'Check your current compute size in Project Settings > Infrastructure. Options range from Micro to 16XL.',
  },
  D6: {
    title: 'What type of queries are causing issues?',
    helpText: 'OLTP = fast transactional queries (typical app queries). OLAP = complex analytical queries over large datasets (reports, aggregations).',
  },
  D7: {
    title: 'Do you need point-in-time recovery?',
    helpText: 'Point-in-time recovery lets you restore to any specific second. Daily backups only let you restore to the backup time.',
  },
  D8: {
    title: 'Have you hit the 16XL compute ceiling?',
    helpText: 'If you are at the maximum compute tier (16XL) and still need more resources, you may need to consider other scaling strategies.',
  },
  D9: {
    title: 'What error message are you seeing?',
    helpText: 'The specific error message helps identify the root cause. Common errors include "too many connections", "connection timeout", or "connection refused".',
  },
  D10: {
    title: 'When do these timeouts occur?',
    helpText: 'Understanding the pattern helps identify the cause. Is it during traffic spikes, consistently throughout the day, or at random times?',
  },
  D11: {
    title: 'What is causing your database to grow?',
    helpText: 'Different types of data growth require different solutions. Large files should go to object storage, historical data can be archived.',
  },
  D12: {
    title: 'When do out of memory errors occur?',
    helpText: 'OOM errors during specific queries suggest those queries need optimization. OOM under high load suggests you need more compute resources.',
  },
  D13: {
    title: 'Are long-running transactions involved?',
    helpText: 'Long transactions hold locks and can cause other queries to wait. Check for uncommitted transactions or batch operations.',
  },
  D14: {
    title: 'What happens when traffic spikes occur?',
    helpText: 'Different symptoms during spikes point to different solutions. Connection errors suggest pooling, slow queries suggest scaling.',
  },
  D15: {
    title: 'When does the database become unresponsive?',
    helpText: 'Patterns help identify the cause. Maintenance windows suggest vacuum issues, traffic spikes suggest capacity issues.',
  },
  D16: {
    title: 'What type of write operations are you performing?',
    helpText: 'Bulk inserts (loading large datasets) vs many small writes (high-frequency updates) require different optimization strategies.',
  },
  D17: {
    title: 'Are you using serverless or edge functions?',
    helpText: 'Serverless environments create many short-lived connections which benefit greatly from connection pooling.',
  },
  D18: {
    title: 'Are writes distributed across many tables?',
    helpText: 'Concentrated writes to few tables can cause hotspots. Distributed writes may benefit from different optimization strategies.',
  },
  D19: {
    title: 'What queries are timing out?',
    helpText: 'Identify whether specific queries or all queries are hitting the timeout. Check pg_stat_statements for slow query patterns.',
  },
  D20: {
    title: 'What resource is permission denied for?',
    helpText: 'The error message should specify if it is a table, schema, or function. This helps identify which RLS policy or grant is missing.',
  },
  D21: {
    title: 'What is the exact error code?',
    helpText: '42501 is a Postgres permission error. 401/403 are HTTP auth errors. The specific code helps narrow down the issue.',
  },
  D22: {
    title: 'What type of Realtime issue?',
    helpText: 'Events not firing usually means the table is not configured for Realtime. Connection drops suggest pooling or network issues.',
  },
  D23: {
    title: 'When did the duplicate key errors start?',
    helpText: 'After migrations or imports, sequences may need to be reset. During normal operations, it may be a race condition.',
  },
  D24: {
    title: 'Are the JOIN columns indexed?',
    helpText: 'Foreign key columns should have indexes for fast JOINs. Check if indexes exist on the columns used in your JOIN conditions.',
  },
  D25: {
    title: 'What type of network restriction do you need?',
    helpText: 'IP allowlisting lets specific IPs connect. Private Link removes public internet exposure entirely.',
  },
  D26: {
    title: 'Where are you connecting from?',
    helpText: 'Corporate networks often block IPv6. Cloud VPCs may benefit from Private Link for lower latency and security.',
  },
  D27: {
    title: 'What is your compliance requirement?',
    helpText: 'Some regulations require no public internet exposure. Others just need access controls and audit logging.',
  },
}
