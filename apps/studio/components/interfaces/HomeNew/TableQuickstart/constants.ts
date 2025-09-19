import { TableTemplate } from './types'
import {
  SOCIAL_MEDIA_TABLES,
  ECOMMERCE_TABLES,
  BLOG_TABLES,
  PROJECT_MGMT_TABLES,
  ANALYTICS_TABLES,
} from './mockData'

export const QUICKSTART_DEFAULT_SCHEMA = 'public'

export const QUICKSTART_VARIANTS = {
  AI: 'ai',
  TEMPLATES: 'templates',
  CONTROL: 'control',
} as const

export const GETTING_STARTED_WIDGET_COPY = {
  ai: {
    title: 'Kickstart your database with AI',
    description:
      'Describe your app, and our AI will suggest starter table schemas to get you going. Edit and customize them as you go. No SQL required.',
  },
  templates: {
    title: 'Start with a ready-made database',
    description:
      'Start from a ready-made list of tables based on common app types to get you started. You can edit them anytime to make them your own.',
  },
}

// Table templates configuration
export const APP_TEMPLATES: TableTemplate[] = [
  {
    id: 'social-app',
    name: 'Social Media',
    iconName: 'User',
    category: 'social',
    tables: SOCIAL_MEDIA_TABLES,
  },
  {
    id: 'ecommerce-app',
    name: 'E-commerce',
    iconName: 'Storage',
    category: 'commerce',
    tables: ECOMMERCE_TABLES,
  },
  {
    id: 'blog-app',
    name: 'Blog',
    iconName: 'ApiDocs',
    category: 'content',
    tables: BLOG_TABLES,
  },
  {
    id: 'project-app',
    name: 'Todo List',
    iconName: 'Logs',
    category: 'productivity',
    tables: PROJECT_MGMT_TABLES,
  },
  {
    id: 'analytics-app',
    name: 'Analytics',
    iconName: 'Realtime',
    category: 'productivity',
    tables: ANALYTICS_TABLES,
  },
]
