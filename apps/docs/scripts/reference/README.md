# Reference Page Generation

This system converts structured API definition files into rendered MDX reference pages. Each reference (e.g. the JavaScript Client Library) lives in a self-contained folder under `spec/reference/` and is processed via a language-specific adapter.

## Table of Contents

- [How it works](#how-it-works)
- [Adding a new reference page](#adding-a-new-reference-page)
  - [1. Create the spec folder](#1-create-the-spec-folder)
  - [2. Write the config](#2-write-the-config)
  - [3. Add source data files](#3-add-source-data-files)
  - [4. Add optional MDX partials](#4-add-optional-mdx-partials)
  - [5. Create a dedicated page route](#5-create-a-dedicated-page-route)
  - [6. Exclude from the catch-all route](#6-exclude-from-the-catch-all-route)
- [Adding a new language processor](#adding-a-new-language-processor)
  - [The LanguageProcessor contract](#the-languageprocessor-contract)
  - [Full output shape](#full-output-shape)
- [Running the script](#running-the-script)
- [File map](#file-map)

---

## How it works

```
spec/reference/<slug>/          ← source folder (one per reference page)
  config.json                   ← metadata and processing options
  *.json                        ← API definition data (any name, any number)
  introduction.partial.mdx      ← optional prose injected after the frontmatter
  <category-slug>.partial.mdx   ← optional prose injected under each category

        ↓  pnpm generate:mdx-reference  ↓

content/reference/<slug>/
  index.mdx                     ← generated MDX page
  data.json                     ← sections tree + config properties (used by the page route)
```

The script `scripts/reference/generate-mdx-reference.ts` discovers every spec folder, selects the right language processor based on `config.json`, and writes the output.

---

## Adding a new reference page

### 1. Create the spec folder

Create a folder under `spec/reference/` whose name matches the URL slug you want:

```
spec/reference/dart/          ← page will live at /reference/dart
spec/reference/dart/v2/       ← versioned page at /reference/dart/v2
```

The folder path relative to `spec/reference/` is mirrored exactly into `content/reference/`.

### 2. Write the config

Create `config.json` in the folder. All fields except `language` are optional but recommended.

```jsonc
{
  // Required: selects the language processor (see scripts/reference/languages/)
  "language": "typescript",

  // Displayed in the page header and browser tab
  "title": "Dart Client library",
  "subtitle": "The official Dart/Flutter client for Supabase.",

  // Shown as a link next to the title
  "referenceLink": "https://github.com/supabase/supabase-dart",
  "referenceLinkLabel": "supabase-dart",

  // Navigation metadata (consumed by the page route and layout)
  "name": "Dart",
  "menuTitle": "Dart",
  "icon": "reference-dart",
  "version": "v2",
  "versions": ["v2", "v1"],
  "isLatestVersion": true,

  // Optional: list categories in a specific order.
  // Categories not listed appear after those that are, in insertion order.
  "categoryOrder": ["Database", "Auth", "Functions"],

  // Optional: hide definitions globally or within a specific category.
  // String form hides the definition in every category.
  // Object form hides it only in the named category.
  // Important: It is still recommended to use a @hidden tag or similar directly on the code.
  "ignoreDefinitions": ["constructor", { "category": "Database", "definition": "internalHelper" }],

  // Optional: rename or reorder a definition within a category.
  // `definition` is the original name in the source data.
  // `name` replaces it in the output.
  // `order` is a 0-based position within the category (other items fill remaining slots).
  "overrideDefinitions": [
    { "category": "Database", "definition": "constructor", "name": "createClient", "order": 0 },
  ],
}
```

### 3. Add source data files

Place any number of `.json` files (not counting the `config.json` one) in the spec folder. The language processor reads all of them and merges the results in a single definition object.

The exact format depends on the processor — for `typescript`, they are [TypeDoc JSON](https://typedoc.org/) outputs.

```
spec/reference/dart/
  config.json
  dart_core.json       ← processed by the dart processor
  dart_storage.json    ← also processed
```

### 4. Add optional MDX partials

Partials are authored MDX fragments injected into the generated page at specific positions.

| File                          | Inserted                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `introduction.partial.mdx`    | Immediately after the frontmatter, before any category      |
| `<category-slug>.partial.mdx` | Under the matching category heading, before its definitions |

The category slug is the category name lowercased with spaces and special characters replaced by hyphens — e.g. `File Buckets` → `file-buckets.partial.mdx`.

`## Heading` lines inside partials are automatically converted to `<Heading>` components with a stable anchor id (`<category-slug>-<heading-slug>`), so they appear correctly in the navigation sidebar.

**Example:** `spec/reference/dart/auth.partial.mdx`

```mdx
## Social Login

Supabase supports OAuth providers out of the box. See the [OAuth guide](/docs/guides/auth/social-login) for setup instructions.
```

### 5. Create a dedicated page route

Each reference needs an App Router page at `app/reference/<slug>/page.tsx`. Copy the structure from the existing JavaScript page:

```ts
// app/reference/dart/page.tsx
import { ReferencePageLayout } from '~/features/docs/Reference.layout.new'
import { REFERENCE_DIRECTORY, type GuideFrontmatter } from '~/lib/docs'
import { join } from 'path'
import matter from 'gray-matter'
import { promises as fs } from 'node:fs'
import { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'

interface ReferenceData {
  title?: string
  subtitle?: string
  referenceLink?: string
  referenceLinkLabel?: string
  sections: AbbrevApiReferenceSection[]
}

async function getReferenceContent(library: string) {
  const filePath = join(REFERENCE_DIRECTORY, library, 'index.mdx')
  const { data: meta, content } = matter(await fs.readFile(filePath, 'utf-8'))
  return { meta, content } as { content: string; meta: GuideFrontmatter }
}

async function getReferenceData(library: string) {
  const filePath = join(REFERENCE_DIRECTORY, library, 'data.json')
  return JSON.parse(await fs.readFile(filePath, 'utf-8')) as ReferenceData
}

export default async function ReferencePage() {
  const library = 'dart'
  const { sections } = await getReferenceData(library)
  const { meta, content } = await getReferenceContent(library)

  return (
    <ReferencePageLayout
      name="Dart"
      icon="reference-dart"
      library={library}
      version="v2"
      isLatestVersion={true}
      sections={sections}
      meta={meta}
      content={content}
    />
  )
}
```

The data used here (`name`, `icon`, `version`, `isLatestVersion`) is typically what you put in `config.json`. Consider reading it from `data.json` to keep a single source of truth.

_Having to copy this page is a temporary solution until all definitions can be enclosed under the same rendering layout pipeline._

### 6. Exclude from the catch-all route

Open `app/reference/[...slug]/page.tsx` and add your new slug to `DEDICATED_ROUTES`. This prevents a static build conflict between the dedicated page and the catch-all:

```ts
// app/reference/[...slug]/page.tsx

// Paths with dedicated pages are excluded so they don't conflict at build time.
const DEDICATED_ROUTES = new Set(['javascript', 'dart']) // ← add your slug

export async function generateStaticParams() {
  const all = await generateReferenceStaticParams()
  return all.filter((p) => !DEDICATED_ROUTES.has(p.slug[0]))
}
```

Without this, Next.js generates two static files for the same path at build time, and in preview/production environments the catch-all's output can win over the dedicated page.

---

## Adding a new language processor

Processors live in `scripts/reference/languages/`. The file name must match the `"language"` field in `config.json`.

```
scripts/reference/languages/
  typescript.ts   ← used when config says "language": "typescript"
  dart.ts         ← used when config says "language": "dart"
```

### The Language Processor contract

A processor must export a single named function `processSpec`:

```ts
import type { SpecCategory, SpecConfig } from '../types.js'

export function processSpec(specDir: string): {
  categories: SpecCategory[]
  config: SpecConfig
}
```

- `specDir` — absolute path to the spec source folder (e.g. `/…/spec/reference/dart`)
- Returns `categories` (the structured content) and `config` (the parsed `config.json`)

The types are defined in `scripts/reference/types.ts`.

### Full output shape

The `categories` array is everything the MDX generator consumes. Every field is optional except `category`, `definitions`, and `definition.name`.

```ts
type ProcessedType =
  | string // intrinsic: "string", "number", "void" …
  | { kind: 'literal'; value: unknown }
  | { kind: 'union'; types: ProcessedType[] }
  | { kind: 'intersection'; types: ProcessedType[] }
  | { kind: 'array'; elementType: ProcessedType }
  | { kind: 'tuple'; elements: ProcessedType[] }
  | { kind: 'reference'; name: string; typeArguments?: ProcessedType[] }
  | { kind: 'typeParam'; name: string } // unresolved generic, e.g. T
  | { kind: 'object'; name?: string; properties: ProcessedProperty[] }
  | { kind: 'templateLiteral' }
  | { kind: 'indexedAccess'; objectType: ProcessedType; indexType: ProcessedType }
  | { kind: string } // catch-all for unknown kinds

interface ProcessedProperty {
  name: string
  optional?: boolean
  description?: string
  type: ProcessedType
}

interface ProcessedParam {
  name: string
  optional?: boolean
  description?: string
  type: ProcessedType
}

interface ProcessedExample {
  title: string
  code?: string // TypeScript/JS snippet shown in the main tab
  sql?: string // shown in a "Data source" collapsible
  response?: string // shown in a "Response" collapsible (typically JSON)
  notes?: string // shown in a "Notes" collapsible (markdown)
}

interface ProcessedDefinition {
  name: string
  description?: string // markdown prose
  remarks?: string[] // additional markdown paragraphs
  parameters?: ProcessedParam[]
  returnType?: ProcessedType
  examples?: ProcessedExample[]
}

interface SpecCategory {
  category: string // display name, e.g. "Auth"
  definitions: ProcessedDefinition[]
}
```

The MDX generator renders each definition in this order:

1. `<Heading>` with a stable anchor id
2. `description` — markdown prose
3. `remarks` — additional paragraphs, each on its own
4. `<RefDefinitionParams>` — parameter table (if `parameters` is non-empty)
5. `<RefDefinitionReturnType>` — return type tree (if `returnType` is set)
6. Tabbed examples (if `examples` is non-empty), each tab rendering `code`, then optional `sql`, `response`, and `notes` collapsibles

---

## Running the script

```bash
# Run once to check output
pnpm --filter=docs generate:mdx-reference

# Runs automatically before dev and build
pnpm dev:docs
```

The script is registered in `apps/docs/package.json`:

```json
"generate:mdx-reference": "tsx scripts/reference/generate-mdx-reference.ts"
```

It runs as part of `predev` and `prebuild` in the docs app, after `codegen:references` and before `build:markdown` (which copies a Markdown-only version into `public/docs/`).

---

## File map

```
apps/docs/
├── scripts/reference/
│   ├── README.md                        ← you are here
│   ├── generate-mdx-reference.ts        ← main script: discovery + MDX generation
│   ├── types.ts                         ← shared TypeScript interfaces
│   └── languages/
│       └── typescript.ts                ← TypeDoc JSON → SpecCategory[]
│
├── spec/reference/
│   └── javascript/                      ← one folder per reference page
│       ├── config.json
│       ├── *.json                       ← TypeDoc source files
│       ├── introduction.partial.mdx
│       └── auth.partial.mdx
│
├── content/reference/                   ← GENERATED — do not edit by hand
│   └── javascript/
│       ├── index.mdx
│       └── data.json
│
└── app/reference/
    ├── javascript/
    │   └── page.tsx                     ← dedicated page route
    └── [...slug]/
        └── page.tsx                     ← catch-all (excludes dedicated routes)
```
