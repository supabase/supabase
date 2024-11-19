import {
  ChartScatter,
  Database,
  FileCode2,
  Lock,
  Cloud,
  UploadCloud,
  Image,
  MessageCircle,
  ShieldCheck,
  Package,
  Users,
  Folders,
  RectangleEllipsis,
  Braces,
  Globe,
  UserX,
  GitBranch,
  DatabaseZap,
  Mail,
  Smartphone,
  Server,
  Activity,
  BarChart,
  Brain,
  Puzzle,
  DatabaseBackup,
  ShieldPlus,
  Terminal,
  Zap,
} from 'lucide-react'
import { PRODUCT, PRODUCT_SHORTNAMES } from 'shared-data/products'
import type { LucideIcon } from 'lucide-react'

enum ADDITIONAL_PRODUCTS {
  PLATFORM = 'platform management',
  STUDIO = 'studio',
}

export type FeatureProductType = PRODUCT | ADDITIONAL_PRODUCTS

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
  icon: string | LucideIcon
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
  },
  {
    title: 'Branching',
    subtitle: 'Test and preview changes using Supabase Branches.',
    description: `
Supabase Branching allows you to create and test changes in separate, temporary environments without affecting your production setup. This feature works similarly to Git branches, enabling safe experimentation with configurations, database schemas, and new features.

## Key features
1. Git-based workflow: Integrates with GitHub, creating preview branches for each pull request.
2. Isolated environments: Each branch has its own Supabase instance with separate API credentials.
3. Automatic migrations: Runs new migrations when changes are pushed to the ./supabase/migrations directory.
4. Data seeding: Preview branches can be seeded with sample data using ./supabase/seed.sql.
5. CI/CD integration: Supports preview deployments with hosting providers like Vercel.

## Benefits:
- Risk-free experimentation: Test changes without affecting the production environment.
- Improved collaboration: Multiple team members can work on different features simultaneously.
- Streamlined reviews: Facilitate thorough checks of database changes before merging.
- Rapid iteration: Quickly prototype and validate database-driven features.

## Supabase Branching is valuable for:
- Agile teams working on multiple features concurrently
- Projects with complex database schemas requiring careful management
- Applications undergoing significant refactoring or upgrades
- CI/CD pipelines integrating database changes
`,
    icon: GitBranch,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/branching.png',
    heroImageLight: '/images/features/branching-light.png',
    docsUrl: 'https://supabase.com/docs/guides/platform/branching',
    slug: 'branching',
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
  },
  {
    title: 'Read replicas',
    subtitle: 'Deploy read-only databases across multiple regions for lower latency.',
    description: `
Supabase Read Replicas allow you to deploy additional read-only databases that are kept in sync with your Primary database. This feature enhances performance, improves resource management, and reduces latency for global applications.

## Key features
1. Load balancing: Distribute read operations across multiple databases, reducing load on the Primary.
2. Global deployment: Deploy replicas closer to users for reduced latency.
3. Dedicated endpoints: Each replica has its own database and API endpoints.
4. API load balancer: Automatically balance GET requests across all available endpoints.
5. Centralized configuration: Settings are propagated across all databases in a project.
6. Monitoring tools: Track replication lag and resource utilization through the Supabase Dashboard.

## Benefits:
- Improved performance: Serve data from the nearest location, reducing response times.
- Increased availability: Distribute read traffic across multiple replicas for enhanced resilience.
- Scalability: Handle higher read loads by offloading queries to replicas.
- Data redundancy: Replicas provide additional copies of your data.
- Analytics support: Run resource-intensive queries on replicas without impacting production.

## Read Replicas are particularly valuable for:
- Global applications serving users across different regions
- High-traffic websites with read-heavy workloads
- Real-time analytics dashboards requiring low-latency data access
- Applications needing to scale read capacity independently of write capacity

By leveraging Read Replicas, you can achieve consistent low-latency performance globally, improve application responsiveness for read operations, and enhance system reliability through better resource distribution and redundancy.
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: 'https://www.youtube-nocookie.com/embed/PX3R1fXjJ2M',
    docsUrl: 'https://supabase.com/docs/guides/platform/read-replicas',
    slug: 'read-replicas',
  },
  {
    title: 'Fly Postgres',
    subtitle: 'Launch the Supabase stack on Fly.io edge network.',
    description: `
Fly Postgres allows you to deploy Supabase databases on the Fly.io edge network, bringing your data closer to users and reducing latency for global applications.

## Key features
1. Edge deployment: Launch databases in any region where Fly.io operates.
2. CLI integration: Set up and manage databases using the Fly CLI.
3. Supabase dashboard access: Use familiar Supabase tools for database management.
4. IPv6 support: Connect directly to databases using IPv6.
5. Supavisor support: Use Supavisor for IPv4 connections when needed.
6. Automatic Supabase organization creation: Seamless integration with Fly accounts.

## Benefits:
- Improved global performance: Serve data from edge locations, minimizing latency.
- Simplified deployment: Easily set up databases using Fly CLI commands.
- Familiar tooling: Access Supabase features like SQL editor and table editor.
- Flexible connectivity: Support for both IPv6 and IPv4 (via Supavisor) connections.
- Integrated management: Manage database resources alongside other Fly applications.

## Fly Postgres is particularly valuable for:
- Global applications requiring low-latency database access worldwide
- Developers familiar with Fly.io looking to integrate Supabase databases
- Projects needing easy deployment and management of edge-located databases

By leveraging Fly Postgres, you can achieve improved global performance for your applications while maintaining the ease of use and powerful features of Supabase.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/fly-postgres',
    slug: 'fly-postgres',
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
- timescaledb: Optimizes the database for time-series data

Postgres extensions are valuable for a wide range of applications, from GIS and machine learning projects to security-focused applications and IoT systems dealing with time-series data.

By leveraging these extensions, you can implement complex features more easily, reduce the need for external services, and tailor your database to specific project requirements.
`,
    icon: Puzzle,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/postgres-extensions.png',
    heroImageLight: '/images/features/postgres-extensions-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions',
    slug: 'postgres-extensions',
  },
  {
    title: 'Database Webhooks',
    subtitle: 'Trigger external payloads on database events.',
    description: `
Database Webhooks allow you to send real-time data from your database to another system whenever a table event occurs. You can hook into three table events: INSERT, UPDATE, and DELETE, with all events fired after a database row is changed. This feature provides a convenient way to integrate your Supabase database with external applications and services.

## Key benefits
1. Real-Time Data Transfer: Automatically send data to external systems in response to database changes, ensuring timely updates.
2. Flexibility: Configure webhooks for specific tables and events, allowing for tailored integrations based on your application's needs.
3. Asynchronous Processing: Built on the pg_net extension, webhooks operate asynchronously, preventing long-running network requests from blocking database operations.
4. Easy Setup: Create webhooks directly from the Supabase Dashboard or through SQL statements, making integration straightforward.
5. Payload Customization: Automatically generated payloads provide relevant data about the event, including the new and old record states.

This feature is particularly useful for developers looking to automate workflows and integrate their databases with third-party services like payment processors or notification systems.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '/images/features/database-webhooks.png',
    heroImageLight: '/images/features/database-webhooks-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/webhooks',
    slug: 'database-webhooks',
  },
  {
    title: 'Vault',
    subtitle: 'Manage secrets safely in Postgres.',
    description: `
Vault is a Postgres extension and accompanying Supabase UI that simplifies the secure storage of encrypted secrets and other sensitive data in your database. This feature allows developers to utilize Postgres in innovative ways beyond its standard capabilities.

## Key benefits:
1. Secure Storage: Secrets are stored on disk in an encrypted format, ensuring they remain protected even in backups or replication streams.
2. Easy Management: The Supabase dashboard UI makes it simple to store and manage secrets, including environment variables and API keys.
3. Flexible Encryption: Users can create custom encryption keys for different purposes, enhancing data security.
4. Seamless Access: Secrets can be accessed from SQL as easily as querying a table, facilitating their use in Postgres Functions, Triggers, and Webhooks.
5. Robust Security Features: The Vault employs authenticated encryption to ensure that secrets cannot be forged or decrypted without proper authorization.

This feature is particularly useful for teams looking to enhance their security posture by managing sensitive data directly within their database environment.
`,
    icon: Lock,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: 'https://supabase.com/docs/img/guides/database/vault-hello-compressed.mp4',
    docsUrl: 'https://supabase.com/docs/guides/database/vault',
    slug: 'vault',
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
  },
  // Realtime
  {
    title: 'Realtime Postgres changes',
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
  },
  {
    title: 'Realtime Broadcast',
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
  },
  {
    title: 'Realtime Presence',
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
- Local development support: Test email flows using built-in tools like Inbucket.

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
  },
  // Storage
  {
    title: 'File storage',
    subtitle: 'Supabase Storage makes it simple to store and serve files.',
    description: `
Supabase Storage provides a scalable solution for storing and serving files in your applications, allowing easy management of user-generated content and assets within your Supabase project.

## Key features
1. Global CDN: Serve files quickly from over 285 cities worldwide.
2. Image optimization: Resize and compress media files on the fly.
3. Flexible file types: Store images, videos, documents, and any other file type.
4. Access control: Implement fine-grained access using Postgres RLS policies.
5. Resumable uploads: Support for protocols like TUS for reliable file transfers.
6. Organization: Structure files into buckets and folders for efficient management.

## Benefits:
- Seamless integration: Use the same Supabase client for both database and storage operations.
- Scalability: Handle large numbers of files and high traffic loads without infrastructure management.
- Performance: Quick file serving with global CDN support.
- Cost-effectiveness: Pay only for the storage you use, with no upfront costs.

## File storage is valuable for:
- Social media platforms storing user-uploaded media
- E-commerce sites managing product images and documents
- Content management systems handling various file types
- Collaborative tools storing shared assets
- Mobile apps needing to sync user data and media

Supabase Storage simplifies adding robust file management to your applications, allowing you to focus on building unique features while relying on Supabase for secure, scalable file storage and serving.
`,
    icon: Folders,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '/images/features/file-storage.png',
    heroImageLight: '/images/features/file-storage-light.png',
    docsUrl: 'https://supabase.com/docs/guides/storage',
    slug: 'file-storage',
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
- Cost optimization: Reduce bandwidth costs by serving more content from the edge.

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
  },
  {
    title: 'Image transformations',
    subtitle: 'Transform images on the fly.',
    description: `
Supabase's Image Transformations feature allows you to optimize and resize images on-the-fly, directly from your storage buckets.

## Key features
1. Dynamic resizing: Adjust image dimensions using width and height parameters.
2. Quality control: Set image quality with a scale of 20 to 100.
3. Resize modes: Choose from 'cover', 'contain', or 'fill' to suit your needs.
4. Automatic format optimization: Convert images to WebP for supported browsers.
5. Flexible implementation: Use with public URLs, signed URLs, or direct downloads.
6. Next.js integration: Custom loader for optimized images in Next.js applications.
7. Self-hosting option: Deploy your own image transformation service using Imgproxy.

## Benefits:
- Performance optimization: Reduce bandwidth usage and improve load times with optimized images.
- Storage efficiency: Store a single high-quality version and generate variants as needed.
- Responsive design support: Serve appropriately sized images for different devices and layouts.
- Simplified workflow: Eliminate the need for manual image processing and multiple version storage.

## Image transformations are valuable for:
- Responsive web applications requiring different image sizes
- E-commerce platforms showcasing product images
- Content management systems adapting images for various layouts
- Mobile apps optimizing images for cellular networks
- Any application handling large volumes of images in varying contexts

Supabase's Image Transformations feature enables you to efficiently manage and serve optimized images, improving your application's performance and user experience while saving time and resources.
`,
    icon: Image,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: 'https://www.youtube-nocookie.com/embed/dLqSmxX3r7I',
    docsUrl: 'https://supabase.com/docs/guides/storage/image-transformations',
    slug: 'image-transformations',
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
4. Seamless integration: Easy integration with other Supabase services like Auth and Database.
5. Versatile use cases: Support for webhooks, third-party integrations, and custom API endpoints.
6. Open-source and portable: Run locally or on any Deno-compatible platform.
7. Rich ecosystem: Wide range of examples and integrations available.

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

Supabase's Deno Edge Functions enable you to build responsive, globally distributed applications with custom server-side logic, supporting a wide range of use cases and integrations.
`,
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: 'https://www.youtube-nocookie.com/embed/5OWH9c4u68M',
    docsUrl: 'https://supabase.com/docs/guides/functions',
    slug: 'deno-edge-functions',
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
  },
  {
    title: 'NPM compatibility',
    subtitle: 'Edge Functions natively support NPM modules and Node built-in APIs.',
    description: `
Supabase's NPM Compatibility feature for Edge Functions allows you to use NPM modules and Node.js built-in APIs directly in your Deno-based Edge Functions. This powerful capability bridges the gap between Deno and the vast Node.js ecosystem, giving you access to a wide range of libraries and familiar APIs.

## Key benefits
1. Extensive library access: Leverage the vast NPM ecosystem in your Edge Functions.
2. Familiar Node.js APIs: Use built-in Node.js modules you're already familiar with.
3. Code reusability: Easily port existing Node.js code to Supabase Edge Functions.
4. Ecosystem compatibility: Integrate with services and tools designed for Node.js environments.
5. Simplified development: Reduce the learning curve for developers coming from a Node.js background.
6. Flexibility: Choose between Deno-native and Node-compatible libraries as needed.
7. Future-proofing: Adapt existing codebases to edge computing without major rewrites.

## NPM compatibility is particularly valuable for:
- Projects migrating from Node.js-based serverless platforms to Supabase
- Developers looking to leverage specific NPM packages in edge computing scenarios
- Applications requiring Node.js-specific libraries not available in Deno
- Teams with existing Node.js codebases wanting to adopt edge computing
- Rapid prototyping using familiar Node.js modules and APIs
- Any project aiming to balance the benefits of Deno with Node.js ecosystem access

By leveraging NPM Compatibility in Supabase Edge Functions, you can take advantage of the best of both worlds: the modern, secure runtime of Deno and the rich ecosystem of Node.js. This feature allows you to build powerful, efficient edge computing solutions while maintaining access to the tools and libraries you're familiar with, accelerating development and enabling more complex use cases at the edge.
`,
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: 'https://www.youtube-nocookie.com/embed/eCbiywoDORw',
    docsUrl: 'https://supabase.com/blog/edge-functions-node-npm',
    slug: 'npm-compatibility',
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
    products: [PRODUCT_SHORTNAMES.VECTOR],
    heroImage: 'https://www.youtube-nocookie.com/embed/OgnYxRkxEUw',
    docsUrl: 'https://supabase.com/docs/guides/ai/examples/huggingface-image-captioning',
    slug: 'ai-integrations',
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
    docsUrl: 'https://supabase.com/docs/guides/project-management/api',
    slug: 'management-api',
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
    docsUrl: 'https://supabase.com/docs/guides/security/compliance',
    slug: 'soc-2-compliance',
  },
  // Studio
  {
    title: 'AI-Powered Query Assistance',
    subtitle: 'Get help crafting complex SQL queries effortlessly.',
    description: `
The AI-Powered Query Assistance feature in Supabase provides users with intelligent suggestions for writing SQL queries based on natural language input. This tool is designed to enhance productivity and streamline the development process, making it easier for both novice and experienced developers to interact with their databases. By transforming user queries into optimized SQL commands, it reduces the time spent on query formulation and minimizes errors.

## Key benefits
1. User-Friendly: Simplifies the query-writing process by allowing users to express their needs in plain language.
2. Time-Saving: Accelerates development by quickly generating accurate SQL queries.
3. Learning Tool: Acts as a learning resource for new developers to understand SQL syntax and best practices.
4. Error Reduction: Minimizes common mistakes in query formulation through intelligent suggestions.
5. Integration: Seamlessly integrates with existing Supabase projects, enhancing the overall user experience.

This feature is especially beneficial for teams looking to improve their database interaction efficiency while ensuring that all members can contribute effectively, regardless of their SQL expertise.
`,
    icon: Brain,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: 'https://www.youtube-nocookie.com/embed/hu2SQjvCXIw',
    docsUrl:
      'https://supabase.com/blog/studio-introducing-assistant#introducing-the-supabase-assistant',
    slug: 'ai-query-assistance',
  },
  {
    title: 'Logs & Analytics',
    subtitle: 'Gain insights into your application’s performance and usage.',
    description: `
The Logs & Analytics feature in Supabase provides users with comprehensive logging and analytics capabilities, powered by Logflare. This tool enables developers to track and analyze log events from various Supabase services, such as the API gateway, Postgres databases, Storage, Edge Functions, and more. By leveraging a multi-node Elixir cluster, Supabase processes billions of log events daily, ensuring that users have access to critical insights for optimizing their applications.

## Key benefits
1. Real-Time Monitoring: Access live data on application performance and user interactions to make informed decisions.
2. Comprehensive Log Management: Ingest and store logs from multiple sources, allowing for centralized management of application events.
3. Powerful Querying: Utilize SQL queries through Logflare Endpoints to analyze logs efficiently, enabling users to extract meaningful metrics.
4. Customizable Dashboards: Create tailored views within Supabase Studio to visualize log data and track key performance indicators (KPIs).
5. Scalability: Handle large volumes of log data with a robust infrastructure designed for high availability and performance.

This feature is particularly valuable for teams looking to enhance their application's reliability and performance by gaining deeper insights into usage patterns and potential issues.
`,
    icon: Activity,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '/images/features/logs-analytics.png',
    heroImageLight: '/images/features/logs-analytics-light.png',
    docsUrl: 'https://supabase.com/docs/guides/monitoring-troubleshooting/logs',
    slug: 'logs-analytics',
  },
  {
    title: 'Visual Schema Designer',
    subtitle: 'Design your database schema with an intuitive interface.',
    description: `
The Visual Schema Designer feature allows users to create and modify database schemas through a user-friendly drag-and-drop interface. This tool is aimed at simplifying the database design process, making it accessible for users who may not be familiar with traditional SQL commands. By visualizing relationships between tables and fields, users can efficiently plan their database architecture.

## Key benefits
1. Intuitive Design: Facilitates easy schema creation through visual representation.
2. Relationship Mapping: Clearly illustrates how tables are interconnected, aiding in effective database design.
3. Accessibility: Makes database management approachable for non-technical users.
4. Real-Time Updates: Automatically reflects changes in the schema, ensuring consistency across the project.
5. Collaboration: Enhances teamwork by allowing multiple users to contribute to schema design simultaneously.

This feature is particularly valuable for teams engaged in agile development processes where rapid iteration and collaboration are essential.
`,
    icon: RectangleEllipsis,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/visual-schema-designer.png',
    heroImageLight: '/images/features/visual-schema-designer-light.png',
    docsUrl: 'https://supabase.com/blog/supabase-studio-3-0#schema-visualizer',
    slug: 'visual-schema-designer',
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
  },
  {
    title: 'SQL Editor',
    subtitle: 'A powerful interface for writing and executing SQL queries.',
    description: `
The SQL Editor in Supabase Studio provides users with a robust platform for writing, executing, and managing SQL queries directly within their browser. This feature is designed to enhance productivity by offering syntax highlighting, auto-completion, and error detection, making it easier for developers to interact with their databases efficiently.

## Key benefits
1. User-Friendly Interface: Intuitive design that simplifies the process of writing SQL queries.
2. Syntax Highlighting: Enhances readability by color-coding SQL syntax, helping users quickly identify errors.
3. Auto-Completion: Speeds up query writing by suggesting table names, column names, and functions.
4. Execution History: Keeps track of previously executed queries for easy reference and reuse.
5. Error Detection: Provides immediate feedback on syntax errors, reducing debugging time.

This feature is particularly valuable for developers looking to streamline their workflow while ensuring accurate and efficient database interactions.
`,
    icon: FileCode2,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/sql-editor.png',
    heroImageLight: '/images/features/sql-editor-light.png',
    docsUrl: '',
    slug: 'sql-editor',
  },
  {
    title: 'Security & Performance Advisor',
    subtitle: 'Optimize your database security and performance effortlessly.',
    description: `
The Security & Performance Advisor feature in Supabase offers users actionable insights into their database's security posture and performance metrics. By analyzing configurations and usage patterns, this tool identifies potential vulnerabilities and performance bottlenecks, providing recommendations for improvements.

## Key benefits
1. Proactive Security Checks: Regular assessments of security settings to identify vulnerabilities.
2. Performance Optimization: Analyzes query performance to recommend optimizations that enhance efficiency.
3. User-Friendly Dashboard: Presents findings in an easily digestible format within Supabase Studio.
4. Actionable Recommendations: Provides clear steps for addressing identified issues, empowering users to enhance their database environments.
5. Ongoing Monitoring: Continuously evaluates changes in database usage to adapt recommendations accordingly.

This feature is essential for organizations aiming to maintain high security standards while ensuring optimal performance across their applications.
`,
    icon: ShieldPlus,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/security-and-performance-advisor.png',
    heroImageLight: '/images/features/security-and-performance-advisor-light.png',
    docsUrl: 'https://supabase.com/blog/security-and-performance-advisor',
    slug: 'security-and-performance-advisor',
  },
  {
    title: 'Postgres Roles',
    subtitle: 'Managing access to your Postgres database and configuring permissions.',
    description: `
Postgres Roles are a fundamental aspect of managing access permissions within your Supabase database. Roles can function as individual users or groups of users, allowing for flexible permission management. This feature is essential for setting up secure access to your database while enabling efficient collaboration among team members.

Key benefits:
1. Granular Access Control: Configure permissions for various database objects, including tables, views, and functions, using the GRANT command.
2. Role Hierarchy: Organize roles in a hierarchy to simplify permission management, allowing child roles to inherit permissions from parent roles.
3. Secure User Management: Create roles with specific login privileges and strong passwords to ensure secure access to your database.
4. Revocation of Permissions: Easily revoke permissions using the REVOKE command, providing control over who has access to what within your database.
5. Predefined Roles: Supabase extends Postgres with a set of predefined roles, simplifying the initial setup for new projects.

This feature is particularly valuable for teams looking to implement robust security measures while maintaining flexibility in how users interact with their database.
`,
    icon: Users,
    products: [PRODUCT_SHORTNAMES.DATABASE, ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: '/images/features/postgres-roles.png',
    heroImageLight: '/images/features/postgres-roles-light.png',
    docsUrl: 'https://supabase.com/docs/guides/database/postgres/roles',
    slug: 'postgres-roles',
  },
  {
    title: 'Foreign Key Selector',
    subtitle: 'Easily manage foreign key relationships between tables.',
    description: `
The Foreign Key Selector feature simplifies the process of establishing and managing foreign key relationships within your database schema. By providing a visual interface for selecting foreign keys, this tool enhances usability and reduces the likelihood of errors during schema design.

## Key benefits
1. Visual Management: Allows users to easily visualize and select foreign key relationships between tables.
2. Error Reduction: Minimizes mistakes associated with manual foreign key configuration.
3. Streamlined Workflow: Enhances the efficiency of schema design by simplifying complex relationships.
4. Real-Time Updates: Automatically reflects changes made in the foreign key relationships throughout the project.
5. Documentation Support: Provides contextual information about foreign keys to guide users during setup.

This feature is particularly beneficial for developers working with complex data models who need a straightforward way to manage relational integrity within their databases.
`,
    icon: DatabaseZap,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage:
      'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/docs/fk-lookup.mp4',
    docsUrl: 'https://supabase.com/blog/supabase-studio-2.0#foreign-key-selector',
    slug: 'foreign-key-selector',
  },
  {
    title: 'Log Drains',
    subtitle: 'Export logs to external destinations for enhanced monitoring.',
    description: `
Log Drains enable developers to export logs generated by Supabase products—such as the Database, Storage, Realtime, and Auth—to external destinations like Datadog or custom HTTP endpoints. This feature provides a unified view of logs within existing logging and monitoring systems, allowing teams to build robust alerting and observability pipelines.

## Key benefits
1. Centralized Logging: Consolidate logs from multiple Supabase services into a single location for easier management and analysis.
2. Custom Alerting: Ingest logs into Security Information and Event Management (SIEM) or Intrusion Detection Systems (IDS) to create tailored alerting rules based on database events.
3. Extended Retention: Supports longer log retention periods to meet compliance requirements, ensuring data availability for audits and investigations.
4. Flexible Configuration: Easily set up Log Drains through the project settings, with support for popular destinations like Datadog and custom HTTP endpoints.
5. Scalable Architecture: Built on Logflare's multi-node Elixir cluster, allowing for efficient and scalable log dispatching to multiple destinations.

This feature is particularly useful for teams seeking to enhance their observability practices while maintaining compliance and security standards across their applications.
`,
    icon: Activity,
    products: [ADDITIONAL_PRODUCTS.STUDIO],
    heroImage: 'https://www.youtube-nocookie.com/embed/A4GFmvgxS-E',
    docsUrl: 'https://supabase.com/blog/log-drains',
    slug: 'log-drains',
  },
]
