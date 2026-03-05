import { FunctionComponent } from 'react'
import {
  Activity,
  BarChart,
  Braces,
  Brain,
  ChartScatter,
  Clock,
  Cloud,
  CloudCog,
  Database,
  DatabaseBackup,
  DatabaseZap,
  Eye,
  FileCode2,
  Folders,
  GitBranch,
  Globe,
  Image,
  Lock,
  Mail,
  MessageCircle,
  Package,
  Puzzle,
  RectangleEllipsis,
  Server,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Smartphone,
  Terminal,
  UploadCloud,
  Users,
  UserX,
  Zap,
} from 'lucide-react'
import { FlutterIcon, JsIcon, PythonIcon, SwiftIcon } from '~/components/svg-icons'
import {
  PRODUCT,
  PRODUCT_MODULE,
  PRODUCT_MODULES_SHORTNAMES,
  PRODUCT_SHORTNAMES,
} from 'shared-data/products'
import type { LucideIcon } from 'lucide-react'

enum ADDITIONAL_PRODUCTS {
  PLATFORM = 'platform',
  STUDIO = 'studio',
}

export type FeatureProductType = PRODUCT | PRODUCT_MODULE | ADDITIONAL_PRODUCTS

export enum PRODUCT_STAGES {
  PRIVATE_ALPHA = 'Private Alpha',
  PUBLIC_ALPHA = 'Public Alpha',
  BETA = 'Beta',
  PUBLIC_BETA = 'Public Beta',
  GA = 'General Availability',
}

export type FeatureType = {
  /**
   * name of the feature
   */
  title: string
  /**
   * subtitle will be displayed in the feature card, after the title
   */
  subtitle: string
  /**
   * The body content in the feature page
   */
  description: string
  /**
   * slug of the feature page
   */
  slug: string
  /**
   * icon will be displayed in the feature card
   */
  icon: string | LucideIcon | FunctionComponent
  /**
   * Each feature belongs to one or more products
   */
  products: FeatureProductType[]
  /**
   * heroImage can be an absolute path to either:
   * - an image
   * - a youtube video
   * - a video sourced from supabase storage
   */
  heroImage: string
  /**
   * light-mode version image, if heroImage is not a video
   */
  heroImageLight?: string
  /**
   * url to docs or blog page for this feature
   */
  docsUrl?: string
  /**
   * feature metadata on its status
   */
  status?: {
    stage: PRODUCT_STAGES
    availableOnSelfHosted: boolean
    selfHostedTooling?: {
      label: string
      link: string
    }
  }
}

export const features: FeatureType[] = [
  // Database
  {
    title: 'Postgres database',
    subtitle: 'Every project is a full Postgres database.',
    description: `
Every Supabase project is a dedicated [Postgres database](https://www.postgresql.org/) - _"a powerful, open source object-relational database system with over 35 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance"_.

It's 100% portable, which means you can easily migrate your data to and from other Postgres databases, ensuring that your data is never locked into a proprietary system.

## Key benefits
1. Advanced data types: Utilize JSON, arrays, and custom types to store complex data structures efficiently.
2. Powerful indexing: Improve query performance with various indexing options, including B-tree, Hash, and GiST.
3. Full SQL support: Execute complex queries and leverage advanced SQL features for data manipulation and analysis.
4. ACID compliance: Ensure data integrity and consistency with Postgres's transactional capabilities.
5. Extensibility: Add custom functions and extensions to extend database functionality.
6. Scalability: Handle growing data volumes and user loads with Postgres's proven scalability.
7. Community support: Benefit from a large, active community and extensive documentation.
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/postgres-database.png',
    heroImageLight: '/images/features/postgres-database-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/overview',
    slug: 'postgres-database',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Vector database',
    subtitle: 'Store vector embeddings right next to the rest of your data.',
    description: `
Supabase provides an open source toolkit for developing AI applications using Postgres and pgvector. Use the Supabase client libraries to store, index, and query your vector embeddings at scale.

## Key benefits
1. Unified data storage: Keep vector embeddings and relational data in one place, simplifying your data architecture.
2. Efficient similarity search: Perform fast and accurate similarity searches on high-dimensional data.
3. Seamless integration: Easily incorporate vector search into existing applications without additional infrastructure.
4. Scalability: Handle large volumes of vector data with Postgres's proven scalability.
5. Cost-effective: Eliminate the need for separate vector databases, reducing infrastructure costs.
6. Advanced querying: Combine vector similarity search with traditional SQL queries for powerful hybrid searches.
7. Real-time updates: Continuously update and query vector data without complex ETL processes.
`,
    icon: ChartScatter,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: 'https://www.youtube-nocookie.com/embed/ibzlEQmgPPY',
    docsUrl: 'https://supabase.com/docs/guides/ai',
    slug: 'vector-database',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Auto-generated REST API via PostgREST',
    subtitle: 'RESTful APIs auto-generated from your database.',
    description: `
Supabase automatically generates a comprehensive RESTful API from your database schema, powered by PostgREST. This feature dramatically accelerates development by eliminating the need to write boilerplate server-side code for basic CRUD operations.

## Key benefits
1. Rapid development: Instantly access your data through a RESTful API without writing any backend code.
2. Automatic updates: API endpoints automatically reflect changes in your database schema, ensuring consistency.
3. Flexible querying: Use powerful query parameters to filter, sort, and paginate data directly from API calls.
4. Custom operations: Easily expose custom database functions as API endpoints for complex operations.
5. Secure by default: Leverage Postgres's role-based access control for built-in API security.
6. Performance: Benefit from PostgREST's optimized query execution for efficient API responses.
7. Standardized interface: Work with a well-documented, consistent API across all your database tables.
`,
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/auto-generated-rest-api.png',
    heroImageLight: '/images/features/auto-generated-rest-api-light.png',
    docsUrl: 'https://supabase.com/docs/guides/api#rest-api-overview',
    slug: 'auto-generated-rest-api',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Auto-generated GraphQL API via pg_graphql',
    subtitle: 'Fast GraphQL APIs using our custom Postgres GraphQL extension.',
    description: `
Supabase offers lightning-fast GraphQL APIs through its custom-built Postgres GraphQL extension, _pg_graphql_.

## Key benefits
1. Simplified data fetching: Retrieve exactly the data you need in a single request, reducing over-fetching and under-fetching.
2. Automatic schema generation: GraphQL schema is automatically derived from your Postgres schema, ensuring consistency.
3. Real-time updates: Combine with Supabase's real-time features for live data subscriptions.
4. Improved performance: Leverage Postgres's query optimization capabilities for efficient GraphQL resolvers.
5. Type safety: Benefit from GraphQL's strong typing system, reducing runtime errors and improving developer experience.
6. Flexible querying: Allow clients to request complex, nested data structures in a single query.
7. Built-in documentation: Utilize GraphQL's introspection feature for self-documenting APIs.

## The auto-generated GraphQL API is particularly beneficial for:
- Single-page applications (SPAs) requiring efficient data loading
- Mobile apps needing to minimize data transfer
- Complex UIs with varying data requirements
- Projects requiring rapid iteration on data models
- Applications with deeply nested data structures
`,
    icon: Braces,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/auto-generated-graphql-api.png',
    heroImageLight: '/images/features/auto-generated-graphql-api-light.png',
    docsUrl: 'https://supabase.com/docs/guides/graphql/api',
    slug: 'auto-generated-graphql-api',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Database backups',
    subtitle: 'Projects are backed up daily with Point in Time recovery options.',
    description: `
Supabase offers comprehensive database backup solutions to protect your data and ensure business continuity. These include daily backups and Point-in-Time Recovery (PITR), providing robust safeguards against various disaster scenarios.

## Key features
1. Daily backups: Automatically created for all Pro, Team, and Enterprise plans.
   - Pro: 7 days retention
   - Team: 14 days retention
   - Enterprise: Up to 30 days retention
2. Point-in-Time Recovery (PITR): Available as an add-on for finer granularity.
   - Allows restoration to any point within seconds
   - Achieves a Recovery Point Objective (RPO) of two minutes in worst-case scenarios
3. Backup types:
   - Logical backups: Used for smaller databases (0-15GB)
   - Physical backups: Used for larger databases (>15GB) and projects with PITR or read replicas
4. Flexible restoration options: Restore to a specific daily backup or a precise moment with PITR.
5. Automated process: Backups are managed and monitored by the Supabase team.

## Database backups are crucial for:
- Protecting against accidental data loss or corruption
- Recovering from infrastructure failures
- Meeting regulatory compliance requirements
- Facilitating data migration or cloning for development

Supabase's backup solutions provide a balance of security, flexibility, and ease of use, ensuring your data remains protected and recoverable as your project grows.
`,
    icon: DatabaseBackup,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/backups.png',
    heroImageLight: '/images/features/backups-light.png',
    docsUrl: 'https://supabase.com/docs/guides/platform/backups',
    slug: 'database-backups',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
      selfHostedTooling: {
        label: 'wal-g',
        link: 'https://github.com/wal-g/wal-g',
      },
    },
  },
  {
    title: 'Custom domains',
    subtitle: 'White-label the Supabase APIs for a branded experience.',
    description: `
Supabase's custom domain feature allows you to use your own domain for Supabase services, enhancing your application's branding and professionalism. Available as an add-on for paid plans, this feature offers two options: custom domains and vanity subdomains.

## Benefits:
- Branded experience for OAuth consent screens and API endpoints
- Improved portability between Supabase projects
- Consistent domain usage across development, staging, and production

## Custom domains are particularly useful for:
- Applications using Supabase Auth with OAuth
- APIs for third-party integrations or webhooks
- Long-term API versioning and management

By using custom domains, you create a more cohesive brand experience and gain flexibility in managing your application's infrastructure.
`,
    icon: Globe,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/custom-domains.png',
    heroImageLight: '/images/features/custom-domains-light.png',
    docsUrl: 'https://supabase.com/docs/guides/platform/custom-domains',
    slug: 'custom-domains',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Network restrictions',
    subtitle: 'Restrict IP ranges that can connect to your database.',
    description: `
Supabase's Network Restrictions feature allows you to control which IP addresses or ranges can access your database, enhancing your application's security and helping you meet compliance requirements.

## Key features
1. IP-based access control: Limit database connections to specific IPv4 and IPv6 ranges.
2. Flexible configuration: Easily manage restrictions via Dashboard or CLI.
3. Environment-specific rules: Set different access policies for development, staging, and production.
4. Pre-authentication barrier: Restrictions are enforced before database credential checks.

## Benefits:
- Enhanced security: Reduce the attack surface by limiting access to trusted IP addresses.
- Compliance support: Meet regulatory requirements for data access control in various industries.
- Granular control: Tailor access rules to your specific network infrastructure needs.
- Additional protection layer: Mitigate risks even if database credentials are compromised.

## Network Restrictions are particularly valuable for:
- Enterprise applications handling sensitive data
- Financial services and healthcare systems with strict compliance requirements
- Government and public sector projects needing stringent security measures
- Multi-tenant SaaS platforms isolating client data access

By implementing Network Restrictions, you create a more secure environment for your data, demonstrating a commitment to protection that builds trust with users and stakeholders. This feature provides a crucial first line of defense against unauthorized access attempts, complementing other security measures like strong authentication and encryption.
`,
    icon: UserX,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/network-restrictions.png',
    heroImageLight: '/images/features/network-restrictions-light.png',
    docsUrl: 'https://supabase.com/docs/guides/platform/network-restrictions',
    slug: 'network-restrictions',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'SSL enforcement',
    subtitle: 'Enforce secure connections to your Postgres clients.',
    description: `
Supabase's Postgres SSL Enforcement feature allows you to mandate SSL connections to your database, enhancing security by encrypting data in transit and protecting against potential attacks.

## Key features
1. Optional enforcement: Enable or disable SSL requirements to balance security and client compatibility.
2. Comprehensive protection: Applies to both direct Postgres and connection pooler (Supavisor) connections.
3. Flexible configuration: Manage settings via Dashboard or CLI.
4. Support for various SSL modes: Including the highly secure 'verify-full' mode.

## Benefits:
- Data encryption: Protect all information transmitted between your application and the database.
- Integrity assurance: Prevent data tampering during transmission.
- Authentication: Ensure connections are made to the genuine database server.
- Compliance support: Meet industry standards and regulatory requirements for data protection.
- Simplified security: Automatically enforce best practices for secure database connections.

## SSL Enforcement is particularly valuable for:
- Applications handling sensitive user data
- Financial services requiring secure transactions
- Healthcare applications managing patient information
- E-commerce platforms processing payment data
- Any application prioritizing data privacy and integrity

By enabling SSL Enforcement, you implement a fundamental best practice in data protection. This feature ensures that every interaction with your database is encrypted and secure, whether from application servers, admin tools, or API calls.
`,
    icon: ShieldCheck,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/ssl-enforcement.png',
    heroImageLight: '/images/features/ssl-enforcement-light.png',
    docsUrl: 'https://supabase.com/docs/guides/platform/ssl-enforcement',
    slug: 'ssl-enforcement',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Branching',
    subtitle: 'Test and preview changes using Supabase Branches.',
    description: `
Supabase Branching allows you to create and test changes in separate, temporary environments without affecting your production setup. Branching 2.0 (currently in public alpha) removes the Git requirement—spin up branches directly from the dashboard, CLI, or Management API, with or without GitHub integration.

## Key features
1. No-Git workflows: Create branches directly from dashboard or CLI without requiring GitHub connection.
2. Git-based workflow: Optionally integrate with GitHub, creating preview branches for each pull request.
3. Isolated environments: Each branch has its own Supabase instance with separate API credentials.
4. Automatic migrations: Runs new migrations when changes are pushed to the ./supabase/migrations directory.
5. Data seeding: Preview branches can be seeded with sample data using ./supabase/seed.sql.
6. CI/CD integration: Supports preview deployments with hosting providers like Vercel.
7. Merge requests: Review schema diffs and merge changes directly in the dashboard.

## Benefits:
- Risk-free experimentation: Test changes without affecting the production environment.
- Improved collaboration: Multiple team members can work on different features simultaneously.
- Streamlined reviews: Facilitate thorough checks of database changes before merging.
- Rapid iteration: Quickly prototype and validate database-driven features.
- Flexible workflows: Use Git integration, dashboard creation, or combine both approaches.

## Supabase Branching is valuable for:
- Agile teams working on multiple features concurrently
- Projects with complex database schemas requiring careful management
- Applications undergoing significant refactoring or upgrades
- CI/CD pipelines integrating database changes
- Teams preferring no-code or database-first development workflows
`,
    icon: GitBranch,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/branching.png',
    heroImageLight: '/images/features/branching-light.png',
    docsUrl: 'https://supabase.com/docs/guides/platform/branching',
    slug: 'branching',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Terraform provider',
    subtitle: 'Manage Supabase infrastructure via Terraform.',
    description: `
The Supabase Terraform provider enables developers and DevOps teams to manage their Supabase infrastructure as code. This integration brings the benefits of Infrastructure as Code (IaC) to your database and backend services, allowing for version-controlled, reproducible, and scalable management of Supabase resources.

## Key features
1. Resource management: Define and control database resources, authentication settings, storage buckets, and API configurations.
2. Project-level control: Manage project settings and configurations through code.
3. Integration with existing workflows: Seamlessly incorporate Supabase management into your existing Terraform setups.
4. Import capability: Easily import existing Supabase projects into your Terraform state.

## Benefits:
- Version control: Track and manage infrastructure changes alongside application code.
- Reproducibility: Easily recreate entire environments for development, staging, and production.
- Automated provisioning: Streamline the setup of new projects or environments.
- Consistency: Ensure uniformity across all environments, reducing configuration discrepancies.
- Scalability: Effortlessly manage multiple Supabase projects across various teams or clients.
- Collaboration: Improve team coordination by reviewing infrastructure changes through pull requests.

## The Terraform provider is particularly valuable for:
- Enterprise-level projects requiring strict infrastructure governance
- DevOps teams implementing continuous deployment pipelines
- Multi-environment setups (development, staging, production)
- Agencies or consultancies managing multiple client projects
- Open-source projects aiming for easy contributor onboarding

By adopting the Supabase Terraform provider, teams can implement GitOps practices, automate environment creation, easily roll back changes, and audit infrastructure modifications over time. This approach leads to more reliable, maintainable, and scalable backend infrastructures, ultimately accelerating development cycles and improving overall product quality.
`,
    icon: Package,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/terraform-provider.png',
    heroImageLight: '/images/features/terraform-provider-light.png',
    docsUrl: 'https://supabase.com/docs/guides/deployment/terraform',
    slug: 'terraform-provider',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Read replicas',
    subtitle: 'Isolate heavy workloads and reduce global latency',
    description: `
Supabase Read Replicas distribute read traffic across multiple databases. Use them to isolate analytics workloads from production, reduce latency for global users or scale read capacity beyond a single database.

## Key features

1. Workload Isolation: Run heavy read queries (analytics, reports, exports, batch jobs) on dedicated replicas without impacting production response times.
2. Multi-region deployment: Deploy replicas in regions closer to your users. European users query European databases.
3. Dedicated endpoints: Each replica provides separate database and API connection strings for direct access.
4. Automatic routing: API load balancer routes GET requests to the nearest available replica.
5. Centralized configuration: Settings are propagated across all databases in a project.
6. Monitoring tools: Track replication lag and resource usage directly in the Supabase Dashboard.

## When to use Read Replicas

- Your analytics team's reports slow down production (workload isolation)
- Users in Europe or Asia experience 100-150ms latency (geo-distribution)
- You've reached 16XL and need more read capacity (horizontal scaling)
- Your workload is 80%+ reads and needs to scale independently of writes

## Get Started

Deploy your first Read Replica in minutes from Project Settings > Infrastructure. Choose a region—same region for analytics isolation, different region for geo-distribution. Select a compute size to match your workload.

[Read blog post](https://supabase.com/blog/read-replicas-vs-bigger-compute)
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: 'https://www.youtube-nocookie.com/embed/PX3R1fXjJ2M',
    docsUrl: 'https://supabase.com/docs/guides/platform/read-replicas',
    slug: 'read-replicas',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Postgres Extensions',
    subtitle: 'Enhance your database with popular Postgres extensions.',
    description: `
Supabase supports a wide array of Postgres extensions, allowing you to enhance your database with additional functionalities. These extensions enable you to tailor your database to specific needs, from geospatial data to full-text search and advanced analytics.

## Key features
1. Pre-installed extensions: Supabase comes with over 50 pre-configured extensions.
2. Easy management: Enable or disable extensions via the dashboard or SQL commands.
3. Flexible installation: Install custom SQL extensions using Supabase's SQL editor.
4. Automatic upgrades: Access new extension versions through infrastructure upgrades.
5. Schema control: Most extensions are installed under the extensions schema.

## Benefits:
- Enhanced functionality: Add specialized features to your database without changing your application architecture.
- Optimized performance: Leverage extensions for efficient data processing and querying.
- Flexibility: Choose from a vast ecosystem of extensions to meet your project requirements.
- Easy integration: Incorporate powerful features into your existing database structure.
- Cost-effective solutions: Implement complex features without separate, specialized databases.

Popular Postgres extensions supported by Supabase include:
- PostGIS: For working with geospatial data
- pgvector: Enables efficient similarity search and machine learning operations
- pgcrypto: Provides cryptographic functions
- pgjwt: Allows for JSON Web Token (JWT) generation and verification
- pg_net: Enables making HTTP requests from the database
- pgroonga: Provides full-text search capabilities for various languages

Postgres extensions are valuable for a wide range of applications, from GIS and machine learning projects to security-focused applications and IoT systems dealing with time-series data.

By leveraging these extensions, you can implement complex features more easily, reduce the need for external services, and tailor your database to specific project requirements.
`,
    icon: Puzzle,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/postgres-extensions.png',
    heroImageLight: '/images/features/postgres-extensions-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions',
    slug: 'postgres-extensions',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Dedicated Poolers',
    subtitle: 'Co-located connection pooler for maximum performance.',
    description: `Every project on Micro Compute and above includes a dedicated PgBouncer instance co-located with your database. Dedicated Poolers work alongside Supavisor as an alternative connection pooling option, providing IPv4 compatibility and prepared statement support.

## Key benefits
1. IPv4 compatibility: Unlike Supavisor's transaction mode, Dedicated Poolers support IPv4 connections.
2. Prepared statements: Full support for prepared statements, not available in Supavisor transaction mode.
3. Flexible pooler selection: Swap between Supavisor and PgBouncer pooler types based on your needs.
4. Independent connection limits: Each pooler has its own client connection limits.
5. Shared pool sizing: Both poolers share the same pool size setting but operate independently.
6. Maximum performance: Co-located with your database for minimal latency.

## Dedicated Poolers are valuable for:
- Applications requiring IPv4 compatibility
- Workloads using prepared statements
- Projects needing dedicated connection pooling resources
- High-performance applications requiring co-located infrastructure

Dedicated Poolers provide an alternative to Supavisor for specific use cases, giving you maximum flexibility in how you manage database connections.`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/connecting-to-postgres#serverside-poolers',
    slug: 'dedicated-poolers',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Foreign Data Wrappers',
    subtitle: 'Query external data sources as Postgres tables.',
    description: `Foreign Data Wrappers allow you to query external data sources—databases, APIs, services—as if they were native Postgres tables. Built on Supabase's open-source Wrappers framework written in Rust, this feature transforms how you integrate external data into your application.

## Key benefits
1. Query external data as tables: Access Stripe, Firebase, ClickHouse, BigQuery, Airtable, S3, and more using SQL.
2. No data movement: Data remains in the remote server, eliminating ETL overhead.
3. WebAssembly support: Easier FDW development with Wasm compatibility.
4. SQL-native: Just SQL—no new tools to learn.
5. On-demand data: Always up-to-date without scheduled syncs.
6. Cost savings: Less infrastructure to manage compared to traditional ETL tools.

## Security considerations
Foreign Data Wrappers should be stored in private schemas and do not provide Row Level Security. Use Database Functions with security definer if you need to expose data publicly.

## Foreign Data Wrappers are valuable for:
- Integrating payment data from Stripe
- Syncing data from Firebase or other databases
- Querying analytics data from BigQuery or ClickHouse
- Accessing files from S3
- Any scenario requiring real-time external data access

Foreign Data Wrappers simplify data integration by bringing external data into your Postgres environment without complex ETL pipelines.`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/overview',
    slug: 'foreign-data-wrappers',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Supabase ETL',
    subtitle: 'Real-time data replication to analytical destinations.',
    description: `Supabase ETL is a change-data-capture pipeline built in Rust that replicates your Postgres tables to analytical destinations in near real-time. Reading directly from the Postgres Write Ahead Log, ETL ensures your analytics data stays synchronized with your production database.

## Key benefits
1. Real-time replication: Near real-time data synchronization using Postgres logical replication.
2. Analytics Buckets support: Replicate to Iceberg format for large-scale analytics.
3. BigQuery integration: Direct replication to Google's data warehouse.
4. Complete change history: Captures INSERT, UPDATE, DELETE, and TRUNCATE operations.
5. Optimized for analytics: Faster queries and lower storage costs through compression.
6. Production isolation: Complete separation of analytics and production workloads.

## How it works
ETL uses Postgres logical replication to capture changes. Each replicated table includes a \`cdc_operation\` column tracking the type of change. For Analytics Buckets, data is stored in append-only changelog format using Parquet files. For BigQuery, a view is created for each table backed by versioned tables.

## Supabase ETL is valuable for:
- Data warehousing and business intelligence
- Historical analysis and audit trails
- Large-scale analytics requiring separation from production
- Compliance scenarios requiring complete data history

## Limitations
Tables require primary keys. DDL support (schema changes) is currently in development.

Supabase ETL provides a powerful alternative to Read Replicas for analytics workloads, optimizing performance while reducing costs.`,
    icon: CloudCog,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.github.io/etl/',
    slug: 'supabase-etl',
    status: {
      stage: PRODUCT_STAGES.PRIVATE_ALPHA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Database Webhooks',
    subtitle: 'Trigger external payloads on database events.',
    description: `
Database Webhooks allow you to send real-time data from your database to another system whenever a table event occurs. You can hook into three table events: INSERT, UPDATE, and DELETE, with all events fired after a database row is changed. This feature provides a convenient way to integrate your Supabase database with external applications and services.

## Key benefits
1. Real-time data transfer: Automatically send data to external systems in response to database changes, ensuring timely updates.
2. Flexibility: Configure webhooks for specific tables and events, allowing for tailored integrations based on your application's needs.
3. Asynchronous processing: Built on the pg_net extension, webhooks operate asynchronously, preventing long-running network requests from blocking database operations.
4. Easy setup: Create webhooks directly from the Supabase Dashboard or through SQL statements, making integration straightforward.
5. Payload customization: Automatically generated payloads provide relevant data about the event, including the new and old record states.

This feature is particularly useful for developers looking to automate workflows and integrate their databases with third-party services like payment processors or notification systems.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/database-webhooks.png',
    heroImageLight: '/images/features/database-webhooks-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/webhooks',
    slug: 'database-webhooks',
    status: {
      stage: PRODUCT_STAGES.BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Vault',
    subtitle: 'Manage secrets safely in Postgres.',
    description: `
Vault is a Postgres extension and accompanying Supabase UI that simplifies the secure storage of encrypted secrets and other sensitive data in your database. This feature allows developers to utilize Postgres in innovative ways beyond its standard capabilities.

## Key benefits:
1. Secure storage: Secrets are stored on disk in an encrypted format, ensuring they remain protected even in backups or replication streams.
2. Easy management: The Supabase dashboard UI makes it simple to store and manage secrets, including environment variables and API keys.
3. Flexible encryption: Users can create custom encryption keys for different purposes, enhancing data security.
4. Seamless access: Secrets can be accessed from SQL as easily as querying a table, facilitating their use in Postgres Functions, Triggers, and Webhooks.
5. Robust security features: The Vault employs authenticated encryption to ensure that secrets cannot be forged or decrypted without proper authorization.

This feature is particularly useful for teams looking to enhance their security posture by managing sensitive data directly within their database environment.
`,
    icon: Lock,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://supabase.com/docs/img/guides/database/vault-hello-compressed.mp4',
    docsUrl: 'https://supabase.com/docs/guides/database/vault',
    slug: 'vault',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Supavisor',
    subtitle: 'A scalable connection pooler for Postgres.',
    description: `
Supavisor is a cloud-native connection pooler designed for Postgres, built to handle millions of connections efficiently. It was developed in Elixir and integrates advanced features such as query load balancing, named prepared statement support, and query cancellation. Supavisor enhances the performance of Postgres by managing connections effectively, ensuring that applications can scale seamlessly under heavy loads.

## Key benefits:
1. Scalable Architecture: Supports high concurrency and rapid I/O, making it suitable for applications with significant connection demands.
2. Query Load Balancing: Automatically distributes read requests across primary and replica servers to optimize performance.
3. Named Prepared Statements: Allows clients to reuse query plans across connections, improving efficiency and reducing overhead.
4. Query Cancellation: Provides the ability to cancel long-running queries easily, enhancing user experience during database interactions.
5. Easy Integration: New Supabase projects come with a Supavisor connection string by default, simplifying setup for developers.

This feature is particularly valuable for teams looking to optimize their database interactions and ensure robust performance as their applications scale.
`,
    icon: Zap,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://www.youtube-nocookie.com/embed/ogYNmJOFEpk',
    docsUrl: 'https://supabase.com/blog/supavisor-postgres-connection-pooler',
    slug: 'supavisor',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_BETA,
      availableOnSelfHosted: true,
    },
  },
  // Realtime
  {
    title: 'Realtime - Postgres changes',
    subtitle: 'Receive your database changes through websockets.',
    description: `
Supabase's Realtime Postgres Changes feature allows you to listen to database changes in real-time using the Realtime system. This capability enables you to build responsive, live-updating applications that reflect database changes instantly.

## Key features
1. Event-based listening: Subscribe to INSERT, UPDATE, DELETE, or all (*) events.
2. Schema and table targeting: Listen to changes in specific schemas or tables.
3. Granular filtering: Apply filters to receive only relevant changes.
4. Multiple subscriptions: Listen to different combinations of events, schemas, and tables in a single channel.
5. Row-level security integration: Respect database permissions when broadcasting changes.

## Benefits:
- Real-time updates: Receive instant notifications when data changes, enabling live-updating UIs.
- Efficient data syncing: Keep client-side data in sync with the database without constant API calls.
- Flexible subscriptions: Tailor your subscriptions to specific events, schemas, tables, or conditions.
- Improved user experience: Provide users with up-to-date information without page refreshes.
- Simplified architecture: Implement real-time features without separate messaging systems.

## Postgres Changes are valuable for:
- Collaborative applications where multiple users work on shared data
- Real-time dashboards and analytics platforms
- Live chat and messaging systems
- Applications requiring instant updates based on database changes

Supabase's Realtime Postgres Changes feature provides a powerful tool for creating responsive, real-time applications while leveraging the full capabilities of your Postgres database.
`,
    icon: DatabaseZap,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: 'https://www.youtube-nocookie.com/embed/2rUjcmgZDwQ',
    docsUrl: 'https://supabase.com/docs/guides/realtime/postgres-changes',
    slug: 'realtime-postgres-changes',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Realtime - Broadcast',
    subtitle: 'Send messages between connected users through websockets.',
    description: `
Supabase's Realtime Broadcast feature enables real-time communication between connected clients using the Realtime system. This functionality allows you to build interactive, collaborative applications where users can instantly share messages or data in real-time.

## Key features
1. Channel-based messaging: Send and receive messages within specific channels or rooms.
2. Event filtering: Subscribe to specific event types for targeted message handling.
3. Flexible payload: Transmit various types of data in the message payload.
4. Self-send option: Configure channels to receive messages sent by the sender.
5. Message acknowledgment: Confirm message receipt by the Realtime server.
6. REST API support: Send broadcast messages without an established WebSocket connection.

## Benefits:
- Instant communication: Enable real-time messaging and data sharing between users.
- Low latency: Achieve near-instantaneous data transmission for time-sensitive applications.
- Flexible implementation: Use WebSocket connections or REST API calls to send messages.
- Simplified architecture: Build real-time features without managing complex messaging infrastructure.
- Enhanced user engagement: Create interactive, collaborative experiences that keep users connected.

## Realtime Broadcast is particularly valuable for:
- Chat applications and messaging platforms
- Collaborative tools like shared documents or whiteboards
- Multiplayer games requiring real-time state synchronization
- Live auction or bidding systems
- Real-time commenting systems for blogs or social media platforms
- Interactive presentations or educational platforms

Supabase's Realtime Broadcast feature provides a powerful tool for creating responsive, real-time applications with minimal setup and infrastructure management.
`,
    icon: MessageCircle,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: 'https://www.youtube-nocookie.com/embed/BelYEMJ2N00',
    docsUrl: 'https://supabase.com/docs/guides/realtime/broadcast',
    slug: 'realtime-broadcast',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Realtime - Presence',
    subtitle: 'Synchronize shared state between users through websockets.',
    description: `
Supabase's Realtime Presence feature allows you to track and synchronize shared state between connected users in real-time. This capability enables you to build collaborative applications where users can see each other's status, actions, or any custom state information instantly.

## Key features
1. Real-time state synchronization: Track and update shared state across multiple clients.
2. Event-based tracking: Listen to 'sync', 'join', and 'leave' events for state changes.
3. Custom state definition: Share any type of state information between users.
4. Unique client identification: Use auto-generated or custom keys to identify clients.
5. Channel-based organization: Group users and their states into specific channels or rooms.
6. Easy state management: Track, untrack, and update state with simple method calls.

## Benefits:
- Real-time user tracking: Monitor which users are currently active or online.
- Enhanced interactivity: Create more engaging, collaborative user experiences.
- Reduced complexity: Implement shared state features without building custom synchronization logic.
- Flexible use cases: Adapt the feature for various applications, from simple online indicators to complex collaborative tools.

## Realtime Presence is particularly valuable for:
- Collaborative document editing platforms
- Multiplayer games showing player positions or status
- Team collaboration tools with user availability indicators
- Live streaming platforms displaying viewer counts and engagement
- Project management applications with real-time task assignments
- Social media platforms showing active users in a group or chat

Supabase's Realtime Presence feature provides a powerful tool for creating interactive, real-time applications that require shared state management, allowing developers to focus on creating unique and valuable user experiences.
`,
    icon: Users,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: 'https://www.youtube-nocookie.com/embed/BelYEMJ2N00',
    docsUrl: 'https://supabase.com/docs/guides/realtime/presence',
    slug: 'realtime-presence',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Realtime - Broadcast Authorization',
    subtitle: 'Control access to broadcast channels in real-time.',
    description: `
The Realtime Broadcast Authorization feature allows you to manage access permissions for broadcast channels in your application. This functionality ensures that only authorized users can listen to specific channels, enhancing security and control over real-time data streams.

Key benefits:
1. Secure access control: Implement fine-grained access control over who can receive broadcast messages in real-time.
2. Customizable permissions: Define specific authorization rules based on user roles or attributes.
3. Enhanced user experience: Ensure that users only receive relevant updates based on their permissions.
4. Easy integration with existing systems: Seamlessly integrate broadcast authorization into your current application architecture.
5. Comprehensive documentation available: Access detailed guides on how to implement broadcast authorization effectively.

This feature is particularly valuable for applications that require controlled access to live data streams, such as chat applications or collaborative tools.
`,
    icon: Shield,
    products: [PRODUCT_SHORTNAMES.REALTIME, PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: 'https://www.youtube-nocookie.com/embed/IXRrU9MpA8Q',
    docsUrl: 'https://supabase.com/docs/guides/realtime/authorization#broadcast',
    slug: 'realtime-broadcast-authorization',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Realtime - Presence Authorization',
    subtitle: 'Manage presence information securely in real-time.',
    description: `
The Realtime Presence Authorization feature enables you to control access permissions related to presence information in your application. This allows you to manage who can see the online status of other users in real-time, enhancing privacy and security within collaborative environments.

Key benefits:
1. Controlled Visibility of Presence Data: Ensure that only authorized users can view the online status of others, protecting user privacy.
2. Customizable Presence Rules: Define specific rules based on user roles or attributes for who can see presence information.
3. Improved User Experience: Enhance collaboration by providing relevant presence information while maintaining security protocols.
4. Seamless Integration: Easily incorporate presence authorization into existing systems without significant overhead.
5. Detailed Implementation Guides: Access comprehensive documentation on how to implement presence authorization effectively.

This feature is particularly useful for collaborative applications where knowing the online status of team members is crucial while ensuring privacy and security are maintained.`,
    icon: Eye,
    products: [PRODUCT_SHORTNAMES.REALTIME, PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: 'https://www.youtube-nocookie.com/embed/IXRrU9MpA8Q',
    docsUrl: 'https://supabase.com/docs/guides/realtime/authorization#presence',
    slug: 'realtime-presence-authorization',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Realtime - Broadcast from the Database',
    subtitle: 'Trigger broadcast messages directly from Postgres.',
    description: `Broadcast from Database allows you to trigger Realtime broadcast messages directly from your database using Postgres triggers. Messages are read from the WAL and stored in the realtime.message table, automatically deleted after 3 days.

## Key benefits
1. Database-native broadcasting: Trigger broadcasts using Postgres functions and triggers.
2. WAL-based delivery: Reads from the Write Append Log for reliable message delivery.
3. Topic-based routing: Define topic patterns to send messages to specific channels.
4. RLS integration: Messages tested against Row Level Security policies before sending.
5. Format compatibility: Use realtime.broadcast_changes for Postgres Changes-compatible format.

## How it works
Create a trigger function using realtime.broadcast_change, set up triggers on your tables for INSERT/UPDATE/DELETE, and define topic patterns. Clients subscribe to specific topics to receive events in real-time.

## Broadcast from Database is valuable for:
- Notifying users of changes to specific records
- Real-time collaborative features
- Activity feeds and live notifications
- Database-driven real-time updates

## Security
Supabase Admin role connects to the database and tests messages against RLS policies. Transactions are rolled back after authorization checks.

Broadcast from Database provides a powerful way to trigger real-time events directly from your database logic.`,
    icon: DatabaseZap,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/broadcast#broadcast-from-database',
    slug: 'realtime-broadcast-from-database',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Realtime - Broadcast Replay',
    subtitle: 'Access previously sent messages in private channels.',
    description: `Broadcast Replay enables private channels to access messages sent earlier, perfect for catching up on missed messages when reconnecting or loading recent history.

## Key benefits
1. Catch up on missed messages: Retrieve messages sent while disconnected.
2. Load recent history: Display recent chat messages or activity when joining a channel.
3. Flexible retrieval: Specify timestamp and limit for precise message fetching.
4. Private channel only: Works exclusively with private channels for security.

## Configuration
Requires \`since\` parameter (epoch timestamp in milliseconds) for earliest message retrieval. Optional \`limit\` parameter (max 25, positive integer) controls the number of messages returned.

## Broadcast Replay is valuable for:
- Chat applications loading recent message history
- Collaborative tools syncing state after network interruption
- Real-time dashboards catching up on missed updates
- Applications requiring recent activity display

## Limitations
Only available for messages published via Broadcast from Database. Only works in private channels. Available in JavaScript client version 2.37.0 and later.

Broadcast Replay ensures users never miss important real-time updates, even when temporarily disconnected.`,
    icon: MessageCircle,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/broadcast#broadcast-replay',
    slug: 'realtime-broadcast-replay',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: true,
    },
  },
  // Auth
  {
    title: 'Email login',
    subtitle: 'Build email logins for your application or website.',
    description: `
Supabase's Email Login feature enables secure email-based authentication for your applications, allowing users to create accounts and sign in using their email addresses.

## Key features
1. Email signup and signin: Implement user registration and login with email and password.
2. Email verification: Option to require email confirmation before account activation.
3. Password reset flow: Built-in functionality for secure password resets.
4. Customizable redirect URLs: Specify where users are directed after email confirmation.
5. Flexible implementation: Support for both implicit and PKCE authentication flows.
6. SMTP integration: Use Supabase's email service or configure a custom SMTP server.

## Benefits:
- Secure authentication: Implement industry-standard security practices.
- Customizable workflows: Tailor the signup and login processes to your needs.
- Seamless integration: Works with Supabase's other auth providers and features.
- Local development support: Test email flows using built-in tools like Mailpit.

## Email login is valuable for:
- SaaS applications requiring user accounts
- E-commerce platforms with customer profiles
- Community websites and forums
- Enterprise applications with employee logins

Supabase's Email Login provides a robust foundation for user authentication, allowing you to focus on building your core application features while ensuring secure account management.
`,
    icon: Mail,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '/images/features/email-login.png',
    heroImageLight: '/images/features/email-login-light.png',
    docsUrl: 'https://supabase.com/docs/guides/auth/passwords',
    slug: 'email-login',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Social login',
    subtitle: 'Provide social logins from platforms like Apple, GitHub, and Slack.',
    description: `
Supabase's Social Login feature enables users to authenticate using their existing accounts from popular social platforms and services, providing a streamlined, password-free access to your application.

## Key features
1. Multiple provider support: Integrate with various platforms like Google, Facebook, Twitter, and more.
2. OAuth standard: Implement secure authentication using the open OAuth standard.
3. Provider tokens: Access provider tokens for additional API calls to the OAuth provider.
4. Customizable setup: Configure each social provider according to your needs.
5. User data access: Retrieve additional user information (with permission) from social providers.

## Benefits:
- Simplified onboarding: Reduce friction in the signup process, potentially increasing conversion rates.
- Improved user experience: Offer quick, familiar login options to users.
- Enhanced security: Leverage the robust security measures of established platforms.
- Rich user profiles: Access additional user data to personalize experiences.

## Social login is valuable for:
- Mobile apps seeking to minimize user input
- E-commerce platforms aiming to reduce cart abandonment
- Content platforms looking to personalize user experiences
- Community-driven websites fostering user engagement
- B2B applications integrating with professional networks

Supabase's Social Login feature allows you to improve user experience and potentially increase signup rates while maintaining security and control over user authentication.
`,
    icon: Users,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '/images/features/social-login.png',
    heroImageLight: '/images/features/social-login-light.png',
    docsUrl: 'https://supabase.com/docs/guides/auth/social-login',
    slug: 'social-login',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Phone logins',
    subtitle: 'Provide phone logins using a third-party SMS provider.',
    description: `
Supabase's Phone Login feature allows users to authenticate using their phone numbers, providing a password-free login experience with SMS verification.

## Key features
1. OTP-based authentication: Users sign in with a one-time code sent via SMS.
2. Phone number updates: Allow logged-in users to change their associated phone number.
3. Customizable settings: Configure rate limits and OTP expiration times.
4. Multiple SMS provider support: Integrate with various SMS services like MessageBird, Twilio, and Vonage.
5. Native Mobile Login support: Utilize built-in identity providers for Android and iOS.

## Benefits:
- Simplified authentication: Users can sign up and log in using just their phone number.
- Enhanced security: Implement two-factor authentication (2FA) using SMS verification codes.
- Reduced friction: Eliminate the need for users to remember passwords.
- Verified user base: Ensure each account is associated with a unique, verifiable phone number.

## Phone login is valuable for:
- Mobile apps prioritizing quick and easy onboarding
- Ride-sharing or delivery services requiring verified contact information
- Messaging platforms where phone numbers serve as user identifiers
- Applications targeting regions where phone usage exceeds email usage

Supabase's Phone Login feature enables a seamless authentication experience, particularly suited for mobile and SMS-centric applications, while providing an additional layer of security through phone number verification.
`,
    icon: Smartphone,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '/images/features/phone-login.png',
    heroImageLight: '/images/features/phone-login-light.png',
    docsUrl: 'https://supabase.com/docs/guides/auth/phone-login',
    slug: 'phone-logins',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Passwordless login via Magic Links',
    subtitle: 'Build passwordless logins via magic links for your application or website.',
    description: `
Supabase's Passwordless Login via Magic Links allows users to sign in by clicking a unique link sent to their email address, eliminating the need for traditional passwords.

## Key features
1. One-time use links: Each Magic Link is valid for a single login attempt.
2. Automatic user creation: New users can be automatically signed up (optional).
3. Customizable email templates: Modify the Magic Link email content to fit your brand.
4. Configurable settings: Adjust request limits and link expiration times.
5. Redirect URL control: Specify allowed redirect destinations after login.
6. PKCE flow support: Enhanced security for server-side rendering.

## Benefits:
- Enhanced security: Reduce risks associated with password-based vulnerabilities.
- Improved user experience: Remove the friction of remembering and entering passwords.
- Reduced support overhead: Decrease password-related support requests.
- Simplified onboarding: Lower the barrier to entry for new users.

## Passwordless login via Magic Links is valuable for:
- SaaS platforms prioritizing security and user experience
- Financial applications requiring strong authentication
- E-commerce sites aiming to reduce login friction
- Enterprise applications managing access for numerous employees
- Any application targeting users fatigued by managing multiple passwords

Supabase's Magic Links feature offers a secure and user-friendly authentication method, aligning with modern security practices while providing a frictionless login experience.
`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/auth-email-passwordless',
    slug: 'passwordless-login-via-magicklink',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'SSO with SAML',
    subtitle: 'Enterprise single sign-on using SAML protocol.',
    description: `SSO with SAML enables enterprise single sign-on using the Security Assertion Markup Language protocol. Users authenticate using their organization's identity provider—Okta, Azure AD, Google Workspace, and more.

## Key benefits
1. Enterprise authentication: Support enterprise identity providers for user authentication.
2. Centralized user management: Manage users through existing identity systems.
3. Compliance support: Meet enterprise security and compliance requirements.
4. Single sign-on: Users authenticate once across multiple applications.
5. Standard protocol: SAML is widely supported by enterprise identity providers.

## SSO with SAML is valuable for:
- Enterprise applications requiring corporate identity integration
- B2B SaaS platforms serving enterprise customers
- Applications needing centralized user management
- Compliance scenarios requiring specific authentication methods

SSO with SAML provides the enterprise-grade authentication capabilities required for serving corporate customers.`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/sso/auth-sso-saml',
    slug: 'sso-with-saml',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Third-Party Authentication',
    subtitle: 'Trust JWTs from external authentication providers.',
    description: `Third-Party Authentication allows Supabase APIs to trust JWTs issued by external authentication providers. Your existing auth system issues JWTs that Supabase verifies but doesn't create, enabling integration with Firebase Authentication, Auth0, or custom providers.

## Key benefits
1. Existing auth integration: Use your production auth system with Supabase APIs.
2. No user migration: Avoid migrating users to Supabase Auth.
3. Multi-provider support: Authenticate with multiple providers simultaneously.
4. JWT verification: Supabase verifies tokens against provider signing keys.
5. Works across Supabase: Compatible with Data APIs, Storage, and Realtime.

## Requirements
Provider must use asymmetrically signed JWTs exposed as OIDC Issuer Discovery URL. JWTs must include \`kid\` header parameter for key identification.

## Third-Party Authentication is valuable for:
- Production apps with established auth systems
- Firebase Authentication users migrating to Supabase
- Multi-provider authentication strategies
- Avoiding user migration during platform adoption

## Limitations
Supabase Auth cannot be disabled. Symmetric keys (HS256) not currently supported. 30-minute delay for key rotation updates.

Third-Party Authentication bridges your existing auth system with Supabase's backend services.`,
    icon: ShieldCheck,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/third-party/overview',
    slug: 'third-party-authentication',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Auth Hooks',
    subtitle: 'Customize authentication flows with serverless functions.',
    description: `Auth Hooks are customizable serverless functions that run at specific points in the authentication lifecycle. Implement as Postgres functions or HTTP webhooks to add custom logic to authentication flows.

## Key benefits
1. Custom JWT claims: Add roles, permissions, or metadata to access tokens.
2. Custom SMS provider: Integrate your preferred SMS service.
3. Custom email sending: Use external email services for auth emails.
4. Custom MFA verification: Implement custom multi-factor authentication flows.
5. Business logic integration: Add custom validation or processing to auth events.

## Hook types
Custom Access Token Hook modifies JWT claims before issuance. Send SMS Hook customizes SMS sending. Send Email Hook customizes email sending. MFA Verification Hook adds custom MFA verification logic.

## Auth Hooks are valuable for:
- Adding custom claims for authorization
- Integrating custom communication providers
- Implementing custom MFA flows
- Adding business logic to authentication
- Customizing auth emails and SMS messages

Auth Hooks provide the flexibility to customize authentication while leveraging Supabase Auth's foundation.`,
    icon: Puzzle,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/auth-hooks',
    slug: 'auth-hooks',
    status: {
      stage: PRODUCT_STAGES.BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'JWT Signing Keys',
    subtitle: 'Asymmetric key management for enhanced JWT security.',
    description: `JWT Signing Keys replace the legacy JWT secret with asymmetric key cryptography. Private keys sign tokens on Supabase servers, while public keys verify them anywhere—enabling local JWT verification without calling Supabase servers.

## Key benefits
1. Faster verification: Verify JWTs locally without server calls.
2. Independent rotation: Rotate each component independently.
3. Roll-back capability: Revert to previous keys if needed.
4. Better mobile support: No forced app updates for key rotation.
5. Shorter JWT expiry: Default 5-minute expiry improves security.
6. Smaller JWTs: Less redundant data in tokens.

## Key features
Asymmetric signing using RSA or Elliptic Curve. Multiple key support with Active, Standby, Previously used, and Revoked states. JWKS endpoint exposes public keys at \`https://<project-ref>.supabase.co/auth/v1/jwks\`.

## Migration
Legacy JWT secret can be imported into the new system. Gradual migration supported. Both systems can coexist during transition.

## JWT Signing Keys are valuable for:
- Applications requiring local JWT verification
- Mobile apps needing flexible key rotation
- Security-conscious applications requiring shorter token expiry
- Projects migrating from legacy JWT secrets

JWT Signing Keys provide modern, secure JWT management with the flexibility required for production applications.`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/signing-keys',
    slug: 'jwt-signing-keys',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'OAuth2.1 Server',
    subtitle: 'Turn your project into an OAuth 2.1 identity provider.',
    description: `OAuth 2.1 Server transforms your Supabase project into a complete OAuth 2.1 and OpenID Connect identity provider. Authenticate AI agents, mobile apps, third-party services, and more using your existing Supabase Auth users.

## Key benefits
1. Complete control: Build custom authorization UI for your brand.
2. AI agent authentication: LLM tools and MCP servers authenticate as existing users.
3. First-party mobile apps: Issue tokens to your own mobile and desktop apps.
4. Enterprise SSO: Provide OIDC for enterprise customer integrations.
5. Multi-service auth: Single identity provider for multiple services.
6. RLS policy enforcement: Access tokens respect Row Level Security policies.

## Flows supported
Authorization code flow with PKCE. Refresh token flow. ID tokens when \`openid\` scope requested.

## Endpoints
Authorization endpoint \`/oauth/authorize\`. Token endpoint \`/oauth/token\`. UserInfo endpoint \`/oauth/userinfo\`. JWKS endpoint \`.well-known/jwks.json\`. Discovery endpoints for OpenID and OAuth.

## OAuth 2.1 Server is valuable for:
- Authenticating AI agents and MCP servers
- Building "Login with Your App" for third parties
- First-party mobile and desktop applications
- Enterprise customer integrations
- Multi-service authentication architectures

OAuth 2.1 Server provides enterprise-grade identity provider capabilities built on your Supabase Auth foundation.`,
    icon: ShieldPlus,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/oauth-server',
    slug: 'oauth2-1-server',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Web3 Authentication',
    subtitle: 'Wallet-based authentication for Ethereum and Solana.',
    description: `Web3 Authentication enables wallet-based sign-in using Ethereum or Solana wallets. Users authenticate by signing a message with their wallet—no email or phone number required.

## Key benefits
1. Wallet-based identity: Users sign in with MetaMask, Phantom, Solflare, and other wallets.
2. EIP 4361 standard: Uses Sign-In with Ethereum standard for security.
3. Ethereum and Solana: Support for major blockchain ecosystems.
4. Message signing: Secure authentication through cryptographic signatures.
5. No personal data: No email or phone number associated with accounts.

## Security features
Application URLs must be registered in Redirect URL settings. Wallets warn if message domain doesn't match current page. Prevents replay attacks from other applications.

## Message format
Includes wallet address, timestamp, browser location, customizable statement for terms acceptance, and non-transferable security markers.

## Web3 Authentication is valuable for:
- Web3 applications and DeFi platforms
- NFT marketplaces and platforms
- Blockchain-based games
- Crypto wallets and services
- Any application requiring wallet-based identity

## Limitations
Easy to automate account creation. No personal identifying information. Some Solana wallets (Ledger) have known issues with off-chain signing.

Web3 Authentication provides the wallet-based identity infrastructure required for blockchain applications.`,
    icon: Shield,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/auth-web3',
    slug: 'web3-authentication',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Email Templates',
    subtitle: 'Customizable email templates for all authentication flows.',
    description: `Email Templates allow you to customize all authentication emails using Go Templates with HTML support. Edit via the dashboard, use custom SMTP providers, and create branded email experiences for your users.

## Key benefits
1. Complete customization: HTML emails with Go template syntax.
2. Custom SMTP support: Use your preferred email provider.
3. Multiple template types: Authentication emails and security notifications.
4. Variable support: Access user data, confirmation URLs, OTP codes, and more.
5. Conditional rendering: Use Go template logic for dynamic content.
6. Server-side verification: Custom confirmation pages with TokenHash.

## Template types
Authentication: Confirm Signup, Invite User, Magic Link, Change Email Address, Reset Password. Security Notifications: Password Changed, Email Changed, Phone Changed, Identity Linked/Unlinked, MFA Factor Enrolled/Unenrolled.

## Available variables
\`{{ .ConfirmationURL }}\`, \`{{ .Token }}\`, \`{{ .TokenHash }}\`, \`{{ .SiteURL }}\`, \`{{ .Email }}\`, \`{{ .NewEmail }}\`, \`{{ .OldEmail }}\`, \`{{ .Data }}\` for user metadata.

## Email Templates are valuable for:
- Branded authentication experiences
- Custom confirmation flows
- Security notification customization
- Integration with React Email and Resend
- Protection against email link prefetching

## Best practices
Use custom SMTP for production. Disable email tracking in providers. Use OTP for providers that prefetch links. Keep authentication emails simple and separate from marketing.

Email Templates provide complete control over your authentication email experience.`,
    icon: Mail,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/auth-email-templates',
    slug: 'email-templates',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Multi-Factor Authentication (MFA)',
    subtitle: 'Add an extra layer of security to your application with MFA.',
    description: `
Supabase's Multi-Factor Authentication (MFA) adds an extra layer of security to your application by verifying user identity through additional steps beyond the initial login.

## Key features
1. Multiple authentication methods: Support for App Authenticator (TOTP) and phone messaging.
2. Flexible enrollment: API for building custom MFA setup interfaces.
3. Challenge and Verify APIs: Securely validate user access to additional factors.
4. Authenticator Assurance Levels: JWT claims (aal1, aal2) to indicate the level of identity verification.
5. Customizable enforcement: Options to enforce MFA for all users, new users only, or opt-in basis.
6. Database integration: Row Level Security policies to enforce MFA rules at the database level.

## Benefits:
- Enhanced security: Significantly reduce the risk of unauthorized account access.
- User trust: Demonstrate a commitment to protecting user data and privacy.
- Compliance support: Meet security requirements for regulated industries.
- Flexible implementation: Customize MFA flows to suit your application's needs.

## MFA is particularly valuable for:
- Financial services and banking applications
- Healthcare platforms managing protected health information
- Enterprise applications with access to confidential business data
- E-commerce sites protecting user payment information
- Any application storing sensitive user data

Supabase's MFA feature provides a robust tool for enhancing application security, allowing developers to implement strong authentication measures tailored to their specific requirements.
`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/auth-mfa',
    slug: 'multi-factor-authentication',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Authorization via Row Level Security',
    subtitle: 'Control the data each user can access with Postgres Policies.',
    description: `
Supabase's Row Level Security (RLS) feature allows you to implement granular authorization rules directly in your Postgres database, securing your data at the row level.

## Key features
1. Policy-based access control: Create SQL rules to determine data access for each table.
2. Role-specific policies: Define different access rules for authenticated and anonymous users.
3. Flexible policy types: Implement SELECT, INSERT, UPDATE, and DELETE policies.
4. Integration with Supabase Auth: Use built-in helper functions like auth.uid() and auth.jwt() in policies.
5. Performance optimization: Utilize indexes and optimized query patterns for efficient policy execution.
6. Bypass options: Use service keys or create roles with bypassrls privilege for administrative tasks.

## Benefits:
- Enhanced data security: Control access to individual rows based on user attributes or roles.
- Simplified application logic: Reduce complex authorization checks in your application code.
- Consistency across clients: Ensure uniform access control regardless of data access method.
- Centralized policy management: Define and manage access rules directly in the database.

## RLS is particularly valuable for:
- Multi-tenant applications requiring data isolation
- Healthcare systems needing patient data privacy
- Financial platforms with strict data access controls
- Collaborative tools where users should only see their own or shared data
- Any application dealing with sensitive or personalized data

Supabase's RLS feature provides a powerful tool for implementing sophisticated access control patterns with minimal application code, enhancing security while simplifying development.
`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.DATABASE, PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: `https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/website/supabase-rls.mp4`,
    docsUrl: 'https://supabase.com/docs/guides/auth/row-level-security',
    slug: 'row-level-security',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Captcha protection',
    subtitle: 'Add Captcha to your sign-in, sign-up, and password reset forms.',
    description: `
Supabase's Captcha Protection feature allows you to integrate CAPTCHA challenges into your authentication flows, providing an additional layer of security against automated attacks and bot activities.

## Key features
1. Multiple provider support: Integration with hCaptcha and Cloudflare Turnstile.
2. Easy configuration: Enable and configure CAPTCHA through the Supabase Dashboard.
3. Flexible implementation: Support for various JavaScript frameworks and custom frontend integration.
4. Auth flow integration: Seamlessly add CAPTCHA to sign-up, sign-in, and password reset processes.
5. Token-based verification: Use CAPTCHA tokens in Supabase auth functions for enhanced security.

## Benefits:
- Bot protection: Defend against automated attacks on authentication endpoints.
- Reduced spam: Minimize fake account creation and spam submissions.
- Customizable security: Adjust CAPTCHA difficulty based on risk assessment.
- Improved security posture: Demonstrate commitment to security best practices.

## Captcha protection is valuable for:
- High-traffic websites vulnerable to automated attacks
- E-commerce platforms preventing fake account creation
- Forums and community sites reducing spam registrations
- Financial services applications adding an extra layer of security
- Any public-facing forms susceptible to bot submissions

Supabase's Captcha Protection feature provides a powerful tool for enhancing application security, helping to protect against various automated threats while maintaining a user-friendly experience.
`,
    icon: RectangleEllipsis,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '/images/features/auth-captcha-protection.png',
    heroImageLight: '/images/features/auth-captcha-protection-light.png',
    docsUrl: 'https://supabase.com/docs/guides/auth/auth-captcha',
    slug: 'auth-captcha-protection',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Server-side Auth',
    subtitle: 'Helpers for implementing user authentication in popular server-side languages.',
    description: `
Supabase's Server-side Auth feature provides tools and utilities for implementing secure user authentication in server-side environments, complementing client-side auth implementations.

## Key features
1. SSR compatibility: Fully supports Server-Side Rendering frameworks.
2. Cookie-based sessions: Store user sessions in cookies instead of local storage for enhanced security.
3. PKCE flow support: Implement the more secure PKCE authentication flow for server-side apps.
4. @supabase/ssr package: Simplified setup for Supabase client in SSR environments (currently in beta).
5. Framework integration: Easily integrate with popular SSR frameworks like Next.js and SvelteKit.

## Benefits:
- Enhanced security: Implement secure token verification and session management on the server.
- Simplified development: Use pre-built helpers to handle common auth tasks, reducing boilerplate code.
- Consistent auth experience: Maintain a unified auth approach across client and server components.
- SSR support: Enable authenticated server-side rendering for improved performance and SEO.

## Server-side Auth is valuable for:
- Server-rendered web applications requiring authenticated content
- APIs and microservices needing to verify client authenticity
- Hybrid apps combining client and server-side rendering
- Projects leveraging SSR frameworks like Next.js, Nuxt, or SvelteKit
- Applications requiring secure, programmatic access to user session data

Supabase's Server-side Auth feature allows developers to create more secure and robust applications with consistent authentication across both client and server components, adhering to security best practices while leveraging Supabase's auth system.
`,
    icon: Server,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/server-side',
    slug: 'server-side-auth',
    status: {
      stage: PRODUCT_STAGES.BETA,
      availableOnSelfHosted: true,
    },
  },
  // Storage
  {
    title: 'File storage',
    subtitle: 'Supabase Storage makes it simple to store and serve files.',
    description: `
Supabase Storage provides a scalable solution for storing and serving files in your applications, allowing easy management of user-generated content and assets within your Supabase project. Storage supports files up to 500GB on paid plans, offers S3 protocol compatibility for any S3-compatible client, and includes three specialized bucket types: File buckets for traditional storage, Analytics buckets for data warehousing, and Vector buckets for AI embeddings with similarity search.

## Key features
1. 500GB file support: Upload files up to 500GB using the new storage-specific hostname on paid plans.
2. Three bucket types: File buckets for traditional storage, Analytics buckets (Iceberg format) for data lakes, and Vector buckets for AI embeddings with similarity search.
3. S3 compatibility: Use any S3-compatible client to interact with Storage—upload with TUS, manage with S3, serve with REST API.
4. Global CDN: Serve files quickly from over 285 cities worldwide.
5. Smart CDN: Automatic cache revalidation with changes propagating globally within 60 seconds.
6. Image optimization: Resize and compress media files on the fly with automatic WebP conversion.
7. Flexible file types: Store images, videos, documents, and any other file type.
8. Access control: Implement fine-grained access using Postgres RLS policies.
9. Resumable uploads: Support for protocols like TUS for reliable file transfers.
10. Organization: Structure files into buckets and folders for efficient management.

## Benefits:
- Seamless integration: Use the same Supabase client for both database and storage operations.
- Scalability: Handle large numbers of files and high traffic loads without infrastructure management.
- Performance: Quick file serving with global CDN support and Smart CDN optimization.
- Cost-effectiveness: Pay only for the storage you use, with no upfront costs.
- Massive file support: Handle files up to 500GB with reliable multipart upload protocols.

## File storage is valuable for:
- Social media platforms storing user-uploaded media
- E-commerce sites managing product images and documents
- Content management systems handling various file types
- Collaborative tools storing shared assets
- Mobile apps needing to sync user data and media
- Data teams requiring SQL-accessible data lakes
- AI applications storing and searching vector embeddings

Supabase Storage simplifies adding robust file management to your applications, allowing you to focus on building unique features while relying on Supabase for secure, scalable file storage and serving.
`,
    icon: Folders,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '/images/features/file-storage.png',
    heroImageLight: '/images/features/file-storage-light.png',
    docsUrl: 'https://supabase.com/docs/guides/storage',
    slug: 'file-storage',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Analytics Buckets (with Iceberg)',
    subtitle: 'Large-scale analytics using Apache Iceberg format.',
    description: `Analytics Buckets provide specialized storage optimized for large-scale analytics using Apache Iceberg open table format. Built on Amazon S3 Tables, Analytics Buckets enable petabyte-scale analytics with automatic compaction and snapshot management.

## Key benefits
1. Apache Iceberg format: Open standard with Parquet files for broad tool compatibility.
2. Automatic compaction: S3 Tables merges small files automatically for optimal performance.
3. Built-in time travel: Query historical data using snapshots.
4. Schema evolution: Evolve schema over time without breaking queries.
5. Integrated with ETL: Real-time replication from Postgres via Supabase ETL.
6. Query from Postgres: Use Iceberg Foreign Data Wrapper to join with operational data.

## Query tools supported
PyIceberg, Apache Spark, DuckDB, Amazon Athena, and any tool supporting Iceberg REST Catalog API.

## Analytics Buckets are valuable for:
- Data tiering: Archive cold data from Postgres to Analytics Buckets.
- Historical analysis: Query complete change history.
- Cost optimization: S3 pricing for large datasets.
- Separation of workloads: Analytics queries don't impact production.
- Bottomless storage: Virtually unlimited capacity.

## Security
TLS 1.2+ in transit. SSE-S3 or SSE-KMS encryption at rest.

Analytics Buckets provide the scalable, cost-effective storage layer required for modern analytics workflows.`,
    icon: BarChart,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/analytics/introduction',
    slug: 'analytics-buckets-with-iceberg',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Vector Buckets',
    subtitle: 'S3-backed storage for vector embeddings with similarity search.',
    description: `Vector Buckets provide specialized S3-backed storage for vector embeddings with built-in similarity search. Store tens of millions of vectors per index with cosine, Euclidean, or L2 distance metrics.

## Key benefits
1. Massive scale: Store tens of millions of vectors per index.
2. Built-in similarity search: Query vectors using cosine, Euclidean, or L2 distance.
3. Metadata filtering: Filter search results by associated metadata.
4. Batch operations: Process up to 500 vectors per request.
5. S3 reliability: Built on S3-compatible storage infrastructure.
6. Complementary to pgvector: Use both for different use cases.

## When to use Vector Buckets vs pgvector
Use pgvector for lowest latency, core relational model vectors, transactional guarantees, and small to medium datasets. Use Vector Buckets for millions of vectors, S3-style durability, AI-heavy apps (RAG, semantic search), and separate storage tiers.

## Hybrid approach
Keep hot vectors in pgvector, archive large collections in Vector Buckets, and query both from Postgres via Foreign Data Wrapper.

## Vector Buckets are valuable for:
- Semantic search at scale
- Recommendation systems
- RAG (Retrieval-Augmented Generation)
- Image and video similarity search
- Large-scale embedding archives

Vector Buckets provide the scalable vector storage required for AI-powered applications.`,
    icon: ChartScatter,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/vector/introduction',
    slug: 'vector-buckets',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Content Delivery Network',
    subtitle: 'Cache large files using the Supabase CDN.',
    description: `
Supabase's Content Delivery Network (CDN) feature caches and serves assets uploaded to Supabase Storage efficiently across the globe, improving latency for users worldwide.

## Key features
1. Global distribution: Serve content from geographically distributed servers.
2. Origin caching: Cache content from the storage server in your project's region.
3. Intelligent routing: Direct users to the nearest CDN node for faster access.
4. Cache status tracking: Monitor cache hits and misses via the cf-cache-status header.
5. Public and private bucket support: Optimize caching based on bucket privacy settings.

## Benefits:
- Improved performance: Reduce latency by serving content from servers closest to the user.
- Scalability: Handle high traffic loads without straining your main servers.
- Global reach: Deliver content efficiently to users worldwide without managing global infrastructure.
- Enhanced security: Additional layer of protection against DDoS and other application attacks.
- Improved availability: Increase content redundancy through distributed serving.

## The CDN feature is valuable for:
- Media-heavy websites serving large images or video files
- Global applications requiring fast content delivery across different regions
- E-commerce platforms needing to serve product images quickly
- Content publishers distributing large documents or multimedia files
- Any application dealing with large file downloads or streaming

Supabase's CDN significantly improves the performance and user experience of your applications, especially for users accessing large files or media content globally, without the complexity of managing your own CDN infrastructure.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/cdn',
    slug: 'cdn',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
      selfHostedTooling: {
        label: 'Cloudflare',
        link: 'https://www.cloudflare.com',
      },
    },
  },
  {
    title: 'Smart Content Delivery Network',
    subtitle: 'Automatically revalidate assets at the edge via the Smart CDN.',
    description: `
Supabase's Smart CDN automatically synchronizes asset metadata to the edge, ensuring content is quickly delivered and remains up-to-date without manual intervention.

## Key features
1. Automatic cache revalidation: Invalidates CDN cache when assets are changed or deleted.
2. Improved cache hit rate: Shields origin server from unchanged asset requests, even with different query strings.
3. Long-term edge caching: Stores assets on the CDN for extended periods while maintaining freshness.
4. Flexible browser caching: Control browser cache duration using the cacheControl option.
5. Rapid propagation: Changes reflect across global data centers within 60 seconds.
6. Cache bypass option: Use unique query strings to fetch directly from the origin when needed.

## Benefits:
- Content freshness: Users always receive the most recent version of assets.
- Reduced origin load: Minimize requests to the origin server by optimizing edge caching.
- Improved user experience: Deliver fast-loading, up-to-date content globally.
- Cost optimization: Reduce egress costs by serving more content from the edge.

## The Smart CDN feature is valuable for:
- Dynamic websites with frequently updated content
- E-commerce platforms with real-time inventory updates
- News and media sites delivering the latest information
- Applications with rapidly changing user-generated content
- Global platforms requiring both speed and content accuracy

Supabase's Smart CDN optimizes both performance and content accuracy, providing a superior user experience for applications with dynamic or frequently updated content, without the complexity of manual cache management.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: 'https://www.youtube-nocookie.com/embed/NpEl20iuOtg',
    docsUrl: 'https://supabase.com/docs/guides/storage/cdn/smart-cdn',
    slug: 'smart-cdn',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
      selfHostedTooling: {
        label: 'Cloudflare',
        link: 'https://www.cloudflare.com',
      },
    },
  },
  {
    title: 'Image transformations',
    subtitle: 'Optimize and resize images on-the-fly directly from your Supabase storage buckets.',
    description: `
Supabase’s Image Transformations feature enables developers to dynamically manipulate images stored in Supabase Storage. This functionality is ideal for applications requiring responsive design, efficient media delivery, and streamlined image management.

## Key features
1. Dynamic resizing: Adjust image dimensions using width and height parameters to suit various display requirements.
2. Quality control: Set image quality on a scale from 20 to 100 to balance visual fidelity and file size.
3. Resize modes: Choose from ‘cover’, ‘contain’, or ‘fill’ to control how images fit within specified dimensions.
4. Automatic format optimization: Automatically convert images to WebP format for supported browsers, enhancing load times and reducing egress usage.
5. Flexible implementation: Utilize with public URLs, signed URLs, or direct downloads to fit various access control needs ([Server-side Auth](/features/server-side-auth)).
6. [Next.js integration](/nextjs): Leverage a custom loader for optimized image handling in Next.js applications.
7. Self-hosting option: Deploy your own image transformation service using Imgproxy for greater control and customization.


## Benefits:
- Performance optimization: Reduce egress usage and improve load times with optimized images.
- Storage efficiency: Store a single high-quality version and generate variants as needed.
- Responsive design support: Serve appropriately sized images for different devices and layouts.
- Simplified workflow: Automate image processing tasks, reducing the need for manual intervention and third-party tools.

## Image transformations are valuable for:
- Responsive web applications: Deliver images optimized for various screen sizes and resolutions.
- Ecommerce platforms: Showcase product images in multiple sizes without storing redundant files.
- Content management systems (CMS): Adapt images for different layouts and templates dynamically.
- Mobile applications: Optimize images for devices with varying egress and display capabilities.
- High-volume image handling: Efficiently manage and serve large quantities of images in diverse contexts with [resumable uploads](/features/resumable-uploads).

Supabase's Image Transformations feature enables you to efficiently manage and serve optimized images, improving your application's performance and user experience while saving time and resources.

## Integration capabilities

Supabase’s Image Transformations seamlessly integrate within its ecosystem and with external tools:
- Supabase Storage: Directly apply transformations to images stored in Supabase buckets, streamlining media management.
- Next.js compatibility: Utilize a custom loader to integrate image transformations within Next.js applications, enhancing performance and user experience.
- Self-hosting with Imgproxy: Deploy your own image transformation service using Imgproxy, offering greater control and customization options.
- API access: Leverage RESTful APIs to programmatically apply transformations, enabling automation and integration with various workflows.

These integration options provide flexibility, allowing developers to tailor image transformation processes to their specific project requirements.
For a deeper understanding and step-by-step guidance on using Image Transformations, please refer to our [documentation](/docs/guides/storage/image-transformations).

## FAQs about image transformations with Supabase

Below are answers to common questions about Supabase Image Transformations.

### What image formats are supported by Supabase Image Transformations?

Supabase Image Transformations primarily support common web-friendly formats such as JPEG, PNG, and WebP. When using the automatic format optimization feature, images can be converted to WebP for supported browsers to enhance performance.

### Can I apply multiple transformations to a single image request?

Yes, you can chain multiple transformation parameters in a single request. For example, you can resize an image and adjust its quality simultaneously by specifying the appropriate query parameters in the image URL.

### How do I implement transformations in my Next.js application?

Supabase provides a custom loader for Next.js, allowing seamless integration of Image Transformations. By configuring the loader, you can optimize images on-the-fly within your Next.js project.

### Are there any limitations on image size or dimensions?

While Supabase does not impose strict limits on image sizes, it’s recommended to optimize images for web use to ensure faster load times and better performance. Large images may consume more egress and affect loading speeds.

### How does automatic format optimization work?

Automatic format optimization detects the capabilities of the user’s browser and serves the most efficient image format supported, such as WebP. This enhances loading times and reduces egress usage without compromising image quality.

`,
    icon: Image,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: 'https://www.youtube-nocookie.com/embed/dLqSmxX3r7I',
    docsUrl: 'https://supabase.com/docs/guides/storage/image-transformations',
    slug: 'image-transformations',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Resumable uploads',
    subtitle: 'Upload large files using resumable uploads.',
    description: `
Supabase's Resumable Uploads feature enables reliable transfer of large files, allowing uploads to be paused and resumed, particularly useful for files exceeding 6MB or in unstable network conditions.

## Key features
1. TUS protocol implementation: Utilizes the open protocol for resumable uploads.
2. Progress tracking: Provides upload progress events for better user feedback.
3. Chunk-based uploads: Uses 6MB chunks for efficient transfer and resumption.
4. Retry mechanism: Implements automatic retries with customizable delay intervals.
5. Metadata support: Allows setting of bucket name, object name, content type, and cache control.
6. Upsert option: Provides the ability to overwrite existing files if needed.
7. Flexible integration: Compatible with tus-js-client and other TUS-supporting libraries like Uppy.

## Benefits:
- Reliability: Successfully upload large files even with unstable internet connections.
- User experience: Allow users to pause and resume uploads at their convenience.
- Bandwidth efficiency: Avoid re-uploading already transferred parts of a file after an interruption.
- Large file support: Confidently handle uploads of very large files without worrying about timeouts.

## Resumable uploads are valuable for:
- Cloud storage applications handling large file transfers
- Video sharing platforms dealing with high-quality video uploads
- Backup and sync services ensuring data integrity during transfers
- Content creation tools handling large media files
- Any application where users need to upload sizeable files in potentially unstable conditions

Supabase's Resumable Uploads feature significantly improves the reliability and user experience of file uploads, especially for large files or in scenarios with unpredictable network conditions.
`,
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: 'https://www.youtube-nocookie.com/embed/pT2PcZFq_M0',
    docsUrl: 'https://supabase.com/docs/guides/storage/uploads/resumable-uploads',
    slug: 'resumable-uploads',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'S3 compatibility',
    subtitle: 'Interact with Storage from tools which support the S3 protocol.',
    description: `
Supabase Storage offers compatibility with the S3 protocol, allowing you to use any S3 client to interact with your Storage objects.

## Key features
1. Protocol interoperability: Support for standard, resumable, and S3 uploads, all interoperable.
2. Extensive API support: Implementation of most commonly used S3 endpoints for bucket and object operations.
3. Bucket management: Support for creating, deleting, and listing buckets.
4. Object handling: Capabilities for uploading, downloading, copying, and deleting objects.
5. Multipart uploads: Support for creating, completing, and aborting multipart uploads.
6. Metadata management: Ability to set and retrieve system metadata for objects.
7. Conditional operations: Support for conditional GET and HEAD requests.

## Benefits:
- Ecosystem compatibility: Leverage existing S3-compatible tools and libraries with Supabase Storage.
- Familiar workflows: Use well-known S3 commands and SDKs for storage operations.
- Flexibility: Choose the most suitable client libraries or tools for your specific needs.
- Easy migration: Simplify the process of moving from S3 to Supabase or using both in parallel.

## S3 compatibility is valuable for:
- DevOps teams using S3-based deployment and backup scripts
- Data analysis workflows leveraging S3-compatible data lakes
- Content management systems with existing S3 integrations
- Legacy applications built around S3 storage
- Any project looking to leverage the vast ecosystem of S3-compatible tools

Supabase's S3 compatibility allows seamless integration with existing workflows and tools, providing flexibility in data storage and management while benefiting from Supabase's managed solution.
`,
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '/images/features/s3-compatibility.png',
    heroImageLight: '/images/features/s3-compatibility-light.png',
    docsUrl: 'https://supabase.com/docs/guides/storage/s3/compatibility',
    slug: 's3-compatibility',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  // Functions
  {
    title: 'Deno Edge Functions',
    subtitle: 'Globally distributed TypeScript functions to execute custom business logic.',
    description: `
Supabase's Deno Edge Functions allow you to deploy and run custom TypeScript functions globally at the edge, bringing your code closer to users for enhanced performance and reduced latency.

## Key features
1. Global distribution: Edge Functions run close to users, reducing latency.
2. TypeScript support: Leverage TypeScript's type safety and modern language features.
3. Deno runtime: Benefit from Deno's security-first approach and modern JavaScript APIs.
4. NPM + Node compatibility: Use NPM modules and Node.js built-in APIs when you need them.
5. Seamless integration: Easy integration with other Supabase services like Auth and Database.
6. Versatile use cases: Support for webhooks, third-party integrations, and custom API endpoints.
7. Open-source and portable: Run locally or on any Deno-compatible platform.
8. Rich ecosystem: Wide range of examples and integrations available.

## Benefits:
- Low-latency responses: Ideal for globally distributed applications.
- Scalability: Automatically handle varying loads without manual intervention.
- Flexibility: Extend Supabase project capabilities beyond database operations.
- Developer-friendly: Fast deployments and rollbacks for agile development.

## Deno Edge Functions are valuable for:
- API backends requiring low-latency responses globally
- Serverless applications needing custom logic close to users
- Webhook handlers for third-party service integrations
- Real-time data processing and transformation
- Custom authentication and authorization flows
- Integration with various services (e.g., Stripe, OpenAI, Hugging Face)
- Building bots for platforms like Discord and Telegram

Supabase's Deno Edge Functions enable you to build responsive, globally distributed applications with custom server-side logic, supporting a wide range of use cases and integrations. You can also tap into the Node and NPM ecosystem when needed.
`,
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: 'https://www.youtube-nocookie.com/embed/5OWH9c4u68M',
    docsUrl: 'https://supabase.com/docs/guides/functions',
    slug: 'deno-edge-functions',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Persistent Storage',
    subtitle: 'Mount S3 buckets for 97% faster Edge Function cold starts.',
    description: `Persistent Storage allows you to mount S3-compatible buckets as persistent file storage for Edge Functions. Files survive function invocations and can be accessed via \`/s3/YOUR-BUCKET-NAME\` prefix, enabling up to 97% faster cold starts.

## Key benefits
1. Dramatically faster cold starts: Up to 97% improvement in cold start times.
2. Persistent across invocations: Files survive between function executions.
3. S3 protocol compatibility: Mount any S3-compatible bucket, including Supabase Storage.
4. POSIX-like file system: Read and write files using standard Deno APIs.
5. Large file processing: Handle large files without fetching on each invocation.

## Storage types
Persistent Storage backed by S3 protocol survives invocations. Ephemeral Storage (\`/tmp\` directory) resets on each invocation.

## File operations supported
\`Deno.readFile()\`, \`Deno.writeFile()\`, \`Deno.readDir()\`, and other standard file operations.

## Persistent Storage is valuable for:
- Large file processing
- Caching between invocations
- Custom image manipulation workflows
- Processing archives (zip files)
- Machine learning model storage

## Setup
Requires S3 credentials as environment variables: \`AWS_ACCESS_KEY_ID\`, \`AWS_SECRET_ACCESS_KEY\`, \`AWS_REGION\`, \`AWS_ENDPOINT_URL_S3\`.

Persistent Storage transforms Edge Functions into stateful, high-performance computing environments.`,
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage',
    slug: 'persistent-storage',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Regional invocations',
    subtitle: 'Execute an Edge Function in a region close to your database.',
    description: `
Supabase's Regional Invocations feature allows you to execute Edge Functions in a region close to your database, optimizing performance for database-intensive operations. This capability ensures low-latency communication between your functions and database, enhancing overall application responsiveness.

## Key benefits
1. Reduced latency: Minimize round-trip time between edge functions and database for faster operations.
2. Improved performance: Enhance the speed of database queries and updates from your edge functions.
3. Data locality: Keep data processing close to where the data is stored for efficiency.
4. Consistency: Ensure that edge functions operate on the most up-to-date data with minimal delay.
5. Cost optimization: Reduce data transfer costs between regions.
6. Simplified architecture: Streamline your application's geographic setup for database operations.
7. Compliance support: Help meet data residency requirements by processing data in specific regions.

## Regional invocations are particularly valuable for:
- Applications with data-intensive serverless functions
- Real-time data processing workflows requiring low latency
- Financial applications needing quick database reads and writes
- Analytics services processing large volumes of data
- Compliance-sensitive applications with data residency requirements
- Any scenario where minimizing function-to-database latency is crucial

By leveraging Supabase's Regional Invocations, you can significantly enhance the performance of your database-centric serverless functions. This feature allows you to build more responsive applications, especially those requiring frequent or complex database interactions, by ensuring that your Edge Functions operate as close as possible to your Supabase database.
`,
    icon: Globe,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/functions/regional-invocation',
    slug: 'regional-invocations',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  // Vector
  {
    title: 'AI Integrations',
    subtitle: 'Enhance applications with OpenAI and Hugging Face integrations.',
    description: `
Supabase's AI Integrations feature provides seamless connectivity with leading AI platforms like OpenAI and Hugging Face, allowing you to easily incorporate advanced AI capabilities into your applications. This powerful feature enables developers to leverage state-of-the-art machine learning models and natural language processing directly within their Supabase projects.

## Key benefits
1. Easy AI integration: Incorporate advanced AI capabilities without managing complex infrastructure.
2. Versatile model access: Utilize a wide range of pre-trained models for various AI tasks.
3. Scalability: Handle AI workloads efficiently with Supabase's managed infrastructure.
4. Cost-effective AI deployment: Leverage powerful AI models without significant upfront investments.
5. Real-time AI processing: Combine AI capabilities with Supabase's real-time features for dynamic applications.
6. Data synergy: Seamlessly use your Supabase data with AI models for personalized experiences.
7. Rapid prototyping: Quickly experiment with and deploy AI-powered features in your applications.

## AI Integrations are particularly valuable for:
- Natural language processing applications like chatbots and content analyzers
- Recommendation systems for e-commerce or content platforms
- Image and video analysis tools for media applications
- Predictive analytics dashboards for business intelligence
- Personalization engines for user experience enhancement
- Any application seeking to incorporate AI-driven insights or automation

By leveraging Supabase's AI Integrations, you can rapidly develop and deploy sophisticated AI-powered applications. This feature bridges the gap between powerful AI models and your application data, enabling you to create more intelligent, responsive, and personalized user experiences without the complexity of managing separate AI infrastructure.
`,
    icon: Brain,
    products: [PRODUCT_MODULES_SHORTNAMES.VECTOR],
    heroImage: 'https://www.youtube-nocookie.com/embed/OgnYxRkxEUw',
    docsUrl: 'https://supabase.com/docs/guides/ai/examples/huggingface-image-captioning',
    slug: 'ai-integrations',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Automatic Embeddings',
    subtitle: 'Automated embedding generation using triggers and queues.',
    description: `Automatic Embeddings provides a system to automatically generate and update vector embeddings using Postgres triggers, queues, and Edge Functions. Embeddings are generated asynchronously with built-in retry logic for failed jobs.

## Key benefits
1. Fully automated: No manual embedding management required.
2. Asynchronous processing: Using pgmq (Postgres message queue) for reliable delivery.
3. Retry logic: Built-in error handling for failed embedding jobs.
4. Generic solution: Works with any table and embedding provider.
5. Cron-based processing: Periodic queue processing via pg_cron.

## Architecture
Trigger detects INSERT/UPDATE on table. Queue function queues embedding job to pgmq. Cron job processes queue periodically (every 5 minutes). Edge Function generates embeddings via AI API. Update stores embedding back to table.

## How it works
1. Create queue using \`pgmq.create('generate_embeddings')\`
2. Create generic queue function taking content and column name
3. Set up triggers on tables for automatic queueing
4. Edge Function calls OpenAI or other providers
5. Cron job processes queue at regular intervals

## Automatic Embeddings are valuable for:
- Semantic search implementations
- Document similarity systems
- Recommendation engines
- RAG (Retrieval-Augmented Generation)
- Content categorization

## Customization
Custom content preparation functions. Different embedding models per table. Batch processing configuration. Custom error handling strategies.

Automatic Embeddings eliminate the manual work of generating and maintaining vector embeddings.`,
    icon: Brain,
    products: [PRODUCT_MODULES_SHORTNAMES.VECTOR],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/ai/automatic-embeddings',
    slug: 'automatic-embeddings',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  // Platform
  {
    title: 'CLI',
    subtitle: 'Use our CLI to develop your project locally and deploy.',
    description: `
Supabase's Command Line Interface (CLI) tool provides developers with a powerful and flexible way to manage their Supabase projects directly from the terminal. This feature streamlines the development workflow, allowing for local development, testing, and seamless deployment of Supabase projects.

## Key benefits
1. Local development: Set up and run a local Supabase instance for development and testing.
2. Version control integration: Easily manage database migrations and schema changes with Git-like workflows.
3. Automated deployments: Deploy changes to your Supabase project with simple CLI commands.
4. Database migrations: Generate, apply, and revert database migrations effortlessly.
5. Environment management: Handle multiple environments (development, staging, production) efficiently.
6. Seed data management: Populate your database with test data for consistent development and testing.
7. CI/CD integration: Incorporate Supabase operations into your continuous integration and deployment pipelines.

## The CLI is particularly valuable for:
- Development teams working on Supabase projects collaboratively
- DevOps professionals managing Supabase deployments across multiple environments
- Open-source projects requiring reproducible Supabase setups
- Developers preferring command-line tools for increased productivity
- Projects with complex database schemas requiring careful version control
- Any application needing a streamlined local-to-production workflow with Supabase

By leveraging the Supabase CLI, you can significantly improve your development workflow, ensuring consistency between local and production environments, streamlining deployments, and making it easier to manage complex Supabase projects. This tool empowers developers to work more efficiently with Supabase, whether they're building small prototypes or large-scale applications.
`,
    icon: Terminal,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://www.youtube-nocookie.com/embed/vyHyYpvjaks',
    docsUrl:
      'https://supabase.com/docs/guides/local-development?queryGroups=package-manager&package-manager=pnpm',
    slug: 'cli',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Management API',
    subtitle: 'Manage your projects programmatically.',
    description: `
Supabase's Management API provides a powerful interface for programmatically managing your Supabase projects. This feature allows developers and DevOps teams to automate project creation, configuration, and maintenance tasks, enabling more efficient and scalable project management workflows.

## Key benefits
1. Automation: Automate repetitive tasks like project creation and configuration.
2. Scalability: Easily manage multiple Supabase projects across different environments.
3. CI/CD integration: Incorporate Supabase project management into your continuous integration and deployment pipelines.
4. Programmatic control: Manage projects dynamically based on your application's needs.
5. Consistent setup: Ensure uniform configuration across multiple projects or environments.
6. Audit trail: Keep track of project changes and configurations programmatically.
7. Resource optimization: Dynamically allocate and deallocate resources based on demand.

## The Management API is particularly valuable for:
- Large organizations managing multiple Supabase projects
- SaaS platforms offering Supabase-powered backends to their customers
- DevOps teams implementing infrastructure-as-code practices
- Managed service providers offering Supabase as part of their stack
- Applications requiring dynamic project creation and management
- Any scenario where manual project management through the dashboard is impractical

By utilizing the Supabase Management API, you can create more efficient, scalable, and automated workflows for managing your Supabase projects. This feature is especially powerful for organizations dealing with multiple projects or environments, enabling them to maintain consistency, reduce manual errors, and quickly respond to changing project requirements.
`,
    icon: FileCode2,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '/images/features/management-api.png',
    heroImageLight: '/images/features/management-api-light.png',
    docsUrl: 'https://supabase.com/docs/reference/api/introduction',
    slug: 'management-api',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Role-Based Access Control (RBAC)',
    icon: ShieldPlus,
    subtitle: 'Define and manage user roles securely',
    description: `
Supabase's Role-Based Access Control (RBAC) feature provides a powerful and flexible way to manage user permissions within your application. RBAC allows you to define roles with specific sets of permissions and assign these roles to users, enabling fine-grained control over who can access what within your system.

## Key benefits
1. Granular access control: Define precise permissions for different user types or job functions.
2. Simplified management: Easily manage permissions by assigning roles rather than individual permissions.
3. Scalability: Efficiently handle permissions for large numbers of users and resources.
4. Compliance support: Meet regulatory requirements for access control in various industries.
5. Reduced error risk: Minimize the chance of accidental permission assignments.
6. Auditing capabilities: Easily track and review role assignments and permission changes.
7. Flexibility: Quickly adapt to organizational changes by modifying role definitions.

## RBAC is particularly valuable for:
- Enterprise applications with complex organizational structures
- Healthcare systems requiring strict data access controls
- Financial platforms with varying levels of user authority
- Content management systems with different contributor roles
- E-commerce platforms with layered admin permissions
- Any application needing to limit access to sensitive features or data

By leveraging Role-Based Access Control, you can create a secure, scalable, and easily manageable access control system for your application. This feature allows you to implement complex permission structures with ease, ensuring that users only have access to the resources and functionalities appropriate for their role within the system.
`,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://www.youtube-nocookie.com/embed/kwoKmi6inAw',
    docsUrl:
      'https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac',
    slug: 'role-based-access-control',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  // Analytics
  {
    title: 'Reports & Metrics',
    subtitle: "Monitor your project's health with usage insights.",
    description: `
Supabase Reports provide comprehensive insights into your project's performance, usage patterns, and overall health. This feature offers a detailed view of various metrics, helping you optimize your application, troubleshoot issues, and make data-driven decisions about resource allocation and scaling.

## Key benefits
1. Performance monitoring: Track query performance, API response times, and overall system health.
2. Usage insights: Understand how your database, storage, and other resources are being utilized.
3. Cost optimization: Identify opportunities to optimize resource usage and reduce costs.
4. Trend analysis: Observe usage patterns over time to predict future needs and potential issues.
5. Security overview: Monitor authentication attempts, failed queries, and other security-related metrics.
6. Customizable dashboards: Create tailored views of the metrics most important to your team.

## Reports are particularly valuable for:
- Development teams needing to optimize application performance
- DevOps professionals monitoring system health and resource utilization
- Project managers tracking usage growth and planning for scaling
- Financial teams managing cloud spending and optimizing costs
- Security personnel monitoring for unusual activity or potential threats
- Any stakeholder requiring insights into the project's operational status

By leveraging Supabase Reports, you gain a understanding of your project's performance and usage patterns. This feature empowers you to make informed decisions about scaling, optimization, and resource allocation, ensuring that your application runs efficiently and cost-effectively. Whether you're troubleshooting issues, planning for growth, or optimizing costs, Supabase Reports provides the insights you need to manage your project effectively.
`,
    icon: BarChart,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '/images/features/reports-and-metrics.png',
    heroImageLight: '/images/features/reports-and-metrics-light.png',
    docsUrl: 'https://supabase.com/blog/supabase-reports-and-metrics',
    slug: 'reports-and-metrics',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'SOC 2 Compliance',
    subtitle: 'Build with confidence on a SOC 2 compliant platform.',
    description: `
Supabase's SOC 2 Compliance demonstrates its commitment to maintaining the highest standards of security, availability, and confidentiality. This certification assures users that Supabase follows strict information security policies and procedures, encompassing the security, availability, processing, integrity, and confidentiality of customer data.

## Key benefits
1. Trust and credibility: Build on a platform that has been independently audited for security practices.
2. Risk mitigation: Reduce the risk of data breaches and security incidents.
3. Compliance support: Easier compliance with your own regulatory requirements.
4. Standardized processes: Benefit from Supabase's adherence to industry-standard security practices.
5. Continuous improvement: Supabase's commitment to maintaining SOC 2 compliance ensures ongoing security enhancements.
6. Transparency: Access to SOC 2 reports provides insight into Supabase's security controls.
7. Competitive advantage: Use Supabase's compliance as a selling point for your own services.

## SOC 2 Compliance is particularly valuable for:
- Enterprises with strict vendor security requirements
- Startups looking to build credibility with enterprise clients
- Financial technology companies handling sensitive financial data
- Healthcare applications dealing with protected health information
- Government contractors requiring compliant cloud services
- Any organization prioritizing data security and privacy in their applications

Leveraging Supabase's SOC 2 Compliance involves:
1. Reviewing Supabase's SOC 2 report to understand its security practices
2. Aligning your application's security practices with Supabase's standards
3. Utilizing Supabase's compliant features to enhance your own security posture
4. Communicating the benefits of building on a SOC 2 compliant platform to stakeholders

By building on Supabase's SOC 2 compliant platform, you gain a significant advantage in terms of security and trust. This compliance demonstrates to your users, partners, and regulators that you take data protection seriously and have chosen a backend platform that adheres to rigorous security standards. Whether you're a startup looking to win enterprise clients or an established company aiming to enhance your security posture, Supabase's SOC 2 compliance provides a solid foundation for building secure, trustworthy applications.
`,
    icon: ShieldCheck,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/security/soc-2-compliance',
    slug: 'soc-2-compliance',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: false,
    },
  },
  // Studio
  {
    title: 'Supabase AI Assistant',
    subtitle: 'Your intelligent companion for managing Postgres databases.',
    description: `
Supabase AI Assistant is integrated into the Supabase Dashboard to drastically improve your database management experience. This tool helps streamline your workflow, significantly reducing the time it takes to transition from concept to product.

The AI Assistant can save you hours of work by automating repetitive tasks and providing context-aware support. For instance, when designing a new database schema, it can generate all necessary SQL queries based on your specifications, allowing you to focus on the bigger picture rather than getting bogged down in details. If you encounter an error in your SQL code, the Assistant can quickly analyze the issue and suggest solutions, enabling you to resolve problems efficiently without losing your train of thought. Additionally, while working on a specific table, the Assistant can provide instant feedback and recommendations tailored to that context, ensuring that you always have relevant information at your fingertips.

Key benefits:
1. Schema Design Assistance: Receive guidance on structuring your database and generating SQL queries.
2. Enhanced Query Writing: Get precise suggestions for writing SQL queries based on your schema.
3. Error Debugging: Identify and resolve SQL errors directly within the SQL Editor.
4. Data Insights Discovery: Execute queries using natural language and view results in a clear format.
5. RLS Policies Management: Create and modify Row Level Security (RLS) Policies according to your requirements.
6. Functions and Triggers Support: Easily suggest, create, or update Postgres Functions and Triggers.

With Supabase AI Assistant, you gain a powerful ally in your development process, helping you work more efficiently and effectively while keeping you focused on your goals.
`,
    icon: Brain,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://www.youtube-nocookie.com/embed/_fdP-aaTHgw',
    docsUrl: '/blog/supabase-ai-assistant-v2',
    slug: 'ai-assistant',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: true,
      selfHostedTooling: {
        label: 'OpenAI API Key',
        link: 'https://platform.openai.com/docs/libraries#create-and-export-an-api-key',
      },
    },
  },
  {
    title: 'Logs & Analytics',
    subtitle: 'Gain insights into your application’s performance and usage.',
    description: `
The Logs & Analytics feature in Supabase provides users with comprehensive logging and analytics capabilities, powered by Logflare. This tool enables developers to track and analyze log events from various Supabase services, such as the API gateway, Postgres databases, Storage, Edge Functions, and more. By leveraging a multi-node Elixir cluster, Supabase processes billions of log events daily, ensuring that users have access to critical insights for optimizing their applications.

OpenTelemetry integration allows you to export logs, metrics, and traces to any OTel-compatible tool—Datadog, Honeycomb, Grafana, or your preferred monitoring platform. The Metrics API exposes ~200 Prometheus-compatible Postgres metrics, including CPU, IO, WAL, connections, and query statistics.

## Key benefits
1. Real-Time Monitoring: Access live data on application performance and user interactions to make informed decisions.
2. Comprehensive Log Management: Ingest and store logs from multiple sources, allowing for centralized management of application events.
3. Powerful Querying: Utilize SQL queries through Logflare Endpoints to analyze logs efficiently, enabling users to extract meaningful metrics.
4. Customizable Dashboards: Create tailored views within Supabase Studio to visualize log data and track key performance indicators (KPIs).
5. Scalability: Handle large volumes of log data with a robust infrastructure designed for high availability and performance.
6. OpenTelemetry Support: Export telemetry data to vendor-agnostic monitoring platforms for unified observability.
7. Metrics API: Stream Postgres performance metrics for CPU, IO, WAL, connections, and query statistics.

This feature is particularly valuable for teams looking to enhance their application's reliability and performance by gaining deeper insights into usage patterns and potential issues.
`,
    icon: Activity,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '/images/features/logs-analytics.png',
    heroImageLight: '/images/features/logs-analytics-light.png',
    docsUrl: 'https://supabase.com/docs/guides/monitoring-troubleshooting/logs',
    slug: 'logs-analytics',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Visual Schema Designer',
    subtitle: 'Design your Postgres database schema with an intuitive interface.',
    description: `
The Visual Schema Designer is an integral part of [Supabase Studio](/features?products=studio), offering users a seamless way to create and modify PostgreSQL database schemas without writing SQL code. This visual database design tool simplifies the process of structuring your database by allowing you to:

- Drag and drop tables and fields. Easily add, remove, and arrange tables and fields to build your schema visually.
- Define relationships. Establish connections between tables, such as one-to-one, one-to-many, and many-to-many relationships, to accurately represent your data model.
- Leverage real-time visualization. Instantly see how changes affect your schema, ensuring a clear understanding of your database structure.

This feature is designed to be accessible for users of all technical levels, making database schema design more approachable and efficient.

## Key benefits
1. Intuitive design: The intuitive design allows for quick schema creation and modification without the need for complex SQL queries.
2. Visual relationship mapping: Clearly illustrates how tables are interconnected, aiding in effective database design and ensuring data integrity.
3. Accessible for all users: Whether you’re a seasoned developer or new to database design, the Visual Schema Designer provides a straightforward way to build and manage your database schema.
4. Immediate feedback: Real-time updates ensure that all changes are instantly visible, reducing errors and improving accuracy.
5. Enhanced collaboration: Multiple team members can work on the schema simultaneously, facilitating better teamwork and faster development cycles.


This feature is particularly valuable for teams engaged in agile development processes where rapid iteration and collaboration are essential.

## Use Cases for Visual Schema Designer

The Visual Schema Designer caters to a diverse range of users, each benefiting uniquely from its intuitive interface and robust features:

- Front-end developers. Quickly prototype and iterate on database schemas without delving into SQL, streamlining the development process.
- Backend engineers. Visualize and manage complex relationships between tables, ensuring data integrity and efficient database architecture.
- Product managers & designers. Collaborate seamlessly with technical teams by understanding and contributing to the database structure through an accessible visual interface.
- Educators & students. Leverage the tool as an educational resource to teach and learn database design principles in a more interactive and engaging manner.

The Visual Schema Designer addresses the needs of various stakeholders; fostering collaboration and enhancing productivity across the board.

## Integration capabilities with Supabase’s Schema designer

The Visual Schema Designer seamlessly integrates within the Supabase ecosystem, enhancing your database management experience:

- Supabase Studio integration. Embedded directly into Supabase Studio, the Visual Schema Designer allows for intuitive schema creation and modification alongside other powerful tools like the SQL Editor and Role Management UI. 
- AI-powered SQL Editor. Leverage the AI SQL Editor to generate and modify SQL queries effortlessly, streamlining your development workflow. 
- Role management UI. Manage user roles and access permissions efficiently, ensuring secure and organized database operations. 
- Database migration UI. Track and manage database migrations with ease, maintaining consistency across your development and production environments.
- Wrappers UI. Connect to external data sources like S3, ClickHouse, and BigQuery, expanding the versatility of your database projects. 

These integrations empower you to design, manage, and scale your PostgreSQL databases effectively within a unified platform.

## FAQs about our Visual Schema Designer

Below are answers to common questions about the Visual Schema Designer, covering its functionality, compatibility, and usage to help you get started quickly.

### Do I need to know SQL to use the Schema Designer?

No, the Visual Schema Designer is designed for users of all technical levels. It enables schema design through a visual interface without the need to write SQL code.

### Can I use this with self-hosted Supabase instances?

Yes, our drag-and-drop schema builder is available for both cloud and self-hosted Supabase setups.

### Does the Designer support collaborative editing?

Multiple users can collaborate on schema design in real-time, enhancing teamwork and facilitating agile development processes.
`,
    icon: RectangleEllipsis,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/visual-schema-designer.png',
    heroImageLight: '/images/features/visual-schema-designer-light.png',
    docsUrl: 'https://supabase.com/blog/supabase-studio-3-0#schema-visualizer',
    slug: 'visual-schema-designer',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Policy Templates',
    subtitle: 'Quickly implement common security policies.',
    description: `
Policy Templates provide a library of predefined security policies that can be easily applied to your Supabase projects. This feature streamlines the process of establishing role-based access control and other security measures, ensuring that best practices are followed consistently across applications.

## Key benefits
1. Time Efficient: Reduces the time required to set up security policies by offering ready-made templates.
2. Best Practices: Ensures adherence to industry standards for data security and access control.
3. Customizable: Allows users to modify templates to fit specific project needs while maintaining a strong security foundation.
4. User-Friendly: Simplifies policy application through an intuitive interface within the Supabase Studio.
5. Documentation Support: Each template comes with comprehensive documentation to guide users through implementation.

This feature is essential for organizations looking to maintain robust security protocols without extensive manual configuration efforts.
`,
    icon: ShieldPlus,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/policy-templates.png',
    heroImageLight: '/images/features/policy-templates-light.png',
    docsUrl: '',
    slug: 'policy-templates',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'SQL Editor',
    subtitle: 'A powerful interface for writing and executing SQL queries.',
    description: `
The SQL Editor in [Supabase Studio](/features?products=studio) provides users with a robust platform for writing, executing, and managing SQL queries directly within their browser. This feature is designed to enhance productivity by offering syntax highlighting, auto-completion, and error detection, making it easier for developers to interact with their databases efficiently.

## Key benefits
1. User-friendly interface: Intuitive design that simplifies the process of writing SQL queries.
2. Syntax highlighting: Enhances readability by color-coding SQL syntax, helping users quickly identify errors.
3. Auto-completion: Speeds up query writing by suggesting table names, column names, and functions.
4. Execution history: Keeps track of previously executed queries for easy reference and reuse.
5. Error detection: Provides immediate feedback on syntax errors, reducing debugging time.

This feature is particularly valuable for developers looking to streamline their workflow while ensuring accurate and efficient database interactions.

## AI-powered assistance

Integrated directly into the SQL Editor, Supabase AI serves as an intelligent assistant to enhance your database development workflow.

- Natural language to SQL: Transform plain English prompts into accurate SQL queries, making database interactions more accessible.
- Context-aware suggestions: Receive intelligent recommendations based on your current database schema and query context.
- Interactive editing: Engage in a conversational interface to refine queries, with the ability to accept or reject AI-generated modifications.
- Error analysis: Quickly identify and resolve SQL errors with AI-driven explanations and solutions. 

## Seamless integration with Supabase ecosystem

The SQL Editor is deeply integrated within the Supabase platform, offering a cohesive development experience.

- [Schema Visualizer](/features/visual-schema-designer): Visually explore and manage your database schemas, enhancing understanding of table relationships.
- [Role management](/features/role-based-access-control): Define and control access to your data with fine-grained role-based permissions.
- Shared SQL snippets: Collaborate with team members by sharing reusable SQL code snippets across projects.
- Database migration UI: Track and manage schema changes with an intuitive migration interface.
- Wrappers UI: Easily connect and query external data sources like S3, ClickHouse, and BigQuery within your Supabase projects.

## Use cases for the SQL Editor

- Rapid prototyping: Quickly build and test database queries during the development phase.
- Data analysis: Perform ad-hoc queries to extract insights and inform decision-making processes.
- Collaborative development: Work alongside team members to develop and refine database queries and structures.
- Educational purposes: Learn and teach SQL in an interactive environment with real-time feedback.

## FAQs about our SQL Editor

Below are answers to common questions about the Supabase SQL Editor.

### Can I use the SQL Editor with self-hosted Supabase projects?

Yes, the SQL Editor is available for self-hosted Supabase instances. However, certain features like Shared SQL Snippets may not be fully supported in self-hosted environments.

### How does Supabase AI assistance work in the SQL Editor?

Supabase AI is integrated directly into the SQL Editor, providing real-time assistance for writing and optimizing SQL queries. It can transform natural language prompts into SQL code, offer context-aware suggestions, and help debug errors. This feature enhances productivity and lowers the barrier to effective database management.

### Is there a way to share my SQL queries with team members?

Supabase offers a Shared SQL Snippets feature that allows you to share and manage SQL code snippets collaboratively within your team. This facilitates better collaboration and code reuse among team members.

### Does the SQL Editor support syntax highlighting and auto-completion?

Absolutely. The SQL Editor includes syntax highlighting to improve code readability and auto-completion features that suggest table names, column names, and functions as you type, enhancing the overall development experience.

### Is the editor accessible via the Supabase CLI?

Yes, the editor is available locally through [Supabase CLI](/features/cli).
`,
    icon: FileCode2,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/sql-editor.png',
    heroImageLight: '/images/features/sql-editor-light.png',
    docsUrl: '',
    slug: 'sql-editor',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Security & Performance Advisor',
    subtitle: 'Optimize your database security and performance effortlessly.',
    description: `
The Security & Performance Advisor feature in Supabase offers users actionable insights into their database's security posture and performance metrics. By analyzing configurations and usage patterns, this tool identifies potential vulnerabilities and performance bottlenecks, providing recommendations for improvements.

## Key benefits
1. Proactive security checks: Regular assessments of security settings to identify vulnerabilities.
2. Performance optimization: Analyzes query performance to recommend optimizations that enhance efficiency.
3. User-friendly dashboard: Presents findings in an easily digestible format within Supabase Studio.
4. Actionable recommendations: Provides clear steps for addressing identified issues, empowering users to enhance their database environments.
5. Ongoing monitoring: Continuously evaluates changes in database usage to adapt recommendations accordingly.

This feature is essential for organizations aiming to maintain high security standards while ensuring optimal performance across their applications.
`,
    icon: ShieldPlus,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/security-and-performance-advisor.png',
    heroImageLight: '/images/features/security-and-performance-advisor-light.png',
    docsUrl: 'https://supabase.com/blog/security-performance-advisor',
    slug: 'security-and-performance-advisor',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Postgres Roles',
    subtitle: 'Managing access to your Postgres database and configuring permissions.',
    description: `
Postgres Roles are a fundamental aspect of managing access permissions within your Supabase database. Roles can function as individual users or groups of users, allowing for flexible permission management. This feature is essential for setting up secure access to your database while enabling efficient collaboration among team members.

Key benefits:
1. Granular access control: Configure permissions for various database objects, including tables, views, and functions, using the GRANT command.
2. Role hierarchy: Organize roles in a hierarchy to simplify permission management, allowing child roles to inherit permissions from parent roles.
3. Secure user management: Create roles with specific login privileges and strong passwords to ensure secure access to your database.
4. Revocation of permissions: Easily revoke permissions using the REVOKE command, providing control over who has access to what within your database.
5. Predefined Roles: Supabase extends Postgres with a set of predefined roles, simplifying the initial setup for new projects.

This feature is particularly valuable for teams looking to implement robust security measures while maintaining flexibility in how users interact with their database.
`,
    icon: Users,
    products: [PRODUCT_SHORTNAMES.DATABASE, ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/postgres-roles.png',
    heroImageLight: '/images/features/postgres-roles-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/postgres/roles',
    slug: 'postgres-roles',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'User Impersonation',
    subtitle: 'Experience your application as any user.',
    description: `
User Impersonation in Supabase allows developers to simulate the experience of any user within their application. This feature is particularly useful for testing and debugging, as it enables you to view and interact with your application exactly as a specific user would.

## Key benefits
1. Realistic testing: Validate user-specific features and permissions by impersonating users directly in Supabase Studio.
2. RLS policy verification: Test Row Level Security (RLS) policies with real data to ensure they function as intended.
3. Enhanced debugging: Quickly identify and resolve user-specific issues by experiencing the application from their perspective.
4. Seamless integration: Use the Table Editor, SQL Editor, and GraphiQL to impersonate users and test queries and mutations.
5. Efficient Development: Accelerate the process of writing and testing RLS policies, reducing development time and effort.

## User Impersonation is particularly valuable for:
- Developers testing user-specific features and permissions
- Teams implementing complex RLS policies
- Applications requiring detailed user experience validation
- Debugging user-reported issues with precision

By leveraging User Impersonation, you can ensure that your application delivers the intended experience for every user, enhancing both functionality and security. This feature empowers developers to create more robust and user-friendly applications by providing a comprehensive toolset for testing and validation.
`,
    icon: Users,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION, ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/blog/launch-week-x/day-1/3.png',
    heroImageLight: '/images/blog/launch-week-x/day-1/3.png',
    docsUrl: '/blog/studio-introducing-assistant#user-impersonation',
    slug: 'user-impersonation',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Foreign Key Selector',
    subtitle: 'Easily manage foreign key relationships between tables.',
    description: `
The Foreign Key Selector feature simplifies the process of establishing and managing foreign key relationships within your database schema. By providing a visual interface for selecting foreign keys, this tool enhances usability and reduces the likelihood of errors during schema design.

## Key benefits
1. Visual management: Allows users to easily visualize and select foreign key relationships between tables.
2. Error reduction: Minimizes mistakes associated with manual foreign key configuration.
3. Streamlined workflow: Enhances the efficiency of schema design by simplifying complex relationships.
4. Real-time updates: Automatically reflects changes made in the foreign key relationships throughout the project.
5. Documentation support: Provides contextual information about foreign keys to guide users during setup.

This feature is particularly beneficial for developers working with complex data models who need a straightforward way to manage relational integrity within their databases.
`,
    icon: DatabaseZap,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage:
      'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/docs/fk-lookup.mp4',
    docsUrl: 'https://supabase.com/blog/supabase-studio-2.0#foreign-key-selector',
    slug: 'foreign-key-selector',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Log Drains',
    subtitle: 'Export logs to external destinations for enhanced monitoring.',
    description: `
Log Drains enable developers to export logs generated by Supabase products—such as the Database, Storage, Realtime, and Auth—to external destinations like Datadog or custom HTTP endpoints. This feature provides a unified view of logs within existing logging and monitoring systems, allowing teams to build robust alerting and observability pipelines.

## Key benefits
1. Centralized logging: Consolidate logs from multiple Supabase services into a single location for easier management and analysis.
2. Custom alerting: Ingest logs into Security Information and Event Management (SIEM) or Intrusion Detection Systems (IDS) to create tailored alerting rules based on database events.
3. Extended retention: Supports longer log retention periods to meet compliance requirements, ensuring data availability for audits and investigations.
4. Flexible configuration: Easily set up Log Drains through the project settings, with support for popular destinations like Datadog and custom HTTP endpoints.
5. Scalable architecture: Built on Logflare's multi-node Elixir cluster, allowing for efficient and scalable log dispatching to multiple destinations.

This feature is particularly useful for teams seeking to enhance their observability practices while maintaining compliance and security standards across their applications.
`,
    icon: Activity,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: 'https://www.youtube-nocookie.com/embed/A4GFmvgxS-E',
    docsUrl: 'https://supabase.com/blog/log-drains',
    slug: 'log-drains',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Client Library - JavaScript',
    subtitle: 'Easily integrate Supabase with your JavaScript applications.',
    description: `
The Supabase JavaScript Client Library provides a straightforward way to interact with your Supabase database and services directly from your JavaScript applications. This library simplifies the process of making API calls, managing authentication, and handling real-time updates, making it an essential tool for developers working with Supabase.

Key benefits:
1. Simplified API interaction: Easily connect to your Supabase backend with minimal setup.
2. Built-in Authentication: Manage user authentication seamlessly within your JavaScript applications.
3. Real-time capabilities: Subscribe to changes in your database and receive updates in real-time.
4. Comprehensive documentation: Access detailed guides and examples to help you get started quickly.
5. Community support: Join a growing community of developers using the JavaScript Client Library for various projects.

This feature is particularly valuable for developers looking to build dynamic web applications that leverage the power of Supabase as a backend service.
`,
    icon: JsIcon,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/reference/javascript/start',
    slug: 'client-library-javascript',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Client Library - Flutter',
    subtitle: 'Integrate Supabase into your Flutter applications effortlessly.',
    description: `
The Supabase Flutter Client Library allows developers to easily integrate Supabase into their Flutter applications. This library provides a comprehensive set of tools for managing database interactions, user authentication, and real-time data updates, all tailored for the Flutter framework.

Key benefits:
1. Seamless integration: Connect your Flutter app to Supabase with minimal configuration.
2. User Authentication: Manage user sign-ups, logins, and sessions directly within your Flutter application.
3. Real-time updates: Receive live updates from your database, enhancing user experience.
4. Detailed documentation: Access extensive resources and examples to facilitate development.
5. Active community: Engage with other Flutter developers leveraging Supabase for their projects.

This feature is particularly useful for Flutter developers aiming to create responsive mobile applications backed by a powerful database solution.
`,
    icon: FlutterIcon,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/reference/dart/start',
    slug: 'client-library-flutter',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Client Library - Swift',
    subtitle: 'Effortlessly connect your Swift applications to Supabase.',
    description: `
The Supabase Swift Client Library provides an easy way for developers to integrate their iOS applications with Supabase services. This library simplifies database access, user authentication, and real-time data handling, making it an essential tool for Swift developers.

Key benefits:
1. Easy integration: Quickly connect your Swift app to Supabase with straightforward setup instructions.
2. Authentication management: Handle user authentication seamlessly within your iOS applications.
3. Real-time data handling: Subscribe to changes in your database and receive updates instantly.
4. Comprehensive guides: Utilize detailed documentation and examples to streamline development.
5. Supportive community: Join a community of Swift developers using Supabase for their app development needs.

This feature is particularly valuable for iOS developers looking to leverage the capabilities of Supabase in their mobile applications.
`,
    icon: SwiftIcon,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/reference/swift/start',
    slug: 'client-library-swift',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Client Library - Python',
    subtitle: 'Integrate Supabase easily into your Python applications.',
    description: `
The Supabase Python Client Library enables developers to connect their Python applications with Supabase effortlessly. This library provides tools for interacting with the database, managing user authentication, and handling real-time updates, tailored specifically for Python developers.

Key benefits:
1. Simple connection setup: Easily connect your Python application to Supabase with minimal configuration.
2. User authentication support: Manage user accounts and sessions directly within your Python code.
3. Real-time data updates: Subscribe to changes in your database and receive live updates as they occur.
4. In-depth documentation: Access comprehensive guides and examples to assist in development.
5. Engaged community support: Connect with other Python developers utilizing Supabase in their projects.

This feature is especially beneficial for Python developers looking to build robust applications powered by a scalable backend service like Supabase.
`,
    icon: PythonIcon,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/reference/python/start',
    slug: 'client-library-python',
    status: {
      stage: PRODUCT_STAGES.BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Cron',
    subtitle: 'Schedule recurring Jobs in Postgres.',
    description: `
Supabase Cron is a Postgres module designed to schedule recurring Jobs with cron syntax directly within your database. Seamlessly integrated into the Supabase ecosystem, it allows users to automate tasks like executing SQL snippets, calling Database Functions, triggering Supabase Edge Functions, or syncing with external systems via webhooks.

## Key benefits:
1. Just Postgres: Jobs and run details are stored and executed entirely in the database by leveraging the pg_cron database extension.
4. Versatile scheduling options: Supports standard cron syntax, sub-minute intervals, and natural language scheduling.
2. Supabase integration: Integrates seamlessly with the rest of the Supabase platform, including Supabase Edge Functions and Database Webhooks.
3. Zero network latency: Jobs are run directly in your database, eliminating network latency when executing SQL Snippets or calling Database Functions.
6. Enhanced observability: Monitor job history, debug errors, and review logs directly from the Supabase Dashboard.
5. Broad use cases: Automate a wide range of tasks, including database maintenance, analytics, performance optimizations, and syncing with remote systems.
7. Ease of use: Leverage an intuitive UI or SQL for scheduling, managing, and monitoring Jobs.
`,
    icon: Clock,
    products: [PRODUCT_SHORTNAMES.DATABASE, ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://www.youtube-nocookie.com/embed/miRQPbIJOuQ',
    docsUrl: 'https://supabase.com/docs/guides/cron',
    slug: 'supabase-cron',
    status: {
      stage: PRODUCT_STAGES.BETA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'OrioleDB',
    subtitle: "New Postgres storage engine that's better than Heap storage.",
    description: `
OrioleDB is a PostgreSQL storage extension built on its pluggable storage framework. Serving as a direct replacement for PostgreSQL's Heap storage, it addresses scalability challenges while harnessing the full power of modern hardware. Designed to integrate effortlessly with PostgreSQL, OrioleDB enhances performance, efficiency, and scalability, all while maintaining the reliability and robustness PostgreSQL users depend on.

## Key benefits:
1. Fully integrated: A drop-in replacement for PostgreSQL’s Heap storage, enabling easy adoption without major changes to existing workflows.
2. Enhanced scalability: Eliminates buffer mapping bottlenecks and utilizes lock-less page reading, significantly improving vertical scalability and hardware utilization.
3. Superior performance: Proven to outperform PostgreSQL Heap by up to 5.5x in benchmarks, particularly under high-load and large-scale scenarios.
4. Reduced maintenance overhead: Undo log-based MVCC eliminates storage bloat and removes the need for VACUUM, preventing common performance degradation.
5. Efficient storage management: Built-in compression reduces storage requirements by up to 5x, enabling more cost-effective data handling.
6. Modern write-ahead logging (WAL): Row-level WAL supports parallelism and is designed for future active-active multi-master configurations.
7. Optimized for large datasets: Index-organized tables improve data locality, reducing disk I/O for workloads exceeding memory cache capacity.

## Roadmap Features:
1. Decoupled storage and compute with S3 integration for unlimited scalability.
2. Planned columnar indexes to enable hybrid OLTP and OLAP workloads on the same system.
3. Multi-master replication for better availability and fault tolerance.
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE, ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '/images/features/orioledb.png',
    heroImageLight: '/images/features/orioledb-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/orioledb',
    slug: 'orioledb',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Replication',
    subtitle: 'Replicate database changes to external destinations.',
    description: `Replication uses Postgres logical replication to replicate database changes to external destinations like Analytics Buckets and BigQuery. Changes are captured from the Write Ahead Log and delivered in near real-time to analytical systems.

## Key benefits
1. Near real-time sync: Changes replicated as they occur using WAL reading.
2. Analytics Buckets support: Append-only changelog format in Iceberg.
3. BigQuery integration: Direct replication to Google's data warehouse.
4. Complete change capture: INSERT, UPDATE, DELETE, and TRUNCATE operations.
5. Managed pipeline: Monitor status, lag, and errors in dashboard.

## Destinations
Analytics Buckets create append-only changelog with \`cdc_operation\` column, preserving complete change history in Iceberg format. BigQuery creates views backed by versioned tables for efficient querying.

## Setup
Create Postgres publication for tables to replicate. Add destination in Replication section of dashboard. Configure destination-specific settings. Monitor pipeline in dashboard.

## Requirements
Tables must have primary keys. Logical replication must be enabled.

## Replication is valuable for:
- Real-time data warehousing
- Analytics separation from production
- Historical data archival
- Multi-destination data sync
- Compliance and audit trails

## Limitations
No DDL support yet (ALTER TABLE, ADD COLUMN). Destination-specific constraints may apply.

Replication provides the real-time data pipeline required for modern analytics architectures.`,
    icon: DatabaseZap,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/replication/replication-setup',
    slug: 'replication',
    status: {
      stage: PRODUCT_STAGES.PRIVATE_ALPHA,
      availableOnSelfHosted: false,
    },
  },
  {
    title: 'Queues',
    subtitle: 'Durable messages with guaranteed delivery.',
    description: `
Supabase Queues is a native Postgres-based message queue system built on the PGMQ extension, offering developers a seamless way to persist and guarantee delivery of messages, which improves the scalability and resiliency of horizontally deployed services.

Supabase Queues provides the reliability of Postgres with the simplicity of Supabase's developer experience, enabling teams to manage queues without maintaining additional infrastructure.

## Features:
1. Battle-tested infrastructure: Built on PGMQ with proven production deployments and active maintenance.
2. Native PostgreSQL integration: Zero additional infrastructure, transactional consistency, and high performance.
3. Row level security integration: Native PostgreSQL RLS support for granular access control.
4. Visual queue management: Built-in dashboard for queue monitoring and management.
5. Message archival: Built-in support for archiving processed messages for audit trails.
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE, ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://www.youtube-nocookie.com/embed/UEwfaElBnZk',
    docsUrl: 'https://supabase.com/docs/guides/queues',
    slug: 'queues',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'MCP Server',
    subtitle:
      'Connect your AI tools using the official Supabase Model Context Protocol (MCP) server.',
    description: `
The MCP Server bridges the gap between AI tools and your Supabase projects, enabling natural language commands and agent-like experiences for database management. It standardizes how Large Language Models (LLMs) communicate with platforms like Supabase, allowing AI tools such as Cursor, Claude, and Windsurf to spin up projects, design tables, query data, and manage configurations—all through a unified protocol.

With the MCP Server, you can:

- Create and manage Supabase projects directly from your AI tool.
- Design tables, generate migrations, and manage schema.
- Query data and run reports using SQL.
- Manage branches, configurations, and TypeScript types.
- Retrieve logs for debugging and troubleshooting.
- Automate repetitive tasks and streamline AI-assisted development workflows.

The MCP Server simplifies the integration of AI tools with Supabase, enabling a seamless development experience without the need for custom APIs or wrappers.

## Key benefits
1. AI-native development: Let AI tools like Cursor or Claude manage your Supabase projects with natural language commands.
2. Standardized tool ecosystem: MCP standardizes how tools interact with Supabase, enabling a plug-and-play experience for AI-powered workflows.
3. Streamlined workflows: Build faster by offloading repetitive tasks like schema design and configuration management to your AI assistant.
4. Extensive toolset: Access over 20 tools for database design, data querying, and project management.
5. Evolving capabilities: MCP continues to evolve, with upcoming support for native OAuth authentication, Edge Function deployment, and advanced schema discovery.

The MCP Server empowers developers to build AI-native applications, accelerating productivity and reducing the complexity of working across multiple tools.

## Use Cases for MCP Server

The MCP Server unlocks new possibilities for AI-assisted development across various teams:

- Frontend developers. Use tools like Cursor to scaffold Next.js apps backed by Supabase, configure environment files, and manage schema without leaving the IDE.
- Backend engineers. Automate tasks like table creation, migrations, and TypeScript generation directly from AI tools.
- AI engineers. Build custom AI agents that interact with Supabase databases, enabling dynamic and responsive AI-powered applications.
- Educators & learners. Explore modern AI development practices by combining LLMs and databases in real-world projects.

## Integration capabilities with Supabase MCP Server

The MCP Server integrates seamlessly with popular AI tools and the broader Supabase ecosystem:

- Cursor. Connect your IDE directly to Supabase for AI-driven development workflows.
- Claude. Use Claude desktop and code tools to interact with Supabase resources and services.
- Windsurf (Codium). Configure the MCP Server to manage Supabase projects directly within Codium's AI assistant.
- Visual Studio Code (Copilot). Leverage AI capabilities to query data, generate types, and manage projects within VS Code.
- Cline (VS Code extension). Connect Cline to Supabase through the MCP Server for AI-assisted database operations.

These integrations empower developers to streamline workflows, reduce manual effort, and enhance productivity in AI-driven environments.

## FAQs about the MCP Server

Below are answers to common questions about the MCP Server, covering its functionality, compatibility, and setup requirements.

### What is the Model Context Protocol (MCP)?

MCP is a standard that defines how AI tools and platforms communicate. It enables AI tools to interact with Supabase by calling functions, retrieving data, and executing tasks through a common protocol.

### Do I need a personal access token (PAT) to use the MCP Server?

Yes, you'll need to create a PAT in your Supabase settings to authenticate the MCP Server. Future versions of MCP will support OAuth login flows for simpler authentication.

### Can I use the MCP Server with self-hosted Supabase instances?

No, the official Supabase MCP Server connects directly to Supabase Cloud. For local instances, you can use the Postgres MCP Server instead.

### Which AI tools are compatible with the MCP Server?

The MCP Server works with popular AI tools like Cursor, Claude, Windsurf, Visual Studio Code (CoPilot), and Cline. More tools will be supported as they adopt the MCP standard.

### Can the MCP Server modify my database schema or data?

Yes, the MCP Server can perform actions like creating tables, running queries, and managing branches. Use best practices like branching and access controls to protect production data.
`,
    icon: CloudCog,
    products: [PRODUCT_SHORTNAMES.DATABASE, ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://www.youtube-nocookie.com/embed/1SMldLoOhbg',
    docsUrl: 'https://supabase.com/docs/guides/getting-started/mcp',
    slug: 'mcp-server',
    status: {
      stage: PRODUCT_STAGES.PUBLIC_ALPHA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'Declarative Schemas',
    subtitle: 'Simplify database management with declarative schema files.',
    description: `
Declarative schemas help you manage complex Postgres databases more easily by defining your database structure in SQL files that represent the final, desired state. These schema files can be stored and versioned alongside your codebase, enabling better collaboration and simplified reviews.

With declarative schemas, you can:

- Maintain a single source of truth for your database schema, reducing duplication and errors.
- Generate migration files automatically by diffing your declarative schema against the current database state.
- Review changes easily through concise, readable diffs instead of long, complex migration scripts.

## Key benefits
1. Single source of truth: Define your entire database schema in a single, centralized location for better visibility and control.
2. Version-controlled changes: Store your schema files alongside your application code, ensuring consistency across environments.
3. Simplified code reviews: Schema changes become small, focused diffs that are easier to understand and validate.
4. Reduce merge conflicts: Minimize the risk of conflicts when multiple developers work on the same schema.
5. Support for advanced Postgres features: Manage tables, views, functions, triggers, policies, and more through declarative SQL files.

Declarative schemas make it easier to manage growing database complexity, so your team can iterate faster without sacrificing stability or control.

## Use Cases for Declarative Schemas

Declarative schemas are valuable for a wide range of teams and scenarios:

- Teams managing complex databases. Simplify schema management when working with multiple tables, views, policies, and functions.
- Collaborative teams. Reduce merge conflicts and improve review processes when multiple developers are making schema changes.
- CI/CD pipelines. Use declarative schemas to automate schema updates in your deployment workflows.
- Teams adopting best practices. Adopt a more robust, maintainable approach to schema management with declarative patterns.

## Integration capabilities with Supabase

Declarative schemas integrate directly with the Supabase CLI, allowing you to:

- Define your schema in SQL files within the \`supabase/schemas\` directory.
- Use \`supabase db diff\` to generate migration files based on schema changes.
- Apply and deploy migrations using the Supabase CLI, ensuring consistency across local and remote environments.
- Combine with the Postgres Language Server for enhanced IDE support when working with declarative schemas.

These tools help you maintain control over your database while moving faster and reducing the risk of errors.

## FAQs about Declarative Schemas

Below are answers to common questions about declarative schemas.

### How do declarative schemas differ from migrations?

Migrations are a record of incremental changes to your database schema. Declarative schemas define the final desired state of your schema, and the necessary migration files are generated by comparing the current database state with your schema files.

### Do I need to write my own migration files?

No. Supabase provides a schema diff tool (\`supabase db diff\`) that automatically generates migration files from your declarative schema files.

### Can I use declarative schemas with my existing projects?

Yes. You can pull your production schema into declarative files by running \`supabase db dump > supabase/schemas/prod.sql\`. From there, you can split the schema into smaller files and adopt a declarative workflow.

### Are there any limitations to declarative schemas?

The schema diff tool handles most Postgres objects, but some entities (like DML statements) are not captured and may still require manual migrations.

For detailed instructions and best practices, see the [Declarative Schemas documentation](https://supabase.com/docs/guides/local-development/declarative-database-schemas).
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: 'https://www.youtube-nocookie.com/embed/EALkUlOKvAs',
    docsUrl: 'https://supabase.com/docs/guides/local-development/declarative-database-schemas',
    slug: 'declarative-schemas',
    status: {
      stage: PRODUCT_STAGES.GA,
      availableOnSelfHosted: true,
    },
  },
  {
    title: 'PrivateLink',
    subtitle: 'Secure private network connectivity to your Supabase database.',
    description: `
Supabase PrivateLink provides enterprise-grade private network connectivity between your AWS VPC and your Supabase database using AWS VPC Lattice. This eliminates exposure to the public internet by creating a secure, private connection that keeps your database traffic within the AWS network backbone.

When enabled, your database connections stay entirely within the AWS network. No public internet exposure. No additional attack surface. From a network perspective, your Supabase database behaves like it's inside your own VPC.

## Key benefits
1. Enhanced security posture: Database traffic flows through private AWS infrastructure only, minimizing attack vectors by eliminating public exposure.
2. Compliance ready: Meet strict regulatory requirements for private network connectivity in healthcare, finance, and other industries with high compliance requirements.
3. Reduced latency: Connection latency is typically lower than public connections because traffic takes a more direct path through AWS networks.
4. Network isolation: Keep sensitive database connections completely separate from public internet traffic.
5. Simplified architecture: No need to manage complex VPN configurations or additional networking infrastructure.
6. Flexible deployment: Connect through a dedicated PrivateLink endpoint or integrate with existing VPC Lattice Service Networks.

## How PrivateLink works

Supabase PrivateLink uses AWS VPC Lattice under the hood. When you enable PrivateLink, Supabase shares a VPC Lattice Resource Configuration with your AWS account. You accept the share and create an endpoint in your VPC.

Your applications connect to the endpoint using a private DNS name. Traffic flows through AWS infrastructure to your Supabase database. The connection supports both direct Postgres connections and PgBouncer for connection pooling.

## When to use PrivateLink

PrivateLink is particularly valuable for:

- **Highly regulated industries**: Healthcare, finance, and other organizations with high compliance requirements often require private network connectivity to meet these standards.
- **Security-conscious teams**: Minimize your attack surface by disabling public database access entirely once PrivateLink is configured.
- **AWS-native workloads**: If your applications already run on AWS, setting up PrivateLink is straightforward and keeps all traffic within the same cloud provider.
- **Enterprise deployments**: Organizations handling sensitive data that need additional layers of network security.

## Current considerations

PrivateLink is currently in Beta with some constraints:

- **AWS environments required**: This initial release supports connections to AWS VPCs via PrivateLink. Your workloads needs to run in AWS to use PrivateLink.
- **Database connections only**: PrivateLink works for Postgres and PgBouncer connections. It does not cover the Supabase API, Storage, Auth, or Realtime services, which still use public endpoints.
- **Same region required**: Your AWS VPC must be in the same region as your Supabase project.
- **Team or Enterprise plan required**: PrivateLink is available on Team and Enterprise plans.

By leveraging PrivateLink, you can satisfy stringent compliance requirements, reduce your security attack surface, and ensure your most sensitive database connections never traverse the public internet.
`,
    icon: Shield,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '/images/blog/2026/security-retro/privatelink.png',
    docsUrl: 'https://supabase.com/docs/guides/platform/privatelink',
    slug: 'privatelink',
    status: {
      stage: PRODUCT_STAGES.BETA,
      availableOnSelfHosted: false,
    },
  },
]
