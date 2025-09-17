import type { TableSuggestion } from './types'

export const SOCIAL_MEDIA_TABLES: TableSuggestion[] = [
  {
    tableName: 'user_profiles',
    fields: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'username', type: 'varchar', nullable: false, unique: true },
      { name: 'display_name', type: 'varchar', nullable: true },
      { name: 'bio', type: 'text', nullable: true },
      { name: 'avatar_url', type: 'text', nullable: true },
      { name: 'follower_count', type: 'int4', nullable: false, default: '0' },
      { name: 'following_count', type: 'int4', nullable: false, default: '0' },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Core user identity and profile information for your social platform',
    source: 'template',
  },
  {
    tableName: 'posts',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      {
        name: 'user_id',
        type: 'uuid',
        nullable: false,
        description: 'References user_profiles.id',
      },
      { name: 'content', type: 'text', nullable: false },
      { name: 'media_urls', type: 'jsonb', nullable: true },
      { name: 'like_count', type: 'int4', nullable: false, default: '0' },
      { name: 'comment_count', type: 'int4', nullable: false, default: '0' },
      { name: 'share_count', type: 'int4', nullable: false, default: '0' },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: true },
    ],
    rationale: 'Main content that users create and share on the platform',
    source: 'template',
  },
  {
    tableName: 'user_follows',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      {
        name: 'follower_id',
        type: 'uuid',
        nullable: false,
        description: 'References user_profiles.id',
      },
      {
        name: 'following_id',
        type: 'uuid',
        nullable: false,
        description: 'References user_profiles.id',
      },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'notification_enabled', type: 'bool', nullable: false, default: 'true' },
    ],
    rationale: 'Tracks relationships between users for the follow system',
    source: 'template',
  },
]

export const ECOMMERCE_TABLES: TableSuggestion[] = [
  {
    tableName: 'products',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'name', type: 'varchar', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'price', type: 'numeric', nullable: false },
      { name: 'stock_quantity', type: 'int4', nullable: false, default: '0' },
      { name: 'category', type: 'varchar', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Product catalog for your e-commerce store',
    source: 'template',
  },
  {
    tableName: 'orders',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'customer_id', type: 'uuid', nullable: false },
      { name: 'total_amount', type: 'numeric', nullable: false },
      { name: 'status', type: 'varchar', nullable: false, default: "'pending'" },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Customer orders and transactions',
    source: 'template',
  },
]

export const BLOG_TABLES: TableSuggestion[] = [
  {
    tableName: 'articles',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'title', type: 'varchar', nullable: false },
      { name: 'slug', type: 'varchar', nullable: false, unique: true },
      { name: 'content', type: 'text', nullable: false },
      { name: 'author_id', type: 'uuid', nullable: false },
      { name: 'published', type: 'bool', nullable: false, default: 'false' },
      { name: 'published_at', type: 'timestamptz', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Blog posts and articles',
    source: 'template',
  },
  {
    tableName: 'categories',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'name', type: 'varchar', nullable: false, unique: true },
      { name: 'slug', type: 'varchar', nullable: false, unique: true },
      { name: 'description', type: 'text', nullable: true },
    ],
    rationale: 'Article categories for organization',
    source: 'template',
  },
]

export const PROJECT_MGMT_TABLES: TableSuggestion[] = [
  {
    tableName: 'projects',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'name', type: 'varchar', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'status', type: 'varchar', nullable: false, default: "'active'" },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Projects and their metadata',
    source: 'template',
  },
  {
    tableName: 'tasks',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'project_id', type: 'uuid', nullable: false },
      { name: 'title', type: 'varchar', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'assignee_id', type: 'uuid', nullable: true },
      { name: 'status', type: 'varchar', nullable: false, default: "'todo'" },
      { name: 'due_date', type: 'date', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Tasks within projects',
    source: 'template',
  },
]

export const ANALYTICS_TABLES: TableSuggestion[] = [
  {
    tableName: 'events',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'event_name', type: 'varchar', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: true },
      { name: 'session_id', type: 'varchar', nullable: true },
      { name: 'properties', type: 'jsonb', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Event tracking for analytics',
    source: 'template',
  },
  {
    tableName: 'metrics',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
      { name: 'metric_name', type: 'varchar', nullable: false },
      { name: 'value', type: 'numeric', nullable: false },
      { name: 'dimensions', type: 'jsonb', nullable: true },
      { name: 'recorded_at', type: 'timestamptz', nullable: false, default: 'now()' },
    ],
    rationale: 'Aggregated metrics and KPIs',
    source: 'template',
  },
]
