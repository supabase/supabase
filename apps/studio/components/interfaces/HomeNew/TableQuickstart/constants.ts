import type { TableSuggestion } from './types'

export interface TableTemplate {
  id: string
  name: string
  description: string
  iconName: string
  category: 'user' | 'content' | 'commerce' | 'productivity' | 'social'
  tables: TableSuggestion[]
}

export const GETTING_STARTED_WIDGET_COPY = {
  control: {
    title: 'Get started by building out your database',
    description:
      "Start building your app by creating tables and inserting data. Our Table Editor makes Postgres as easy to use as a spreadsheet, but there's also our SQL Editor if you need something more.",
  },
  ai: {
    title: 'Kickstart your database with AI',
    description:
      'Describe your app, and our AI will suggest starter table schemas to get you going. Edit and customize them as you go. No SQL required..',
  },
  templates: {
    title: 'Start with a ready-made database',
    description:
      "Pick what you're building, and we'll set up starter tables for you. Edit them anytime to make them your own.",
  },
}

export const TABLE_TEMPLATES: TableTemplate[] = [
  {
    id: 'user-profiles',
    name: 'User Profiles',
    description: 'Extends Supabase auth with user metadata',
    iconName: 'User',
    category: 'user',
    tables: [
      {
        tableName: 'profiles',
        fields: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'username', type: 'text', nullable: true },
          { name: 'full_name', type: 'text', nullable: true },
          { name: 'bio', type: 'text', nullable: true },
          { name: 'avatar_url', type: 'text', nullable: true },
          { name: 'website', type: 'text', nullable: true },
          { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' },
        ],
        rationale: 'Store extended user profile information',
        source: 'template'
      },
      {
        tableName: 'user_sessions',
        fields: [
          { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', nullable: false },
          { name: 'token', type: 'varchar(255)', nullable: false },
          { name: 'expires_at', type: 'timestamptz', nullable: false },
          { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
        ],
        rationale: 'Track user sessions for authentication',
        source: 'template'
      }
    ]
  },
  {
    id: 'blog-posts',
    name: 'Blog Posts',
    description: 'Perfect for blogs and content management',
    iconName: 'ApiDocs',
    category: 'content',
    tables: [
      {
        tableName: 'posts',
        fields: [
          { name: 'id', type: 'bigserial', nullable: false },
          { name: 'author_id', type: 'uuid', nullable: true },
          { name: 'title', type: 'text', nullable: false },
          { name: 'slug', type: 'text', nullable: false },
          { name: 'content', type: 'text', nullable: true },
          { name: 'excerpt', type: 'text', nullable: true },
          { name: 'featured_image', type: 'text', nullable: true },
          { name: 'status', type: 'text', nullable: false, default: "'draft'" },
          { name: 'published_at', type: 'timestamptz', nullable: true },
          { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' },
        ],
        rationale: 'Store blog posts with publishing workflow',
        source: 'template'
      }
    ]
  },
  {
    id: 'products',
    name: 'Products',
    description: 'E-commerce with pricing and inventory',
    iconName: 'Storage',
    category: 'commerce',
    tables: [
      {
        tableName: 'products',
        fields: [
          { name: 'id', type: 'bigserial', nullable: false },
          { name: 'name', type: 'text', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'price', type: 'decimal(10,2)', nullable: true },
          { name: 'sku', type: 'text', nullable: true },
          { name: 'category', type: 'text', nullable: true },
          { name: 'stock_quantity', type: 'integer', nullable: false, default: 0 },
          { name: 'image_url', type: 'text', nullable: true },
          { name: 'is_active', type: 'boolean', nullable: false, default: true },
          { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
        ],
        rationale: 'Manage product catalog with inventory',
        source: 'template'
      }
    ]
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Todo lists and project management',
    iconName: 'Reports',
    category: 'productivity',
    tables: [
      {
        tableName: 'tasks',
        fields: [
          { name: 'id', type: 'bigserial', nullable: false },
          { name: 'user_id', type: 'uuid', nullable: true },
          { name: 'title', type: 'text', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'status', type: 'text', nullable: false, default: "'pending'" },
          { name: 'priority', type: 'integer', nullable: false, default: 3 },
          { name: 'due_date', type: 'date', nullable: true },
          { name: 'completed_at', type: 'timestamptz', nullable: true },
          { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
        ],
        rationale: 'Track tasks with priorities and due dates',
        source: 'template'
      }
    ]
  },
  {
    id: 'comments',
    name: 'Comments',
    description: 'Comments system with nested replies',
    iconName: 'Realtime',
    category: 'social',
    tables: [
      {
        tableName: 'comments',
        fields: [
          { name: 'id', type: 'bigserial', nullable: false },
          { name: 'user_id', type: 'uuid', nullable: true },
          { name: 'content', type: 'text', nullable: false },
          { name: 'parent_id', type: 'bigint', nullable: true },
          { name: 'entity_type', type: 'text', nullable: false },
          { name: 'entity_id', type: 'text', nullable: false },
          { name: 'is_edited', type: 'boolean', nullable: false, default: false },
          { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' },
        ],
        rationale: 'Enable commenting with nested replies',
        source: 'template'
      }
    ]
  }
]
