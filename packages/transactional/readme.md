# Supabase Emails

A centralized package for all Supabase email templates (transactional and marketing) built with React Email. This is your one-stop shop for Supabase emails.

## Why `packages/transactional` vs `apps/email`?

This package is structured as a **package** (not an app) because:

1. **Reusability**: Email templates are shared resources that multiple apps (Studio, Dashboard, etc.) can import and use
2. **Library Pattern**: Similar to other packages like `packages/ui`, `packages/common`, this follows the monorepo pattern of shared libraries
3. **No Deployment Needed**: Unlike apps, this doesn't need its own deployment - it's a development tool and template library
4. **Import Flexibility**: Apps can import specific email templates: `import { WelcomeEmail } from 'transactional/emails/welcome'`
5. **Single Source of Truth**: All Supabase emails live in one place, making it easier to maintain consistency

## Getting Started

### Prerequisites

Make sure you're in the monorepo root and have dependencies installed:

```sh
pnpm install
```

### Running the Development Server

From the monorepo root:

```sh
cd packages/transactional
pnpm dev
```

Or using pnpm workspace commands from the root:

```sh
pnpm --filter transactional dev
```

The React Email dev server will start and you can preview your emails at [http://localhost:3000](http://localhost:3000).

### Email Categories

- **Transactional**: Account-related emails (welcome, password reset, security alerts, etc.)
- **Marketing**: Newsletter, product updates, announcements, etc.

### Using Email Templates in Apps

Import email templates in your apps:

```ts
// Transactional emails
import { SecurityAdvisoryEmail } from 'transactional/emails/security-advisory'

// Marketing emails
import { MonthlyNewsletterEmail } from 'transactional/emails/monthly-newsletter'

// Render the email
const html = render(MonthlyNewsletterEmail({ 
  month: 'January',
  year: '2026',
  featuredArticles: [...]
}))
```

## License

MIT License
