# ./packages/icons

This package contains custom Supabase icons that can be used alongside other icon libraries.

## Documentation

**For complete documentation, usage examples, and guidelines, see the [Design System](../../apps/design-system/content/docs/icons.mdx)**

## Quick start

```jsx
import { Auth, BucketAdd, Database } from 'icons'

function MyComponent() {
  return (
    <>
      <BucketAdd size={24} className="text-foreground-muted" />
      <Database size={16} strokeWidth={1} />
      <Auth size={20} />
    </>
  )
}
```

### Adding new custom icons

1. Add your SVG file to `src/raw-icons/` (kebab-case name)
2. Run `npm run build:icons` in this directory
3. Import and use your new icon

For detailed instructions, examples, and troubleshooting, see the [Design System](../../apps/design-system/content/docs/icons.mdx).
