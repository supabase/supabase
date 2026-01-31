# Clerk and Supabase Integration Example

This is a Next.js application demonstrating integration between [Clerk](https://clerk.com/) for authentication and user management, and [Supabase](https://supabase.com/) for database operations with Row Level Security (RLS).

## Features

- **Clerk Authentication**: User sign-in, sign-up, and organization management
- **Supabase Integration**: Secure database access with Clerk tokens
- **Row Level Security (RLS)**: Fine-grained access controls based on organization membership and roles
- **Organization Support**: Multi-tenant data isolation using Clerk organizations
- **Secure Data Access**: Data access restricted to organization members only

## How It Works

1. **Authentication**: Uses Clerk for user authentication and organization management
2. **Token Integration**: The `useSupabaseClient` hook passes Clerk session tokens to Supabase, enabling RLS policies to validate user permissions
3. **Secure Access**: Database operations are restricted by Supabase RLS policies based on Clerk organization roles
4. **Data Isolation**: Each organization can only access their own data through RLS policies

## Database Schema

The project includes a `secured_table` with the following RLS policies:
- Only organization admins can insert records in their organization
- Users can only select records from their own organization
- Only users that have passed second factor verification can read from the table

## Getting Started

### Prerequisites

1. Create accounts for:
   - [Clerk](https://clerk.com/)
   - [Supabase](https://supabase.com/)

2. Install the Supabase CLI: https://supabase.com/docs/guides/cli/getting-started

### Environment Setup

Create a `.env.local` file in the root of this project with the following variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Running the Project

1. Start the Supabase local development environment:
   ```bash
   supabase start
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `app/` - Next.js App Router pages
- `components/` - Reusable UI components for data operations
- `hooks/useSupabaseClient.ts` - Custom hook for Supabase client with Clerk integration
- `supabase/` - Supabase configuration, migrations and seed files
- `middleware.ts` - Clerk middleware for authentication

## Learn More

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
