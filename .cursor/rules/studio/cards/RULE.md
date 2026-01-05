---
description: "Studio: Card usage for grouping related content and actions"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio cards

- Use cards to group related pieces of information.
- Use `CardContent` for sections and `CardFooter` for actions.
- Only use `CardHeader`/`CardTitle` when the card content is not already described by surrounding content (page title, section title, etc).
- Prefer headers/titles when multiple cards represent distinct groups (e.g. multiple settings groups).

