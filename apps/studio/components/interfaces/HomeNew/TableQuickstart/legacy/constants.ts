import { TableTemplate } from './types'
import {
  SOCIAL_MEDIA_TABLES,
  ECOMMERCE_TABLES,
  BLOG_TABLES,
  PROJECT_MGMT_TABLES,
  ANALYTICS_TABLES,
} from './mockData'

export const QUICKSTART_DEFAULT_SCHEMA = 'public'

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
