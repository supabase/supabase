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
  Globe2,
  Puzzle,
  Shield,
  DatabaseBackup,
  ShieldPlus,
} from 'lucide-react'
import { PRODUCT, PRODUCT_SHORTNAMES } from 'shared-data/products'
import type { LucideIcon } from 'lucide-react'

enum ADDITIONAL_PRODUCTS {
  PLATFORM = 'Platform',
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
   * Each feature belongs to at most one product.
   * Use more than one if only strictly necessary.
   */
  products: FeatureProductType[]
  /**
   * heroImage can either be an absolute path to an image or to a video
   */
  heroImage: string
  /**
   * url to docs page for this feature
   */
  docsUrl?: string
}

export const features: FeatureType[] = [
  // Database
  {
    title: 'Postgres database',
    subtitle: 'Every project is a full Postgres database.',
    description: `
Supabase provides every project with a fully managed PostgreSQL database, offering unparalleled scalability, reliability, and performance. By leveraging PostgreSQL, developers can harness its powerful features to build robust and complex applications with ease.

Key benefits:
1. Advanced data types: Utilize JSON, arrays, and custom types to store complex data structures efficiently.
2. Powerful indexing: Improve query performance with various indexing options, including B-tree, Hash, and GiST.
3. Full SQL support: Execute complex queries and leverage advanced SQL features for data manipulation and analysis.
4. ACID compliance: Ensure data integrity and consistency with PostgreSQL's transactional capabilities.
5. Extensibility: Add custom functions and extensions to extend database functionality.
6. Scalability: Handle growing data volumes and user loads with PostgreSQL's proven scalability.
7. Community support: Benefit from a large, active community and extensive documentation.

With Supabase's managed PostgreSQL database, you can focus on building your application while we handle the complexities of database management, including backups, updates, and scaling. This allows for faster development cycles and reduced operational overhead, ultimately leading to quicker time-to-market for your projects.
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/overview',
    slug: 'postgres-database',
  },
  {
    title: 'Vector database',
    subtitle: 'Store vector embeddings right next to the rest of your data.',
    description: `
Supabase's vector database feature empowers users to store and query vector embeddings alongside traditional data, unlocking powerful capabilities for machine learning, natural language processing, and advanced search functionalities. This seamless integration of vector data with your existing database structure opens up a world of possibilities for AI-driven applications.

Key benefits:
1. Unified data storage: Keep vector embeddings and relational data in one place, simplifying your data architecture.
2. Efficient similarity search: Perform fast and accurate similarity searches on high-dimensional data.
3. Seamless integration: Easily incorporate vector search into existing applications without additional infrastructure.
4. Scalability: Handle large volumes of vector data with PostgreSQL's proven scalability.
5. Cost-effective: Eliminate the need for separate vector databases, reducing infrastructure costs.
6. Advanced querying: Combine vector similarity search with traditional SQL queries for powerful hybrid searches.
7. Real-time updates: Continuously update and query vector data without complex ETL processes.

By leveraging Supabase's vector database capabilities, developers can build sophisticated AI and ML applications with features like:
- Semantic search engines
- Recommendation systems
- Image and audio similarity matching
- Natural language understanding
- Anomaly detection in time-series data

This feature democratizes access to advanced AI capabilities, allowing developers to create intelligent, data-driven applications without the need for specialized infrastructure or expertise in vector databases.
`,
    icon: ChartScatter,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/ai',
    slug: 'vector-database',
  },
  {
    title: 'Auto-generated REST API via PostgREST',
    subtitle: 'RESTful APIs auto-generated from your database.',
    description: `
Supabase automatically generates a comprehensive RESTful API from your database schema, powered by PostgREST. This feature dramatically accelerates development by eliminating the need to write boilerplate server-side code for basic CRUD operations.

Key benefits:
1. Rapid development: Instantly access your data through a RESTful API without writing any backend code.
2. Automatic updates: API endpoints automatically reflect changes in your database schema, ensuring consistency.
3. Flexible querying: Use powerful query parameters to filter, sort, and paginate data directly from API calls.
4. Custom operations: Easily expose custom database functions as API endpoints for complex operations.
5. Secure by default: Leverage PostgreSQL's role-based access control for built-in API security.
6. Performance: Benefit from PostgREST's optimized query execution for efficient API responses.
7. Standardized interface: Work with a well-documented, consistent API across all your database tables.

The auto-generated REST API is ideal for:
- Quickly prototyping applications
- Building mobile app backends
- Creating data-driven dashboards
- Integrating with third-party services
- Developing serverless applications

By using Supabase's auto-generated REST API, developers can focus on building front-end features and business logic, rather than spending time on API development and maintenance. This leads to faster iteration cycles, reduced development costs, and more robust, scalable applications.

The API's adherence to REST principles also ensures broad compatibility with various programming languages and frameworks, making it easy to integrate Supabase into your existing technology stack or future projects.
`,
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/api#rest-api-overview',
    slug: 'auto-generated-rest-api',
  },
  {
    title: 'Auto-generated GraphQL API via pg_graphql',
    subtitle: 'Fast GraphQL APIs using our custom Postgres GraphQL extension.',
    description: `
Supabase offers lightning-fast GraphQL APIs through its custom-built PostgreSQL GraphQL extension, pg_graphql. This feature allows developers to harness the power of GraphQL without the need for additional servers or complex setups, providing a seamless and efficient way to query and manipulate data.

Key benefits:
1. Simplified data fetching: Retrieve exactly the data you need in a single request, reducing over-fetching and under-fetching.
2. Automatic schema generation: GraphQL schema is automatically derived from your PostgreSQL schema, ensuring consistency.
3. Real-time updates: Combine with Supabase's real-time features for live data subscriptions.
4. Improved performance: Leverage PostgreSQL's query optimization capabilities for efficient GraphQL resolvers.
5. Type safety: Benefit from GraphQL's strong typing system, reducing runtime errors and improving developer experience.
6. Flexible querying: Allow clients to request complex, nested data structures in a single query.
7. Built-in documentation: Utilize GraphQL's introspection feature for self-documenting APIs.

The auto-generated GraphQL API is particularly beneficial for:
- Single-page applications (SPAs) requiring efficient data loading
- Mobile apps needing to minimize data transfer
- Complex UIs with varying data requirements
- Projects requiring rapid iteration on data models
- Applications with deeply nested data structures

By using Supabase's GraphQL API, developers can significantly reduce the complexity of their data fetching logic, leading to cleaner, more maintainable code. The declarative nature of GraphQL queries also improves the collaboration between frontend and backend teams, as the API becomes more self-service and discoverable.

Moreover, the tight integration with PostgreSQL ensures that you can leverage the full power of your database, including complex joins, aggregations, and custom functions, all through a single GraphQL endpoint. This combination of flexibility, performance, and ease of use makes Supabase's GraphQL API a powerful tool for building modern, data-intensive applications.
`,
    icon: Braces,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/graphql/api',
    slug: 'auto-generated-graphql-api',
  },
  {
    title: 'Database backups',
    subtitle: 'Projects are backed up daily with Point in Time recovery options.',
    description: `
Supabase ensures the safety and recoverability of your data with comprehensive backup solutions, including daily backups and Point-in-Time Recovery (PITR) options. This robust backup strategy provides peace of mind and data protection for mission-critical applications and valuable information.

Key benefits:
1. Data security: Safeguard against accidental deletions, corruptions, or other data loss scenarios.
2. Business continuity: Minimize downtime and ensure quick recovery in case of unexpected incidents.
3. Compliance support: Meet regulatory requirements for data retention and disaster recovery.
4. Flexible recovery options: Choose from daily backups or precise point-in-time recovery to suit your needs.
5. Automated process: Eliminate the need for manual backup management, reducing human error and operational overhead.
6. Scalability: Backups scale automatically with your database size, ensuring comprehensive protection as you grow.
7. Historical data access: Easily access and restore historical data states for auditing or analysis purposes.

Supabase's backup features are crucial for:
- Protecting against data loss due to user errors or application bugs
- Recovering from hardware failures or other infrastructure issues
- Meeting compliance requirements in regulated industries
- Facilitating data migration or cloning for testing and development
- Enabling quick rollback of database changes during deployments

With daily backups, you can restore your entire database to the state it was in at the end of any of the previous seven days. This is particularly useful for recovering from major incidents or when you need to revert to a known good state.

The Point-in-Time Recovery option provides even more granular control, allowing you to restore your database to any specific moment within the retention period. This is invaluable for recovering from immediate issues or for extracting data from a precise historical state.

By leveraging Supabase's robust backup solutions, developers and businesses can focus on building and growing their applications with the confidence that their data is protected and recoverable, no matter what challenges arise.
`,
    icon: DatabaseBackup,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/backups',
    slug: 'database-backups',
  },
  {
    title: 'Custom domains',
    subtitle: 'White-label the Supabase APIs for a branded experience.',
    description: `
Supabase's custom domain feature allows you to use your own domain names for Supabase services, providing a seamless, branded experience for your users. This white-labeling capability enhances your application's professional appearance and strengthens your brand identity.

Key benefits:
1. Brand consistency: Maintain a cohesive brand image across all user touchpoints, including API endpoints.
2. Improved SEO: Use your own domain for better search engine optimization and brand recognition.
3. Enhanced trust: Increase user confidence by serving content from your trusted domain.
4. Simplified integration: Streamline development by using consistent domain names across environments.
5. Flexibility: Easily switch between development, staging, and production environments using subdomains.
6. SSL support: Automatically provision and renew SSL certificates for your custom domains.
7. Professional appearance: Present a more polished, enterprise-grade solution to clients and partners.

Custom domains are particularly valuable for:
- SaaS applications requiring a white-labeled infrastructure
- Enterprise solutions where client branding is crucial
- Resellers and agencies managing multiple client projects
- Open-source projects aiming for a cohesive ecosystem
- Mobile apps requiring a consistent backend domain

Implementing custom domains with Supabase is straightforward:
1. Verify domain ownership through DNS configuration
2. Choose which Supabase services to associate with your domain
3. Supabase handles SSL certificate provisioning and renewal

By using custom domains, you create a more professional and trustworthy appearance for your application. Users interact with your brand consistently, from the frontend to API calls and authentication processes. This seamless experience can lead to increased user trust, better brand recall, and a more cohesive overall product.

Moreover, custom domains provide flexibility in managing multiple environments (development, staging, production) and facilitate easier transitions between them. This can significantly streamline your development and deployment processes, leading to faster iteration and more efficient project management.
`,
    icon: Globe,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/custom-domains',
    slug: 'custom-domains',
  },
  {
    title: 'Network restrictions',
    subtitle: 'Restrict IP ranges that can connect to your database.',
    description: `
Supabase's network restrictions feature allows you to define and control which IP addresses or ranges can access your database. This powerful security measure significantly enhances your application's data protection by creating a robust first line of defense against unauthorized access attempts.

Key benefits:
1. Enhanced security: Limit database access to known, trusted IP addresses, reducing the attack surface.
2. Compliance support: Meet regulatory requirements for data access control in industries like finance and healthcare.
3. Granular control: Set different access rules for various environments (e.g., development, staging, production).
4. Flexibility: Easily update allowed IP ranges as your network infrastructure changes.
5. Audit trail: Monitor and log access attempts for security analysis and compliance reporting.
6. Reduced risk: Mitigate the impact of compromised credentials by adding an additional layer of security.
7. Geographical restrictions: Limit access to specific countries or regions for data sovereignty compliance.

Network restrictions are particularly valuable for:
- Enterprise applications handling sensitive data
- Financial services requiring strict access controls
- Healthcare systems subject to HIPAA compliance
- Government and public sector projects with stringent security requirements
- Multi-tenant SaaS platforms needing to isolate client data access

Implementing network restrictions with Supabase is straightforward:
1. Define allowed IP ranges through the Supabase dashboard or API
2. Optionally, set up different rules for read and write operations
3. Monitor access logs to ensure the effectiveness of your restrictions

By leveraging network restrictions, you create a more secure environment for your data. This feature is especially crucial when combined with other security measures like strong authentication and encryption. It provides an additional layer of protection against various attack vectors, including:
- Brute force attempts from unknown IP ranges
- Unauthorized access from compromised devices outside your network
- Potential data exfiltration to unexpected geographical locations

Moreover, network restrictions can help in scenarios where you need to ensure that only specific office locations, VPNs, or trusted third-party services can interact with your database. This level of control is invaluable for maintaining the integrity and confidentiality of your data, especially in highly regulated industries or when handling sensitive information.

By implementing network restrictions, you not only enhance your security posture but also demonstrate a commitment to data protection that can build trust with your users and stakeholders.
`,
    icon: UserX,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/network-restrictions',
    slug: 'network-restrictions',
  },
  {
    title: 'SSL enforcement',
    subtitle: 'Enforce secure connections to your Postgres clients.',
    description: `
Supabase's SSL enforcement feature ensures that all connections to your Postgres database are encrypted, providing a crucial layer of security for your data in transit. By mandating SSL connections, you protect your application's data from potential eavesdropping, tampering, and man-in-the-middle attacks.

Key benefits of using Supabase's SSL enforcement include:
1. Data encryption: All data transmitted between your application and the database is encrypted
2. Integrity protection: Prevent data tampering during transmission
3. Authentication: Ensure that your application is connecting to the genuine database server
4. Compliance support: Meet industry standards and regulatory requirements for data protection
5. Simplified security: Automatically enforce best practices for secure database connections

By leveraging this feature, you can:
- Protect sensitive information from interception during transmission
- Prevent unauthorized access through secure client authentication
- Maintain data integrity by detecting any attempts at data manipulation
- Simplify compliance with data protection regulations like GDPR, HIPAA, or PCI DSS
- Enhance overall application security without additional development effort

Supabase's SSL enforcement is particularly valuable for:
- Applications handling personal or sensitive user data
- Financial services requiring secure transactions
- Healthcare applications dealing with patient information
- E-commerce platforms processing payment data
- Any application where data privacy and integrity are paramount

With SSL enforcement, you're not just adding a security feature – you're implementing a fundamental best practice in data protection. This feature ensures that every interaction with your database, whether from your application servers, admin tools, or API calls, is encrypted and secure.

Experience the confidence that comes from knowing all your database connections are protected by industry-standard encryption. Supabase's SSL enforcement feature provides a robust foundation for your application's security, allowing you to focus on building features while ensuring that your data remains confidential and protected at all times.
`,
    icon: ShieldCheck,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/ssl-enforcement',
    slug: 'ssl-enforcement',
  },
  {
    title: 'Branching',
    subtitle: 'Test and preview changes using Supabase Branches.',
    description: `
Supabase Branches allow developers to create isolated environments for testing and previewing database changes before merging them into the main production environment. This powerful feature streamlines the development process, enhances collaboration, and reduces the risk of introducing errors into live systems.

Key benefits:
1. Risk-free experimentation: Test schema changes, new features, or data migrations without affecting the production environment.
2. Improved collaboration: Enable multiple team members to work on different features simultaneously without conflicts.
3. Easier code reviews: Facilitate thorough reviews of database changes before they're applied to production.
4. Rapid iteration: Quickly prototype and validate database-driven features in isolated environments.
5. Enhanced quality assurance: Conduct comprehensive testing in a production-like environment before deployment.
6. Version control for databases: Manage database changes with the same rigor as application code.
7. Simplified rollbacks: Easily revert to previous database states if issues are discovered.

Supabase Branches are particularly valuable for:
- Agile development teams working on multiple features concurrently
- Projects with complex database schemas requiring careful management
- Applications undergoing significant refactoring or upgrades
- Continuous Integration/Continuous Deployment (CI/CD) pipelines
- Collaborative environments where multiple developers modify the database

Using Supabase Branches is straightforward:
1. Create a new branch from your main database
2. Make and test changes in the isolated branch environment
3. Preview the changes and conduct thorough testing
4. Merge the branch back into the main environment when ready

By leveraging Supabase Branches, development teams can adopt a more agile and confident approach to database management. This feature allows for:
- Parallel development of multiple features without interference
- Easy creation of staging environments for client demos or user acceptance testing
- Experimentation with new database designs or optimization strategies
- Simplified management of long-running feature developments

Moreover, Branches integrate seamlessly with Supabase's other features, such as the auto-generated APIs and real-time subscriptions, ensuring that your entire development ecosystem remains consistent across different environments.

Embracing database branching as part of your development workflow can lead to faster iteration cycles, reduced downtime, and ultimately, a more robust and reliable application. It empowers teams to innovate freely while maintaining the stability and integrity of their production systems.
`,
    icon: GitBranch,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/branching',
    slug: 'branching',
  },
  {
    title: 'Terraform provider',
    subtitle: 'Manage Supabase infrastructure via Terraform.',
    description: `
Supabase's Terraform provider empowers developers and DevOps teams to manage their Supabase infrastructure as code, bringing the benefits of Infrastructure as Code (IaC) to your database and backend services. This integration allows for version-controlled, reproducible, and scalable management of your Supabase resources.

Key benefits:
1. Version control: Track and manage changes to your Supabase infrastructure alongside your application code.
2. Reproducibility: Easily recreate entire environments for development, staging, and production.
3. Automated provisioning: Streamline the setup of new projects or environments with automated scripts.
4. Consistency: Ensure all environments are identical, reducing "works on my machine" issues.
5. Scalability: Effortlessly manage multiple Supabase projects across various teams or clients.
6. Disaster recovery: Quickly rebuild your infrastructure in case of major issues or when setting up in new regions.
7. Collaboration: Improve team coordination by reviewing infrastructure changes through pull requests.

The Terraform provider is particularly valuable for:
- Enterprise-level projects requiring strict infrastructure governance
- DevOps teams implementing continuous deployment pipelines
- Multi-environment setups (development, staging, production)
- Agencies or consultancies managing multiple client projects
- Open-source projects aiming for easy contributor onboarding

Using the Supabase Terraform provider allows you to:
1. Define and manage database resources (tables, functions, policies)
2. Configure authentication settings and providers
3. Set up storage buckets and policies
4. Manage API and real-time settings
5. Control project-level configurations

By adopting Terraform for Supabase management, teams can:
- Implement GitOps practices for infrastructure management
- Automate the creation of consistent environments across different stages of development
- Easily roll back infrastructure changes if issues are discovered
- Audit and track all changes to the infrastructure over time

Moreover, the Terraform provider integrates seamlessly with other cloud resources, allowing you to manage your entire stack (including Supabase, cloud providers, and other services) in a unified, declarative manner. This holistic approach to infrastructure management can significantly reduce operational overhead and minimize configuration drift between environments.

Embracing Infrastructure as Code through the Supabase Terraform provider leads to more reliable, maintainable, and scalable backend infrastructures. It empowers teams to focus on building features rather than managing infrastructure, ultimately accelerating development cycles and improving overall product quality.
`,
    icon: Package,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/terraform-provider',
    slug: 'terraform-provider',
  },
  {
    title: 'Read replicas',
    subtitle: 'Deploy read-only databases across multiple regions for lower latency.',
    description: `
Supabase's read replicas feature allows you to deploy read-only copies of your database across multiple geographic regions, significantly enhancing the performance and reliability of your application. This powerful capability enables you to serve data to your users with minimal latency, regardless of their location.

Key benefits:
1. Improved performance: Serve data from the nearest geographic location, reducing response times for users worldwide.
2. Increased availability: Distribute read traffic across multiple replicas, enhancing system resilience and uptime.
3. Scalability: Handle higher read loads by offloading queries to read replicas, freeing up the primary database for write operations.
4. Global reach: Expand your application's user base globally without sacrificing performance.
5. Disaster recovery: Use read replicas as hot standbys for quick failover in case of primary database issues.
6. Analytics and reporting: Run resource-intensive reporting queries on replicas without impacting production performance.
7. Cost optimization: Reduce data transfer costs by serving data from regions closer to your users.

Read replicas are particularly valuable for:
- Global applications serving users across different continents
- High-traffic websites and applications with read-heavy workloads
- Real-time analytics dashboards requiring low-latency data access
- Content delivery networks needing fast access to dynamic data
- Disaster recovery strategies requiring quick failover capabilities

Implementing read replicas with Supabase is straightforward:
1. Choose the regions where you want to deploy read replicas
2. Supabase handles the replication process and keeps replicas in sync
3. Configure your application to route read queries to the nearest replica

By leveraging read replicas, you can achieve:
- Consistent low-latency performance for users around the world
- Improved application responsiveness, especially for read-heavy operations
- Better resource utilization by distributing database load
- Enhanced system reliability through redundancy and quick failover options

Moreover, read replicas integrate seamlessly with Supabase's other features, such as real-time subscriptions and auto-generated APIs, ensuring that your entire stack benefits from the improved performance and reliability.

Adopting read replicas as part of your database strategy can lead to significant improvements in user experience, especially for applications with a global user base. It allows you to scale your read capacity independently of your write capacity, providing a cost-effective way to handle growing traffic and data volumes while maintaining high performance and availability.
`,
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/read-replicas',
    slug: 'read-replicas',
  },
  {
    title: 'Fly Postgres',
    subtitle: 'Launch the Supabase stack on Fly.io edge network.',
    description: `
Supabase's integration with Fly.io allows you to deploy your entire Supabase stack, including the PostgreSQL database, on Fly's global edge network. This powerful combination brings your data closer to your users, dramatically reducing latency and improving application performance worldwide.

Key benefits:
1. Global performance: Serve data from edge locations around the world, minimizing latency for all users.
2. Simplified deployment: Easily deploy your entire Supabase stack with Fly.io's infrastructure.
3. Scalability: Leverage Fly.io's ability to automatically scale based on demand.
4. Cost-efficiency: Optimize resource usage and reduce costs with Fly.io's efficient containerization.
5. Consistency: Maintain a consistent environment across development and production.
6. Edge computing capabilities: Run compute-intensive tasks closer to your data and users.
7. Improved reliability: Benefit from Fly.io's distributed infrastructure for enhanced uptime.

Fly Postgres is particularly valuable for:
- Global applications requiring low-latency database access worldwide
- Startups looking for an easy-to-deploy, scalable database solution
- Edge computing scenarios where data processing needs to happen close to users
- Applications with strict data residency requirements in multiple regions
- Development teams seeking a consistent environment from local to production

Implementing Fly Postgres with Supabase offers:
1. One-click deployment of your Supabase stack on Fly.io
2. Automatic distribution of your database to optimal geographic locations
3. Seamless integration with other Supabase features like auth and real-time subscriptions

By leveraging Fly Postgres, you can achieve:
- Consistently low latency for database operations, regardless of user location
- Simplified global deployment without managing complex infrastructure
- Improved application responsiveness, especially for data-intensive operations
- Easy compliance with data residency regulations in different regions

Moreover, the combination of Supabase and Fly.io provides a powerful platform for building edge-native applications. This allows you to push not just your data, but also your application logic closer to users, enabling new possibilities for real-time, low-latency applications.

Adopting Fly Postgres as your deployment strategy can lead to significant improvements in global performance and user experience. It allows you to focus on building your application features while leveraging a robust, globally distributed infrastructure that scales with your needs.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/fly-postgres',
    slug: 'fly-postgres',
  },
  // Extensions
  {
    title: 'Postgres Extensions',
    subtitle: 'Enhance your database with popular Postgres extensions.',
    description: `
Supabase supports a wide array of PostgreSQL extensions, allowing you to supercharge your database with additional functionalities and capabilities. These extensions enable you to tailor your database to your specific needs, whether you're working with geospatial data, full-text search, or advanced analytics.

Key benefits:
1. Enhanced functionality: Add specialized features to your database without changing your application architecture.
2. Optimized performance: Leverage extensions for efficient data processing and querying.
3. Flexibility: Choose from a vast ecosystem of extensions to meet your specific project requirements.
4. Easy integration: Seamlessly incorporate powerful features into your existing database structure.
5. Community-driven innovations: Benefit from extensions developed and maintained by the PostgreSQL community.
6. Cost-effective solutions: Implement complex features without the need for separate, specialized databases.
7. Scalability: Many extensions are designed to work efficiently with large datasets.

Popular Postgres extensions supported by Supabase include:
- PostGIS: For working with geospatial data and location-based services
- pg_vector: Enables efficient similarity search and machine learning operations
- pgcrypto: Provides cryptographic functions directly in the database
- pgjwt: Allows for JSON Web Token (JWT) generation and verification
- pg_net: Enables making HTTP requests directly from the database
- pgroonga: Provides full-text search capabilities for various languages
- timescaledb: Optimizes the database for time-series data

These extensions are particularly valuable for:
- GIS applications requiring advanced spatial querying and analysis
- AI and machine learning projects needing vector operations
- Security-focused applications that require robust encryption
- Microservices architectures leveraging JWT for authentication
- Applications requiring advanced full-text search capabilities
- IoT projects dealing with large volumes of time-series data

By leveraging Postgres extensions, you can:
- Implement complex features more easily and efficiently
- Reduce the need for external services, simplifying your architecture
- Improve query performance for specialized data types and operations
- Take advantage of PostgreSQL's extensibility to tailor the database to your needs

Supabase makes it easy to enable and use these extensions, often with just a few clicks in the dashboard or simple SQL commands. This allows you to quickly enhance your database capabilities without the need for complex setup or configuration.

Embracing Postgres extensions can significantly accelerate your development process, enabling you to build more powerful and feature-rich applications while leveraging the robust and reliable PostgreSQL ecosystem.
`,
    icon: Puzzle,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions',
    slug: 'postgres-extensions',
  },
  // Realtime
  {
    title: 'Postgres changes',
    subtitle: 'Receive your database changes through websockets.',
    description: `
Supabase's Postgres Changes feature allows you to receive real-time notifications of database changes through WebSockets. This powerful capability enables you to build responsive, live-updating applications that reflect database changes instantly, without the need for polling or complex pub/sub systems.

Key benefits:
1. Real-time updates: Receive instant notifications when data changes, enabling live-updating UIs.
2. Efficient data syncing: Keep client-side data in sync with the database without constant API calls.
3. Reduced server load: Eliminate the need for frequent polling, decreasing server load and improving performance.
4. Flexible subscriptions: Subscribe to specific tables, rows, or columns based on your application's needs.
5. Scalability: Handle large numbers of concurrent users with minimal additional server resources.
6. Simplified architecture: Implement real-time features without the need for separate messaging systems.
7. Improved user experience: Provide users with up-to-date information without page refreshes.

Postgres Changes are particularly valuable for:
- Collaborative applications where multiple users work on shared data
- Real-time dashboards and analytics platforms
- Live chat and messaging systems
- Stock trading or auction platforms requiring instant updates
- IoT applications needing to reflect sensor data changes in real-time

Implementing Postgres Changes with Supabase is straightforward:
1. Enable real-time functionality for your desired tables
2. Use Supabase client libraries to subscribe to changes
3. Handle incoming change events in your application logic

By leveraging Postgres Changes, you can create more engaging and responsive applications that provide users with the most current data available. This feature opens up possibilities for building real-time collaborative tools, live-updating feeds, and instant notification systems, all while maintaining the simplicity and power of a PostgreSQL database.
`,
    icon: DatabaseZap,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/postgres-changes',
    slug: 'postgres-changes',
  },
  {
    title: 'Broadcast',
    subtitle: 'Send messages between connected users through websockets.',
    description: `
Supabase's Broadcast feature enables real-time communication between connected users through WebSockets. This powerful functionality allows you to build interactive, collaborative applications where users can instantly share messages, updates, or any type of data in real-time.

Key benefits:
1. Instant communication: Enable real-time messaging and data sharing between users.
2. Low latency: Achieve near-instantaneous data transmission for time-sensitive applications.
3. Scalability: Handle large numbers of concurrent users and high message volumes efficiently.
4. Flexible message types: Transmit various types of data, from simple text to complex JSON objects.
5. Reduced server load: Implement real-time features without constant API polling.
6. Simplified architecture: Build real-time applications without managing complex messaging infrastructure.
7. Enhanced user engagement: Create interactive, collaborative experiences that keep users connected.

Broadcast is particularly valuable for:
- Chat applications and messaging platforms
- Collaborative tools like shared documents or whiteboards
- Multiplayer games requiring real-time state synchronization
- Live auction or bidding systems
- Real-time commenting systems for blogs or social media platforms
- Interactive presentations or educational platforms

Implementing Broadcast with Supabase is straightforward:
1. Set up a broadcast channel in your Supabase project
2. Use Supabase client libraries to subscribe to and send messages on the channel
3. Handle incoming broadcast messages in your application logic

By leveraging Broadcast, you can create highly interactive and engaging applications that foster real-time collaboration and communication. This feature enables you to build sophisticated real-time functionalities without the complexity of managing your own WebSocket servers or message queues, allowing you to focus on creating unique and valuable user experiences.
`,
    icon: MessageCircle,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/broadcast',
    slug: 'broadcast',
  },
  {
    title: 'Presence',
    subtitle: 'Synchronize shared state between users through websockets.',
    description: `
Supabase's Presence feature allows you to track and synchronize shared state between connected users in real-time. This powerful capability enables you to build collaborative applications where users can see each other's status, actions, or any custom state information instantly.

Key benefits:
1. Real-time user tracking: Monitor which users are currently active or online.
2. Custom state synchronization: Share and update any type of state information in real-time.
3. Automatic conflict resolution: Handle concurrent updates with built-in conflict resolution.
4. Scalability: Efficiently manage state for large numbers of concurrent users.
5. Reduced complexity: Implement shared state features without building custom synchronization logic.
6. Enhanced interactivity: Create more engaging, collaborative user experiences.
7. Flexible use cases: Adapt the feature for various applications, from simple online indicators to complex collaborative tools.

Presence is particularly valuable for:
- Collaborative document editing platforms
- Multiplayer games showing player positions or status
- Team collaboration tools with user availability indicators
- Live streaming platforms displaying viewer counts and engagement
- Project management applications with real-time task assignments
- Social media platforms showing active users in a group or chat

Implementing Presence with Supabase is straightforward:
1. Define the structure of your presence state
2. Use Supabase client libraries to join presence channels and update state
3. Handle presence events (joins, leaves, updates) in your application logic

By leveraging Presence, you can create highly interactive and collaborative applications that provide users with real-time awareness of others' actions and status. This feature enables you to build sophisticated real-time functionalities without the complexity of managing your own state synchronization systems, allowing you to focus on creating unique and valuable user experiences.
`,
    icon: Users,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/presence',
    slug: 'presence',
  },
  // Auth
  {
    title: 'Email login',
    subtitle: 'Build email logins for your application or website.',
    description: `
Supabase's Email Login feature provides a secure and customizable way to implement email-based authentication in your applications. This essential functionality allows users to create accounts and sign in using their email addresses, providing a familiar and widely accepted authentication method.

Key benefits:
1. Secure authentication: Implement industry-standard security practices for email-based logins.
2. Customizable workflows: Tailor the signup and login processes to fit your application's needs.
3. Password reset functionality: Easily implement secure password reset flows.
4. Email verification: Verify user email addresses to ensure account authenticity.
5. Seamless integration: Integrate email login with Supabase's other auth providers and features.
6. Scalability: Handle large numbers of users with Supabase's robust infrastructure.
7. GDPR compliance: Implement user data management practices in line with privacy regulations.

Email login is particularly valuable for:
- SaaS applications requiring user accounts
- E-commerce platforms with customer profiles
- Community websites and forums
- Educational platforms with student accounts
- Enterprise applications with employee logins
- Any application needing to associate data with specific users

Implementing Email Login with Supabase is straightforward:
1. Enable email auth provider in your Supabase project settings
2. Customize email templates for verification and password reset
3. Use Supabase client libraries to handle signup, login, and logout flows
4. Implement UI components for login forms and user profile management

By leveraging Email Login, you can quickly implement a robust, secure authentication system in your application. This feature provides a solid foundation for user management, allowing you to focus on building your core application features while ensuring that user accounts are handled securely and efficiently.
`,
    icon: Mail,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/email-login',
    slug: 'email-login',
  },
  {
    title: 'Social login',
    subtitle: 'Provide social logins from platforms like Apple, GitHub, and Slack.',
    description: `
Supabase's Social Login feature allows users to authenticate using their existing accounts from popular social platforms and services. This streamlined authentication method enhances user experience by providing quick, password-free access to your application.

Key benefits:
1. Simplified onboarding: Reduce friction in the signup process, potentially increasing conversion rates.
2. Trusted authentication: Leverage the security measures of established platforms.
3. Rich user profiles: Access additional user information (with permission) from social providers.
4. Multiple provider support: Offer login options through various popular platforms like Google, Facebook, Twitter, and more.
5. Reduced password fatigue: Allow users to access your app without creating and remembering another password.
6. Increased security: Benefit from the robust security measures implemented by major social platforms.
7. Easy account linking: Enable users to link multiple social accounts to a single app account.

Social login is particularly valuable for:
- Mobile apps seeking to minimize user input
- E-commerce platforms aiming to reduce cart abandonment rates
- Content platforms looking to personalize user experiences
- Community-driven websites fostering user engagement
- B2B applications integrating with professional networks like LinkedIn
- Any application targeting users who frequently use social media

Implementing Social Login with Supabase is straightforward:
1. Enable desired social providers in your Supabase project settings
2. Configure OAuth credentials for each provider
3. Use Supabase client libraries to implement social login flows
4. Handle successful logins and user profile management in your app

By leveraging Social Login, you can significantly improve your application's user experience, potentially increasing signup rates and user engagement. This feature allows you to offload much of the complexity and security concerns of user authentication to established platforms, while still maintaining control over user data and experiences within your application.
`,
    icon: Users,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/social-login',
    slug: 'social-login',
  },
  {
    title: 'Phone logins',
    subtitle: 'Provide phone logins using a third-party SMS provider.',
    description: `
Supabase's Phone Login feature enables users to authenticate using their phone numbers, providing a convenient and secure alternative to traditional email-based logins. This method is particularly effective for mobile applications and services where phone numbers are a primary means of user identification.

Key benefits:
1. Simplified authentication: Allow users to sign up and log in using just their phone number.
2. Enhanced security: Implement two-factor authentication (2FA) using SMS verification codes.
3. Reduced friction: Eliminate the need for users to remember complex passwords.
4. Global accessibility: Provide an authentication method that works across different countries and languages.
5. Verified user base: Ensure that each account is associated with a unique, verifiable phone number.
6. Customizable flows: Tailor the login process to fit your application's specific needs.
7. Integration with messaging: Easily send notifications or updates to users via SMS.

Phone login is particularly valuable for:
- Mobile apps prioritizing quick and easy onboarding
- Ride-sharing or delivery services requiring verified user contact information
- Banking and fintech applications needing secure, phone-based authentication
- Messaging platforms where phone numbers serve as user identifiers
- Local service marketplaces connecting customers with providers
- Any application targeting users in regions where phone usage exceeds email usage

Implementing Phone Login with Supabase is straightforward:
1. Enable phone auth provider in your Supabase project settings
2. Set up a third-party SMS provider for sending verification codes
3. Use Supabase client libraries to handle phone number verification and login flows
4. Implement UI components for phone number input and code verification

By leveraging Phone Login, you can create a seamless authentication experience that's particularly well-suited for mobile and SMS-centric applications. This feature not only simplifies the login process for users but also provides an additional layer of security through phone number verification, helping to build a trusted and verifiable user base for your application.
`,
    icon: Smartphone,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/phone-login',
    slug: 'phone-logins',
  },
  {
    title: 'Passwordless login via Magic Links',
    subtitle: 'Build passwordless logins via magic links for your application or website.',
    description: `
Supabase's Passwordless Login via Magic Links feature offers a secure and user-friendly authentication method that eliminates the need for traditional passwords. Instead, users receive a unique, time-limited link via email that instantly logs them into your application.

Key benefits:
1. Enhanced security: Eliminate vulnerabilities associated with weak or reused passwords.
2. Improved user experience: Remove the friction of remembering and entering passwords.
3. Reduced support overhead: Decrease password-related support requests (resets, account lockouts).
4. Instant access: Provide quick, one-click access to your application.
5. Cross-device compatibility: Allow seamless login across multiple devices without password sync.
6. Phishing resistance: Increase security by sending authentication links directly to verified email addresses.
7. Simplified onboarding: Lower the barrier to entry for new users by removing password creation steps.

Passwordless login via Magic Links is particularly valuable for:
- SaaS platforms prioritizing security and user experience
- Financial applications requiring strong authentication
- E-commerce sites aiming to reduce cart abandonment due to login friction
- Enterprise applications managing access for large numbers of employees
- Educational platforms providing easy access for students and educators
- Any application targeting users fatigued by managing multiple passwords

Implementing Passwordless Login with Supabase is straightforward:
1. Enable Magic Link authentication in your Supabase project settings
2. Customize email templates for Magic Link delivery
3. Use Supabase client libraries to initiate Magic Link requests and handle successful logins
4. Implement UI components for email input and login flow

By leveraging Passwordless Login via Magic Links, you can significantly enhance both the security and usability of your application's authentication system. This feature not only simplifies the login process for users but also aligns with modern security best practices by eliminating password-related vulnerabilities. It's an excellent choice for applications looking to provide a frictionless yet secure authentication experience.
`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/passwordless-login',
    slug: 'passwordless-login',
  },
  {
    title: 'Multi-Factor Authentication (MFA)',
    subtitle: 'Add an extra layer of security to your application with MFA.',
    description: `
Supabase's Multi-Factor Authentication (MFA) feature provides an additional layer of security for user accounts by requiring two or more verification factors to gain access. This significantly enhances the protection of user accounts against unauthorized access, even if passwords are compromised.

Key benefits:
1. Enhanced security: Dramatically reduce the risk of unauthorized account access.
2. Customizable factors: Support various second factors like SMS, email, or authenticator apps.
3. User trust: Demonstrate a commitment to protecting user data and privacy.
4. Compliance: Meet security requirements for regulated industries and data protection laws.
5. Adaptive authentication: Implement risk-based MFA for sensitive operations or unusual login patterns.
6. Self-service management: Allow users to enroll in and manage their own MFA settings.
7. Account recovery: Implement secure account recovery processes for users who lose access to their second factor.

Multi-Factor Authentication is particularly valuable for:
- Financial services and banking applications handling sensitive financial data
- Healthcare platforms managing protected health information
- Enterprise applications with access to confidential business data
- E-commerce sites protecting user payment information
- Government and public sector applications requiring high security standards
- Any application storing personally identifiable information (PII) or sensitive user data

Implementing MFA with Supabase is straightforward:
1. Enable MFA in your Supabase project settings
2. Choose and configure supported second factors (e.g., TOTP, SMS)
3. Use Supabase client libraries to implement MFA enrollment and verification flows
4. Create UI components for factor enrollment, verification, and management

By leveraging Multi-Factor Authentication, you significantly enhance the security posture of your application, providing users with a robust defense against various types of account compromise attempts. This feature not only protects your users but also demonstrates your commitment to security, helping to build trust and credibility with your user base.
`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/passwordless-login',
    slug: 'passwordless-login',
  },
  {
    title: 'Role-Based Access Control (RBAC)',
    icon: ShieldPlus,
    subtitle: 'Define and manage user roles securely',
    description: `
Supabase's Role-Based Access Control (RBAC) feature provides a powerful and flexible way to manage user permissions within your application. RBAC allows you to define roles with specific sets of permissions and assign these roles to users, enabling fine-grained control over who can access what within your system.

Key benefits:
1. Granular access control: Define precise permissions for different user types or job functions.
2. Simplified management: Easily manage permissions by assigning roles rather than individual permissions.
3. Scalability: Efficiently handle permissions for large numbers of users and resources.
4. Compliance support: Meet regulatory requirements for access control in various industries.
5. Reduced error risk: Minimize the chance of accidental permission assignments.
6. Auditing capabilities: Easily track and review role assignments and permission changes.
7. Flexibility: Quickly adapt to organizational changes by modifying role definitions.

RBAC is particularly valuable for:
- Enterprise applications with complex organizational structures
- Healthcare systems requiring strict data access controls
- Financial platforms with varying levels of user authority
- Content management systems with different contributor roles
- E-commerce platforms with layered admin permissions
- Any application needing to limit access to sensitive features or data

Implementing RBAC with Supabase is straightforward:
1. Define roles and their associated permissions in your database schema
2. Use Supabase's Row Level Security to enforce role-based access at the database level
3. Implement role assignment and management in your application logic
4. Utilize Supabase's authentication system to associate roles with user accounts

By leveraging Role-Based Access Control, you can create a secure, scalable, and easily manageable access control system for your application. This feature allows you to implement complex permission structures with ease, ensuring that users only have access to the resources and functionalities appropriate for their role within the system.
`,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl:
      'https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac',
    slug: 'role-based-access-control',
  },
  {
    title: 'Authorization via Row Level Security',
    subtitle: 'Control the data each user can access with Postgres Policies.',
    description: `
Supabase's Row Level Security (RLS) feature provides a powerful and flexible way to implement fine-grained access control directly at the database level. By using PostgreSQL's native RLS capabilities, you can define security policies that determine which rows in a table a user can access or modify.

Key benefits:
1. Data-level security: Control access to individual rows based on user attributes or roles.
2. Centralized policy management: Define and manage access rules in one place, directly in the database.
3. Performance optimization: Enforce access control at the database level for improved efficiency.
4. Simplified application logic: Reduce the need for complex authorization checks in your application code.
5. Consistency across clients: Ensure uniform access control regardless of how data is accessed (API, direct SQL, etc.).
6. Dynamic policies: Create flexible policies that can adapt to changing user contexts or data attributes.
7. Audit trail support: Easily log and track data access patterns for compliance and security purposes.

Row Level Security is particularly valuable for:
- Multi-tenant applications where data isolation is crucial
- Healthcare systems requiring patient data privacy
- Financial platforms with strict data access controls
- Collaborative tools where users should only see their own or shared data
- Content management systems with complex publishing workflows
- Any application dealing with sensitive or personalized data

Implementing RLS with Supabase is straightforward:
1. Define RLS policies for your tables using SQL in the Supabase dashboard
2. Use Supabase's authentication system to provide user context to these policies
3. Leverage Supabase's client libraries to automatically apply RLS in API requests
4. Test and refine policies to ensure they correctly implement your access control requirements

By leveraging Row Level Security, you can implement sophisticated access control patterns with minimal application code. This not only enhances security by enforcing access rules at the data layer but also simplifies development by centralizing authorization logic. RLS allows you to build applications that handle complex data access scenarios while maintaining performance and scalability.
`,
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/row-level-security',
    slug: 'row-level-security',
  },
  {
    title: 'Captcha protection',
    subtitle: 'Add Captcha to your sign-in, sign-up, and password reset forms.',
    description: `
Supabase's Captcha protection feature allows you to easily integrate CAPTCHA challenges into your authentication flows, providing an additional layer of security against automated attacks and bot activities.

Key benefits:
1. Bot protection: Defend against automated attacks on your authentication endpoints.
2. Reduced spam: Minimize fake account creation and spam submissions.
3. Customizable security: Adjust CAPTCHA difficulty based on risk assessment.
4. User-friendly options: Implement modern, user-friendly CAPTCHA variants like reCAPTCHA v3.
5. Seamless integration: Easily add CAPTCHA to existing Supabase auth flows.
6. Improved security posture: Demonstrate commitment to security best practices.
7. Compliance support: Help meet regulatory requirements for bot protection and security.

Captcha protection is particularly valuable for:
- High-traffic websites vulnerable to automated attacks
- E-commerce platforms preventing fake account creation
- Forums and community sites reducing spam registrations
- Financial services applications adding an extra layer of security
- Any public-facing forms susceptible to bot submissions

Implementing Captcha protection with Supabase is straightforward:
1. Enable CAPTCHA in your Supabase project settings
2. Configure your chosen CAPTCHA provider (e.g., reCAPTCHA)
3. Integrate CAPTCHA challenges into your frontend authentication forms
4. Use Supabase client libraries to verify CAPTCHA responses during auth requests

By leveraging Captcha protection, you can significantly enhance the security of your application's authentication system. This feature helps protect against various automated threats, including credential stuffing attacks, brute force attempts, and bot-driven spam. Implementing CAPTCHA not only improves security but also helps maintain the integrity of your user base and data.
`,
    icon: RectangleEllipsis,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/captcha',
    slug: 'captcha-protection',
  },
  {
    title: 'Server-side Auth',
    subtitle: 'Helpers for implementing user authentication in popular server-side languages.',
    description: `
Supabase's Server-side Auth feature provides a set of helpers and utilities for implementing robust user authentication in popular server-side languages and frameworks. This feature enables developers to securely manage user sessions, verify tokens, and handle authentication flows on the server, complementing client-side auth implementations.

Key benefits:
1. Enhanced security: Implement secure token verification and session management on the server.
2. Framework integration: Easily integrate Supabase auth with popular server-side frameworks like Next.js and SvelteKit.
3. Simplified development: Use pre-built helpers to handle common auth tasks, reducing boilerplate code.
4. Consistent auth experience: Maintain a unified auth approach across client and server components.
5. SSR support: Enable authenticated server-side rendering for improved performance and SEO.
6. Flexible deployment: Support various deployment models, including serverless functions.
7. Best practices enforcement: Encourage secure coding patterns in server-side auth implementations.

Server-side Auth is particularly valuable for:
- Server-rendered web applications requiring authenticated content
- APIs and microservices needing to verify client authenticity
- Hybrid apps combining client and server-side rendering
- Applications with sensitive operations that should only be performed server-side
- Projects leveraging server-side frameworks like Next.js, Nuxt, or SvelteKit
- Any application requiring secure, programmatic access to user session data

Implementing Server-side Auth with Supabase is straightforward:
1. Install the Supabase server-side library for your chosen language/framework
2. Use provided helpers to verify authentication tokens in incoming requests
3. Implement secure session management using Supabase's server-side utilities
4. Leverage auth helpers for common tasks like retrieving user data or checking permissions

By utilizing Server-side Auth, you can create more secure and robust applications that handle authentication consistently across both client and server components. This feature allows you to implement advanced auth flows, perform secure server-side operations, and build applications that adhere to security best practices, all while leveraging the simplicity and power of Supabase's auth system.
`,
    icon: Server,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/server-side-auth',
    slug: 'server-side-auth',
  },
  // Storage
  {
    title: 'File storage',
    subtitle: 'Supabase Storage makes it simple to store and serve files.',
    description: `
Supabase Storage provides a robust and scalable solution for storing and serving files in your applications. This feature allows you to easily manage user-generated content, assets, and any other file types directly within your Supabase project.

Key benefits:
1. Seamless integration: Store and retrieve files using the same Supabase client you use for database operations.
2. Scalability: Handle large numbers of files and high traffic loads without infrastructure management.
3. Security: Implement fine-grained access control using Postgres RLS policies.
4. Performance: Serve files quickly with global CDN support.
5. Versatility: Store any file type, from images and videos to documents and application data.
6. Easy management: Organize files into buckets and folders for efficient structuring.
7. Cost-effective: Pay only for the storage you use, with no upfront costs or capacity planning required.

File storage is particularly valuable for:
- Social media platforms storing user-uploaded images and videos
- E-commerce sites managing product images and documents
- Content management systems handling various media types
- Collaborative tools storing shared documents and assets
- Mobile apps needing to sync user data and media
- Any application requiring secure, scalable file storage and serving

Implementing File Storage with Supabase is straightforward:
1. Create storage buckets to organize your files
2. Use Supabase client libraries to upload, download, and manage files
3. Implement access policies to control who can read and write files
4. Leverage Supabase's APIs to integrate file operations into your application logic

By utilizing Supabase Storage, you can easily add robust file management capabilities to your applications without the complexity of setting up and managing separate storage infrastructure. This feature allows you to focus on building your application's unique features while relying on Supabase to handle the intricacies of secure, scalable file storage and serving.
`,
    icon: Folders,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/file-storage',
    slug: 'file-storage',
  },
  {
    title: 'Content Delivery Network',
    subtitle: 'Cache large files using the Supabase CDN.',
    description: `
Supabase's Content Delivery Network (CDN) feature allows you to cache and serve large files efficiently across the globe. By leveraging a distributed network of servers, the CDN ensures that your content is delivered to users quickly, regardless of their geographic location.

Key benefits:
1. Improved performance: Reduce latency by serving content from servers closest to the user.
2. Scalability: Handle high traffic loads and large file serving without straining your main servers.
3. Bandwidth savings: Reduce the load on your origin servers by serving cached content from the CDN.
4. Global reach: Deliver content efficiently to users worldwide without managing global infrastructure.
5. Cost-effective: Optimize content delivery costs by reducing bandwidth usage on your primary servers.
6. Reliability: Improve content availability and redundancy through distributed serving.
7. Security: Benefit from additional layer of protection against DDoS attacks.

The CDN feature is particularly valuable for:
- Media-heavy websites serving large images or video files
- Global applications requiring fast content delivery across different regions
- E-commerce platforms needing to serve product images quickly
- Content publishers distributing large documents or multimedia files
- Gaming applications serving game assets and updates
- Any application dealing with large file downloads or streaming

Implementing CDN with Supabase is straightforward:
1. Enable CDN for your storage buckets in the Supabase dashboard
2. Configure caching rules and TTL (Time To Live) for different file types
3. Use Supabase client libraries or APIs to serve files, which will automatically use the CDN
4. Monitor CDN performance and usage through Supabase analytics

By leveraging Supabase's CDN, you can significantly improve the performance and user experience of your applications, especially for users accessing large files or media content. This feature allows you to efficiently serve content globally without the complexity of managing your own CDN infrastructure, enabling you to focus on building and improving your core application features.
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
Supabase's Smart Content Delivery Network (Smart CDN) takes the traditional CDN concept a step further by automatically revalidating assets at the edge. This advanced feature ensures that your content is not only delivered quickly but also remains up-to-date, providing an optimal balance between performance and content freshness.

Key benefits:
1. Content freshness: Ensure users always receive the most recent version of assets without manual invalidation.
2. Improved cache hit ratio: Intelligently manage cache lifetimes to maximize CDN efficiency.
3. Reduced origin load: Minimize requests to the origin server by optimizing edge caching strategies.
4. Automatic updates: Content updates are propagated to the edge without manual intervention.
5. Granular control: Set custom revalidation rules for different types of content.
6. Improved user experience: Deliver fast-loading, always-up-to-date content to users globally.
7. Cost optimization: Reduce bandwidth costs by serving more content from the edge.

The Smart CDN feature is particularly valuable for:
- Dynamic websites with frequently updated content
- E-commerce platforms with real-time inventory and pricing updates
- News and media sites delivering the latest information
- Applications with user-generated content that changes rapidly
- Global platforms requiring both speed and content accuracy
- Any site balancing the need for performance with content freshness

Implementing Smart CDN with Supabase is straightforward:
1. Enable Smart CDN for your storage buckets in the Supabase dashboard
2. Configure revalidation rules based on your content update patterns
3. Use Supabase client libraries or APIs to serve and update content
4. Monitor Smart CDN performance and effectiveness through Supabase analytics

By leveraging Supabase's Smart CDN, you can ensure that your users always receive fast, up-to-date content without the complexity of managing cache invalidation manually. This feature allows you to optimize both performance and content accuracy, providing a superior user experience for applications with dynamic or frequently updated content.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/smart-cdn',
    slug: 'smart-cdn',
  },
  {
    title: 'Image transformations',
    subtitle: 'Transform images on the fly.',
    description: `
Supabase's Image Transformations feature allows you to dynamically modify images stored in your Supabase project. This powerful capability enables you to resize, crop, convert, and apply various effects to images on-the-fly, without the need for pre-processing or storing multiple versions of the same image.

Key benefits:
1. Dynamic resizing: Serve appropriately sized images for different devices and layouts.
2. Format conversion: Automatically convert images to optimal formats like WebP for improved performance.
3. Quality adjustment: Balance image quality and file size for different use cases.
4. Cropping and focusing: Adjust image composition dynamically to fit different aspect ratios.
5. Performance optimization: Reduce bandwidth usage and improve page load times with optimized images.
6. Storage efficiency: Store a single high-quality version and generate variants as needed.
7. Creative flexibility: Apply filters, overlays, and other effects to images programmatically.

Image transformations are particularly valuable for:
- Responsive web design requiring different image sizes for various devices
- E-commerce platforms showcasing product images in multiple formats
- Social media applications handling user-uploaded images
- Content management systems adapting images for different layouts
- Mobile apps optimizing images for cellular networks
- Any application dealing with large volumes of images in varying contexts

Implementing Image Transformations with Supabase is straightforward:
1. Store original images in Supabase Storage
2. Use URL parameters or Supabase client libraries to specify transformations
3. Serve transformed images directly from Supabase CDN
4. Cache commonly used transformations for improved performance

By leveraging Supabase's Image Transformations, you can significantly improve your application's performance and user experience when dealing with images. This feature eliminates the need for manual image processing and storage of multiple versions, saving both time and resources while providing the flexibility to adapt images to any context or design requirement.
`,
    icon: Image,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/image-transformations',
    slug: 'image-transformations',
  },
  {
    title: 'Resumable uploads',
    subtitle: 'Upload large files using resumable uploads.',
    description: `
Supabase's Resumable Uploads feature enables the reliable transfer of large files by allowing uploads to be paused and resumed. This advanced functionality ensures that file uploads can be completed successfully even in challenging network conditions or when interrupted.

Key benefits:
1. Reliability: Successfully upload large files even with unstable internet connections.
2. User experience: Allow users to pause and resume uploads at their convenience.
3. Bandwidth efficiency: Avoid re-uploading already transferred parts of a file after an interruption.
4. Time-saving: Resume interrupted uploads from the point of failure, saving time and resources.
5. Large file support: Confidently handle uploads of very large files without worrying about timeouts.
6. Mobile-friendly: Particularly useful for mobile applications where network conditions can be variable.
7. Error resilience: Automatically retry failed chunks without restarting the entire upload.

Resumable uploads are particularly valuable for:
- Cloud storage applications handling large file transfers
- Video sharing platforms dealing with high-quality video uploads
- Backup and sync services ensuring data integrity during transfers
- Scientific applications uploading large datasets
- Content creation tools handling large media files
- Any application where users need to upload sizeable files in potentially unstable conditions

Implementing Resumable Uploads with Supabase is straightforward:
1. Enable resumable uploads for your storage buckets
2. Use Supabase client libraries with resumable upload support
3. Implement client-side logic to track upload progress and handle pauses/resumes
4. Leverage Supabase's API to manage and complete multi-part uploads

By utilizing Supabase's Resumable Uploads, you can significantly improve the reliability and user experience of file uploads in your application, especially when dealing with large files or in scenarios with unpredictable network conditions. This feature reduces frustration for users and ensures that large file uploads can be completed successfully, enhancing the overall robustness of your application's file handling capabilities.
`,
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/resumable-uploads',
    slug: 'resumable-uploads',
  },
  {
    title: 'S3 compatibility',
    subtitle: 'Interact with Storage from tools which support the S3 protocol.',
    description: `
Supabase's S3 compatibility feature allows you to interact with Supabase Storage using tools and libraries that support the Amazon S3 protocol. This powerful capability enables seamless integration with a wide ecosystem of existing S3-compatible tools and workflows.

Key benefits:
1. Ecosystem compatibility: Leverage existing S3-compatible tools and libraries with Supabase Storage.
2. Familiar workflows: Use well-known S3 commands and SDKs for storage operations.
3. Easy migration: Simplify the process of moving from S3 to Supabase or using both in parallel.
4. Expanded tooling options: Access a broad range of backup, synchronization, and management tools.
5. Legacy system support: Integrate Supabase Storage with systems designed for S3 without modifications.
6. Flexibility: Choose the most suitable client libraries or tools for your specific needs.
7. Cost-effective alternative: Use Supabase as a more affordable S3-compatible storage solution.

S3 compatibility is particularly valuable for:
- DevOps teams using S3-based deployment and backup scripts
- Data analysis workflows leveraging S3-compatible data lakes
- Content management systems with existing S3 integrations
- Backup and disaster recovery solutions designed for S3
- Legacy applications built around S3 storage
- Any project looking to leverage the vast ecosystem of S3-compatible tools

Implementing S3 compatibility with Supabase is straightforward:
1. Enable S3-compatible access for your Supabase project
2. Generate S3-compatible credentials in the Supabase dashboard
3. Configure your S3-compatible tools or libraries with Supabase endpoint and credentials
4. Use standard S3 operations to interact with your Supabase Storage

By leveraging Supabase's S3 compatibility, you can seamlessly integrate Supabase Storage into existing workflows and take advantage of the vast ecosystem of S3-compatible tools and libraries. This feature provides flexibility in how you interact with your stored data, allowing you to choose the most appropriate tools and methods for your specific use case while enjoying the benefits of Supabase's managed storage solution.
`,
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/s3-compatibility',
    slug: 's3-compatibility',
  },
  // Functions
  {
    title: 'Deno Edge Functions',
    subtitle: 'Globally distributed TypeScript functions to execute custom business logic.',
    description: `
Supabase's Deno Edge Functions feature allows you to deploy and run custom TypeScript functions globally at the edge, bringing your code closer to your users for enhanced performance and reduced latency. This powerful capability enables you to execute custom business logic, handle webhooks, and create dynamic API endpoints with ease.

Key benefits:
1. Global distribution: Run your functions closer to users for reduced latency.
2. TypeScript support: Leverage TypeScript's type safety and modern language features.
3. Deno runtime: Benefit from Deno's security-first approach and modern JavaScript APIs.
4. Seamless integration: Easy integration with other Supabase services like Auth and Database.
5. Scalability: Automatically scale to handle varying loads without manual intervention.
6. Cost-effective: Pay only for the compute resources you use.
7. Fast deployments: Quick function updates and rollbacks for agile development.

Deno Edge Functions are particularly valuable for:
- API backends requiring low-latency responses globally
- Serverless applications needing custom logic close to users
- Webhook handlers for third-party service integrations
- Real-time data processing and transformation
- Custom authentication and authorization flows
- Scheduled tasks and background jobs
- Any application requiring secure, scalable, and globally distributed compute

Implementing Deno Edge Functions with Supabase is straightforward:
1. Write your TypeScript functions using Supabase CLI or dashboard
2. Test functions locally using Supabase CLI
3. Deploy functions to Supabase with a simple command
4. Invoke functions via HTTP requests or trigger them based on events

By leveraging Supabase's Deno Edge Functions, you can build more responsive, globally distributed applications with custom server-side logic. This feature allows you to extend the capabilities of your Supabase project beyond database operations, enabling complex workflows, integrations, and dynamic responses tailored to your specific business needs.
`,
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/functions/deno-edge-functions',
    slug: 'deno-edge-functions',
  },
  {
    title: 'Regional invocations',
    subtitle: 'Execute an Edge Function in a region close to your database.',
    description: `
Supabase's Regional Invocations feature allows you to execute Edge Functions in a region close to your database, optimizing performance for database-intensive operations. This capability ensures low-latency communication between your functions and database, enhancing overall application responsiveness.

Key benefits:
1. Reduced latency: Minimize round-trip time between functions and database for faster operations.
2. Improved performance: Enhance the speed of database queries and updates from your functions.
3. Data locality: Keep data processing close to where the data is stored for efficiency.
4. Consistency: Ensure that functions operate on the most up-to-date data with minimal delay.
5. Cost optimization: Reduce data transfer costs between regions.
6. Simplified architecture: Streamline your application's geographic setup for database operations.
7. Compliance support: Help meet data residency requirements by processing data in specific regions.

Regional invocations are particularly valuable for:
- Applications with data-intensive serverless functions
- Real-time data processing workflows requiring low latency
- Financial applications needing quick database reads and writes
- Analytics services processing large volumes of data
- Compliance-sensitive applications with data residency requirements
- Any scenario where minimizing function-to-database latency is crucial

Implementing Regional Invocations with Supabase is straightforward:
1. Configure your Edge Function to use regional invocation in the Supabase dashboard
2. Deploy your function as usual using Supabase CLI
3. Invoke the function using the regional endpoint provided by Supabase
4. Monitor performance improvements through Supabase's observability tools

By leveraging Supabase's Regional Invocations, you can significantly enhance the performance of your database-centric serverless functions. This feature allows you to build more responsive applications, especially those requiring frequent or complex database interactions, by ensuring that your Edge Functions operate as close as possible to your Supabase database.
`,
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/functions/regional-invocations',
    slug: 'regional-invocations',
  },
  {
    title: 'NPM compatibility',
    subtitle: 'Edge functions natively support NPM modules and Node built-in APIs.',
    description: `
Supabase's NPM Compatibility feature for Edge Functions allows you to use NPM modules and Node.js built-in APIs directly in your Deno-based Edge Functions. This powerful capability bridges the gap between Deno and the vast Node.js ecosystem, giving you access to a wide range of libraries and familiar APIs.

Key benefits:
1. Extensive library access: Leverage the vast NPM ecosystem in your Edge Functions.
2. Familiar Node.js APIs: Use built-in Node.js modules you're already familiar with.
3. Code reusability: Easily port existing Node.js code to Supabase Edge Functions.
4. Ecosystem compatibility: Integrate with services and tools designed for Node.js environments.
5. Simplified development: Reduce the learning curve for developers coming from a Node.js background.
6. Flexibility: Choose between Deno-native and Node-compatible libraries as needed.
7. Future-proofing: Adapt existing codebases to edge computing without major rewrites.

NPM compatibility is particularly valuable for:
- Projects migrating from Node.js-based serverless platforms to Supabase
- Developers looking to leverage specific NPM packages in edge computing scenarios
- Applications requiring Node.js-specific libraries not available in Deno
- Teams with existing Node.js codebases wanting to adopt edge computing
- Rapid prototyping using familiar Node.js modules and APIs
- Any project aiming to balance the benefits of Deno with Node.js ecosystem access

Implementing NPM-compatible Edge Functions with Supabase is straightforward:
1. Import NPM modules using Node.js-style require() statements in your functions
2. Use Node.js built-in APIs as you would in a Node.js environment
3. Deploy your functions as usual using Supabase CLI
4. Supabase handles the compatibility layer, ensuring your code runs efficiently

By leveraging NPM Compatibility in Supabase Edge Functions, you can take advantage of the best of both worlds: the modern, secure runtime of Deno and the rich ecosystem of Node.js. This feature allows you to build powerful, efficient edge computing solutions while maintaining access to the tools and libraries you're familiar with, accelerating development and enabling more complex use cases at the edge.
`,
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/functions/npm-compatibility',
    slug: 'npm-compatibility',
  },
  // Vector
  {
    title: 'AI Integrations',
    subtitle: 'Enhance applications with OpenAI and Hugging Face integrations.',
    description: `
Supabase's AI Integrations feature provides seamless connectivity with leading AI platforms like OpenAI and Hugging Face, allowing you to easily incorporate advanced AI capabilities into your applications. This powerful feature enables developers to leverage state-of-the-art machine learning models and natural language processing directly within their Supabase projects.

Key benefits:
1. Easy AI integration: Incorporate advanced AI capabilities without managing complex infrastructure.
2. Versatile model access: Utilize a wide range of pre-trained models for various AI tasks.
3. Scalability: Handle AI workloads efficiently with Supabase's managed infrastructure.
4. Cost-effective AI deployment: Leverage powerful AI models without significant upfront investments.
5. Real-time AI processing: Combine AI capabilities with Supabase's real-time features for dynamic applications.
6. Data synergy: Seamlessly use your Supabase data with AI models for personalized experiences.
7. Rapid prototyping: Quickly experiment with and deploy AI-powered features in your applications.

AI Integrations are particularly valuable for:
- Natural language processing applications like chatbots and content analyzers
- Recommendation systems for e-commerce or content platforms
- Image and video analysis tools for media applications
- Predictive analytics dashboards for business intelligence
- Personalization engines for user experience enhancement
- Any application seeking to incorporate AI-driven insights or automation

Implementing AI Integrations with Supabase is straightforward:
1. Set up API credentials for your chosen AI platform (e.g., OpenAI, Hugging Face)
2. Use Supabase's client libraries or Edge Functions to make API calls to AI services
3. Process and store AI-generated results in your Supabase database
4. Integrate AI outputs into your application's frontend or backend logic

By leveraging Supabase's AI Integrations, you can rapidly develop and deploy sophisticated AI-powered applications. This feature bridges the gap between powerful AI models and your application data, enabling you to create more intelligent, responsive, and personalized user experiences without the complexity of managing separate AI infrastructure.
`,
    icon: Brain,
    products: [PRODUCT_SHORTNAMES.VECTOR],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/ai',
    slug: 'ai-integrations',
  },
  // Platform
  {
    title: 'CLI',
    subtitle: 'Use our CLI to develop your project locally and deploy.',
    description: `
Supabase's Command Line Interface (CLI) tool provides developers with a powerful and flexible way to manage their Supabase projects directly from the terminal. This feature streamlines the development workflow, allowing for local development, testing, and seamless deployment of Supabase projects.

Key benefits:
1. Local development: Set up and run a local Supabase instance for development and testing.
2. Version control integration: Easily manage database migrations and schema changes with Git-like workflows.
3. Automated deployments: Deploy changes to your Supabase project with simple CLI commands.
4. Database migrations: Generate, apply, and revert database migrations effortlessly.
5. Environment management: Handle multiple environments (development, staging, production) efficiently.
6. Seed data management: Populate your database with test data for consistent development and testing.
7. CI/CD integration: Incorporate Supabase operations into your continuous integration and deployment pipelines.

The CLI is particularly valuable for:
- Development teams working on Supabase projects collaboratively
- DevOps professionals managing Supabase deployments across multiple environments
- Open-source projects requiring reproducible Supabase setups
- Developers preferring command-line tools for increased productivity
- Projects with complex database schemas requiring careful version control
- Any application needing a streamlined local-to-production workflow with Supabase

Implementing the Supabase CLI in your workflow is straightforward:
1. Install the Supabase CLI using npm or your preferred package manager
2. Initialize a Supabase project in your local development environment
3. Use CLI commands to manage database migrations, seed data, and local development
4. Deploy changes to your production Supabase instance with simple commands

By leveraging the Supabase CLI, you can significantly improve your development workflow, ensuring consistency between local and production environments, streamlining deployments, and making it easier to manage complex Supabase projects. This tool empowers developers to work more efficiently with Supabase, whether they're building small prototypes or large-scale applications.
`,
    icon: FileCode2,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/project-management/cli',
    slug: 'cli',
  },
  {
    title: 'Management API',
    subtitle: 'Manage your projects programmatically.',
    description: `
Supabase's Management API provides a powerful interface for programmatically managing your Supabase projects. This feature allows developers and DevOps teams to automate project creation, configuration, and maintenance tasks, enabling more efficient and scalable project management workflows.

Key benefits:
1. Automation: Automate repetitive tasks like project creation and configuration.
2. Scalability: Easily manage multiple Supabase projects across different environments.
3. CI/CD integration: Incorporate Supabase project management into your continuous integration and deployment pipelines.
4. Programmatic control: Manage projects dynamically based on your application's needs.
5. Consistent setup: Ensure uniform configuration across multiple projects or environments.
6. Audit trail: Keep track of project changes and configurations programmatically.
7. Resource optimization: Dynamically allocate and deallocate resources based on demand.

The Management API is particularly valuable for:
- Large organizations managing multiple Supabase projects
- SaaS platforms offering Supabase-powered backends to their customers
- DevOps teams implementing infrastructure-as-code practices
- Managed service providers offering Supabase as part of their stack
- Applications requiring dynamic project creation and management
- Any scenario where manual project management through the dashboard is impractical

Implementing the Management API in your workflows is straightforward:
1. Generate API keys with appropriate permissions in the Supabase dashboard
2. Use the API documentation to understand available endpoints and operations
3. Integrate API calls into your scripts, applications, or CI/CD pipelines
4. Leverage the API to automate project lifecycle management tasks

By utilizing the Supabase Management API, you can create more efficient, scalable, and automated workflows for managing your Supabase projects. This feature is especially powerful for organizations dealing with multiple projects or environments, enabling them to maintain consistency, reduce manual errors, and quickly respond to changing project requirements.
`,
    icon: FileCode2,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/project-management/api',
    slug: 'management-api',
  },
  // Analytics
  {
    title: 'Analytics',
    subtitle: "Monitor your project's health with usage insights.",
    description: `
Supabase Analytics provides comprehensive insights into your project's performance, usage patterns, and overall health. This feature offers a detailed view of various metrics, helping you optimize your application, troubleshoot issues, and make data-driven decisions about resource allocation and scaling.

Key benefits:
1. Performance monitoring: Track query performance, API response times, and overall system health.
2. Usage insights: Understand how your database, storage, and other resources are being utilized.
3. Cost optimization: Identify opportunities to optimize resource usage and reduce costs.
4. Trend analysis: Observe usage patterns over time to predict future needs and potential issues.
5. Security overview: Monitor authentication attempts, failed queries, and other security-related metrics.
6. Customizable dashboards: Create tailored views of the metrics most important to your team.
7. Alerting capabilities: Set up notifications for unusual activity or performance thresholds.

Analytics is particularly valuable for:
- Development teams needing to optimize application performance
- DevOps professionals monitoring system health and resource utilization
- Project managers tracking usage growth and planning for scaling
- Financial teams managing cloud spending and optimizing costs
- Security personnel monitoring for unusual activity or potential threats
- Any stakeholder requiring insights into the project's operational status

Implementing and using Supabase Analytics is straightforward:
1. Access the Analytics dashboard in your Supabase project
2. Explore pre-built visualizations for key metrics
3. Customize dashboards to focus on metrics relevant to your project
4. Set up alerts for important thresholds or anomalies
5. Use insights to guide optimization efforts and resource planning

By leveraging Supabase Analytics, you gain a comprehensive understanding of your project's performance and usage patterns. This feature empowers you to make informed decisions about scaling, optimization, and resource allocation, ensuring that your application runs efficiently and cost-effectively. Whether you're troubleshooting issues, planning for growth, or optimizing costs, Supabase Analytics provides the insights you need to manage your project effectively.
`,
    icon: BarChart,
    products: [ADDITIONAL_PRODUCTS.PLATFORM],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/analytics',
    slug: 'analytics',
  },
  {
    title: 'SOC 2 Compliance',
    subtitle: 'Build with confidence on a SOC 2 compliant platform.',
    description: `
Supabase's SOC 2 Compliance demonstrates its commitment to maintaining the highest standards of security, availability, and confidentiality. This certification assures users that Supabase follows strict information security policies and procedures, encompassing the security, availability, processing, integrity, and confidentiality of customer data.

Key benefits:
1. Trust and credibility: Build on a platform that has been independently audited for security practices.
2. Risk mitigation: Reduce the risk of data breaches and security incidents.
3. Compliance support: Easier compliance with your own regulatory requirements.
4. Standardized processes: Benefit from Supabase's adherence to industry-standard security practices.
5. Continuous improvement: Supabase's commitment to maintaining SOC 2 compliance ensures ongoing security enhancements.
6. Transparency: Access to SOC 2 reports provides insight into Supabase's security controls.
7. Competitive advantage: Use Supabase's compliance as a selling point for your own services.

SOC 2 Compliance is particularly valuable for:
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
]
