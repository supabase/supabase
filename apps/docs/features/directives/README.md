# Directives

Directives are a custom feature of the Supabase docs content system, which allows you to extend MDX to provide custom functionality.

## Why not a React component?

MDX supports React components, and that is the preferred way to add new features. If your use case is supported by a React component alone, use that instead.

Custom directives are used to implement features that need low-level parse or compile-time control over the MDX AST.

## Syntax

We reserve a special syntax for directives, which start with a `$` sign. For example:

```mdx
<$CodeSample />
```

This syntax was chosen because it is both:

- Sufficiently standard to be supported by MDX parsers without needing to build a custom extension.
- Sufficiently uncommon to avoid collisions with other React components used in docs.
