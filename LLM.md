# Supabase Repository - Complete API Documentation

## Overview
Supabase is an open-source Firebase alternative providing a complete backend-as-a-service platform. This repository contains the Supabase Dashboard (Studio), documentation site, marketing website, UI components, and comprehensive examples.

**Repository**: https://github.com/supabase/supabase  
**License**: Apache-2.0  
**Architecture**: TypeScript monorepo with Next.js applications

## Core Packages

### UI Components (`ui`)
**Import**: `import { Button, Input, Modal } from 'ui'`

**Key Components**:
- **Form Controls**: Button, Input, Select, Checkbox, Radio, Toggle
- **Layout**: Space, SidePanel, NavMenu, Breadcrumb, Card
- **Overlays**: Modal, Popover, Tooltip, ContextMenu, Dialog
- **Data Display**: Alert, Accordion, Tabs, Loading, Markdown
- **Shadcn Components**: Button_Shadcn_, Input_Shadcn_, etc.

**Features**: Radix UI primitives, Tailwind CSS, theme support, accessibility

### UI Patterns (`ui-patterns`)
**Import**: `import { CommandMenu, AssistantChat } from 'ui-patterns'`

**Key Components**:
- **CommandMenu**: AI-integrated command palette with search
- **AssistantChat**: AI chat interface components
- **ComplexTabs**: Enhanced tabs with query params
- **FilterBar**: Advanced filtering interface
- **AuthenticatedDropdownMenu**: User authentication dropdown

### Common Utilities (`common`)
**Import**: `import { useBreakpoint, useCopy } from 'common'`

**Key Exports**:
- **Hooks**: useBreakpoint, useCopy, useDebounce, useDocsSearch
- **Auth**: Authentication utilities and providers
- **Constants**: Application constants and configuration
- **Database Types**: TypeScript definitions for schemas
- **Telemetry**: Analytics and tracking utilities

### Icons (`icons`)
**Import**: `import { Database, Auth, Storage } from 'icons'`

**Available Icons**: RESTApi, Database, Auth, Storage, EdgeFunctions, Realtime, Postgres, GitHub, Discord, Twitter, LinkedIn, YouTube

### API Types (`api-types`)
**Import**: `import type { paths, operations } from 'api-types'`

**Features**: OpenAPI-generated types, platform APIs, webhook definitions, strict TypeScript typing

### PostgreSQL Metadata (`@supabase/pg-meta`)
**Import**: `import pgMeta from '@supabase/pg-meta'`

**Key Features**:
- Database objects: tables, columns, schemas, functions, views
- Security: roles, policies, privileges, extensions
- Query utilities: SQL builders and formatters
- Zod validation schemas

### AI Commands (`ai-commands`)
**Import**: `import { generateSQL, chatWithAI } from 'ai-commands'`

**Features**: AI-powered SQL generation, natural language to SQL, function creation, RLS policy generation

## Applications

### Supabase Studio (`apps/studio`)
**Purpose**: Main dashboard and administration interface

**Key Features**:
- Database management (Table Editor, SQL Editor, Schema Visualizer)
- Authentication (User management, providers, JWT secrets)
- Storage (File management, bucket configuration)
- API Documentation (Auto-generated project docs)
- Real-time WebSocket management
- Edge Functions deployment
- Billing and organization management
- Unified logging and analytics

**Main Routes**:
- `/project/[ref]/` - Project-specific pages
- `/org/[slug]/` - Organization management
- `/api/platform/` - Platform management APIs

### Documentation Site (`apps/docs`)
**Purpose**: Comprehensive documentation website

**Features**:
- Step-by-step guides and tutorials
- Auto-generated API reference
- Interactive code examples
- AI-powered search
- Multi-language support

**Technology**: Next.js App Router, MDX, Contentlayer

### Marketing Website (`apps/www`)
**Purpose**: Main marketing and company website

**Features**:
- Product showcases
- Pricing calculator
- Customer stories and case studies
- Company blog
- Launch Week events
- Partner program

### Design System (`apps/design-system`)
**Purpose**: Design system documentation and component showcase

**Features**:
- Component library documentation
- Design tokens and guidelines
- Interactive examples
- Code generation and exports

## Development Setup

### Prerequisites
```bash
# Required versions
Node.js >= 22
pnpm >= 9
```

### Installation
```bash
# Clone repository
git clone https://github.com/supabase/supabase.git
cd supabase

# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Available Scripts
```bash
# Development
pnpm dev                    # All apps in parallel
pnpm dev:studio            # Studio only
pnpm dev:docs              # Docs only
pnpm dev:www               # Marketing site only

# Building
pnpm build                 # All apps
pnpm build:studio          # Studio only
pnpm build:docs            # Docs only

# Testing
pnpm lint                  # Code linting
pnpm typecheck             # TypeScript checking
pnpm test:studio           # Studio tests
```

### Docker Development
```bash
# Start local Supabase stack
cd docker
docker-compose up

# Services available:
# - Studio: http://localhost:3000
# - API Gateway: http://localhost:8000
# - Database: postgresql://localhost:5432
```

## Examples and Integration Patterns

### Authentication Examples
```typescript
// Next.js Auth
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Database Operations
```typescript
// Select data
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// Insert data
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' })

// Real-time subscription
const subscription = supabase
  .channel('users')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'users'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

### Storage Operations
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user-avatar.png', file)

// Download file
const { data, error } = await supabase.storage
  .from('avatars')
  .download('user-avatar.png')
```

### Edge Functions
```typescript
// Invoke edge function
const { data, error } = await supabase.functions
  .invoke('hello-world', {
    body: { message: 'Hello from client!' }
  })
```

## Framework Integrations

### Next.js Integration
```typescript
// utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side
import { createServerClient } from '@supabase/ssr'

export function createClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### React Integration
```typescript
// hooks/useSupabase.ts
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export function useSupabase() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, supabase }
}
```

### Flutter Integration
```dart
// main.dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );
  runApp(MyApp());
}

final supabase = Supabase.instance.client;

// Authentication
final response = await supabase.auth.signInWithPassword(
  email: 'user@example.com',
  password: 'password',
);
```

## Best Practices

### Security
1. **Row Level Security**: Enable RLS on all tables
2. **Environment Variables**: Use proper secret management
3. **API Keys**: Separate anon/service keys
4. **CORS**: Configure allowed origins

### Performance
1. **Caching**: Implement appropriate caching strategies
2. **Indexing**: Create database indexes for queries
3. **Edge Functions**: Use for global distribution
4. **Connection Pooling**: Use connection pooling for high traffic

### Development
1. **Type Safety**: Generate TypeScript types from database
2. **Testing**: Implement comprehensive testing
3. **Local Development**: Use local Supabase stack
4. **Version Control**: Track schema changes

## API Reference

### Authentication API
- `signUp(credentials)` - User registration
- `signInWithPassword(credentials)` - Email/password login
- `signInWithOAuth(provider)` - OAuth login
- `signOut()` - User logout
- `getUser()` - Get current user
- `updateUser(updates)` - Update user profile

### Database API
- `from(table).select(columns)` - Query data
- `from(table).insert(data)` - Insert records
- `from(table).update(data)` - Update records
- `from(table).delete()` - Delete records
- `rpc(function, params)` - Call database functions

### Storage API
- `storage.from(bucket).upload(path, file)` - Upload file
- `storage.from(bucket).download(path)` - Download file
- `storage.from(bucket).remove(paths)` - Delete files
- `storage.from(bucket).list(path)` - List files

### Realtime API
- `channel(name).on(event, callback)` - Subscribe to changes
- `channel(name).subscribe()` - Activate subscription
- `channel(name).unsubscribe()` - Deactivate subscription

### Edge Functions API
- `functions.invoke(name, options)` - Invoke function
- `functions.invokeWithFiles(name, files)` - Invoke with files

This documentation provides comprehensive coverage of the Supabase repository structure, APIs, and integration patterns for effective development with the Supabase platform.
