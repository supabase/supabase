# Contributing to Supabase docs

Our docs help developers to get started and keep succeeding with Supabase. We welcome contributions from everyone.

If you'd like to contribute, see our list of [recommended issues](https://github.com/supabase/supabase/issues?q=is%3Aopen+is%3Aissue+label%3Adocumentation+label%3A%22help+wanted%22). We also welcome you to open a PR or a new issue with your question.

Here are some general guidelines on writing docs for Supabase.

## General principles

Docs should be helpful, quick to read, and easy to understand. We have an audience of global readers who speak different native languages.

To make docs as clear as possible:

- Write for the user. Think about what task they want to complete by reading your doc. Tell them what, and only what, they need to know.
- Write like you talk. Use words and sentences that sound natural when speaking. Cut unnecessary words. Read your writing out loud to help you choose the clearest and simplest phrases.
- Each paragraph should have one topic only. Start a new paragraph whenever you change the topic. Don't worry about paragraphs being too short.
- Avoid using idioms and colloquialisms, such as `piece of cake`. These phrases are often specific to a region or culture.
- Refer to the reader as `you`. Don't use `we` to refer to the reader. Use `we` only to refer to the Supabase team.

## Document types

Supabase docs contain 4 types of documents. Before you start writing, think about what type of doc you need.

### Explainers

Explainers help the reader to learn a topic. They are conceptual and mostly prose-based. They can include:

- A description of _what_ a feature is
- Some reasons _why_ it is useful
- Some examples of _when_ to use it
- A high-level explanation of _how_ it works

They shouldn't include:

- Instructions on how to use it

### Tutorials

Tutorials are goal-oriented. They help a reader to finish a large, complex goal, such as setting up a web app that uses multiple Supabase features.

Tutorials mix prose explanations with procedures (lists of steps for the reader to follow). They provide context for why certain instructions are given.

For inspiration, see [an example of a tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs).

### Guides

Guides are also goal-oriented, but they focus on shorter, more targeted tasks. For example, a guide might explain how to set up user login for an app.

Guides contain mostly procedures. Think of an instruction manual for building a desk: it's a list of concise steps that the user can go through quickly.

For inspiration, see [an example of a guide](https://supabase.com/docs/guides/auth/auth-email).

### Reference

References are factual and to the point. Think of dictionary entries.

They should include:

- Function parameters
- Return types
- Code samples
- Warnings for critical errors (for example, missteps that can cause data loss)

They shouldn't include:

- Explanations of the context for a feature
- Examples of use cases
- Multi-step instructions

## Repo organization

Most docs pages are contained in the `apps/docs/content` directory. Some docs sections are federated from other repositories, for example [`pg_graphql`](https://github.com/supabase/pg_graphql/tree/master/docs). Reference docs are generated from spec files in the `spec` directory.

You can usually identify a federated or reference doc because it uses a Next.js dynamic route (for example, `[[...slug]].tsx`). Look for the spec file import or the repo definition to find the content location.

Example spec file import:

```js
import specFile from '~/spec/transforms/analytics_v0_openapi_deparsed.json' assert { type: 'json' }
```

Example repo definition:

```js
const org = 'supabase'
const repo = 'pg_graphql'
const branch = 'master'
const docsDir = 'docs'
const externalSite = 'https://supabase.github.io/pg_graphql'
```

Check the sections for [guide structure](#guide-structure) and [reference structure](#reference-structure) to learn more about the file structures.

## Guide structure

The Supabase docs use [MDX](https://mdxjs.com/). Guides are written in unstructured prose as MDX documents.

Adding a new guide requires:

- YAML frontmatter
- A navigation entry (in a separate file)

Frontmatter looks like this. `title` is mandatory. There are also optional properties that you can use to control the page display, including `subtitle`, `tocVideo`, and `hideToc`.

```yaml
---
title: How to connect to Supabase
hideToc: true
---
```

The navigation is defined in [`NavigationMenu.constants.ts`](https://github.com/supabase/supabase/blob/master/apps/docs/components/Navigation/NavigationMenu/NavigationMenu.constants.ts).

Add an entry with the `name`, `url`, and (optional) `icon` for your page.

## Reference structure

Reference docs are produced from the reference specs and library source code. A common spec file contains shared function and endpoint definitions, and library-specific spec files contain further details.

### Common spec file

Each type of library (for example, language SDK or CLI) has a common spec file. For example, see the [spec file for the language SDKs](https://github.com/supabase/supabase/blob/master/apps/docs/spec/common-client-libs-sections.json). This file contains definitions for the common SDK functions:

- **id** - Identifies the function
- **title** - Human-readable title
- **slug** - URL slug
- **product** - Supabase product that owns the function. For example, database operations are owned by `database`, and auth functions are owned by`auth`
- **type** - `function` for a structured function definition or `markdown` for a prose explainer section.

To add a new function, manually add an entry to this common file.

### Specific spec file

Each library also has its own spec file containing library-specific details. For example, see the [JavaScript SDK spec file](https://github.com/supabase/supabase/blob/master/apps/docs/spec/supabase_js_v2.yml).

The functions listed in this file match the ones defined in the common spec file.

Each function contains a description, code examples, and optional notes. The parameters are pulled from the source code via the `$ref` property, which references a function definition in the source code repo. These references are pulled down and transformed using commands in the spec [Makefile](https://github.com/supabase/supabase/blob/master/apps/docs/spec/Makefile). Unless you're a library maintainer, you don't need to worry about this.

If you're a library maintainer, follow these steps when updating function parameters or return values:

1. Get your changes merged to `master` in your library
2. This will kick off an action that automatically updates the spec file in the library's `gh-pages` branch
3. Run `make` in `/spec` of the `supabase/supabase` repo. This will regenerate all of the `tsdoc` files that the docs site uses
4. You should now see the changes you've made in the docs site locally

## Content reuse

If you copy the same content multiple times across different files, create a **partial** for content reuse instead. Partials are MDX files contained in [`apps/docs/components/MDX`](https://github.com/supabase/supabase/tree/master/apps/docs/components/MDX). They contain reusable snippets that can be inserted in multiple pages. For example, you can create a partial to define a common setup step for a group of tutorials.

To use a partial, import it into your MDX file. You can also set up a partial to automatically import by including it in the `components` within [`apps/docs/components/index.tsx`](https://github.com/supabase/supabase/blob/master/apps/docs/components/index.tsx).

## Components and elements

Docs include normal Markdown elements such as lists, and custom components such as admonitions (callouts).

Here are some guidelines for using elements:

### Admonitions

Admonitions (or callouts) draw reader attention to an important point or an aside. They highlight important information, but get less effective if they're overused.

Use admonitions sparingly. Don't stack them on top of each other.

Choose the appropriate `type` for your admonition:

- `danger` to warn the user about any missteps that could cause data loss or data leaks
- `deprecation` to notify the user about features that are (or will soon be) deprecated
- `caution` to warn about anything that could cause a bug or serious user inconvenience
- `tip` to point out helpful but optional actions
- `note` for anything else

```
<Admonition type="note" label="Optional label displays as title">

Your content here

</Admonition>
```

### Blockquotes

Don't use blockquotes.

### Code blocks

Keep code lines short to avoid scrolling. For example, you can split long shell commands with `\`.

- **JavaScript/TypeScript**

  The `supabase` repo uses Prettier, which also formats JS/TS in code blocks. Your PR is blocked from merging if the Prettier check fails. Ensure that your code blocks are formatted by running `npm run format`, or by setting up auto-formatting in your IDE.

- **SQL**

  Prefer lowercase for SQL. For example, `select * from table` rather than `SELECT * FROM table`.

Optionally specify a filename for the codeblock by including it after the opening backticks and language specifier:

```md
```ts environment.ts
```

Optionally highlight lines by using `mark=${lineNumber}`.

```md
```js mark=12:13
```

### Footnotes

Don't use footnotes.

### Images

Images are uploaded in the `apps/docs/public/img` folder.

For vector illustrations, use `svg`. For screenshots and non-vector graphics, use `png`. (These are automatically converted to `webp` for supported browsers.)

Redact any sensitive information, such as API keys.

### Links

Link text should be descriptive. The reader should understand where the link goes from reading the link text alone. This is important for accessibility. For example, don't use `here` as link text.

But link text shouldn't be too long. Use the shortest part of the link that is descriptive enough. For example, `see the [reference section](/link)` rather than `[see the reference section](/link)`.

Use relative links when linking within the `supabase.com` domain. For example, `[link to another page in Supabase docs](/docs/guides/getting-started)`.

### Lists

Use ordered lists for steps that must be taken one after the other. Use unordered lists when order doesn't matter.

Use Arabic numerals (`1`, `2`, `3`) for ordered lists and dashes (`-`) for unordered lists.

Don't nest lists more than two deep.

```md
1. List item
2. List item
   1. List item
   2. List item
3. List item
   - List item
   - List item
   <!-- DON'T ADD ANOTHER LEVEL OF NESTING -->
     - Overly nested list item
```

### Tabs

Use tabs to provide alternative instructions for different platforms or languages.

The `queryGroup` param is optional. It lets you link directly to a tab by using the query group as a query param in the URL, for example: `https://supabase.com/docs/my-page?packagemanager=ts`

```
<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="npm"
  queryGroup="packagemanager"
>
<TabPanel id="npm" label="npm">

// ...

</TabPanel>
<TabPanel id="yarn" label="Yarn">

// ...

</TabPanel>
</Tabs>
```

### Videos

Include videos as TOC (Table of Contents) videos rather than putting them in the main text.

You can define a TOC video in the page frontmatter:

```yaml
---
tocVideo: 'rzglqRdZUQE',
---
```

## Styling, formatting, and grammar

Don't worry too much about grammar rules. Grammar is useful if, and only if, it makes your writing clearer. For example, you can use sentence fragments if they're self-explanatory.

That said, a few rules help keep the docs concise, consistent, and clear:

- Format headings in sentence case. Capitalize the first word and any proper nouns. All other words are lowercase. For example, `Set up authentication` rather than `Set Up Authentication`.
- Use the Oxford comma (a comma before the `and` that marks the last item in a list). For example, `realtime, database, and authentication` rather than `realtime, database and authentication`.
- Use the present tense as much as possible. For example, `the AI assistant answers your question` rather than `the AI assistant will answer your question`.

## Word usage and spelling

Use American English. If in doubt, consult the [Merriam-Webster dictionary](https://www.merriam-webster.com/).

Here are some exceptions and Supabase-specific guidelines.

### General word usage

- **Filler words**: You can often make your writing more concise by removing these words. (Some of these words can also sound patronizing.)
  - Actually
  - Easy, easily
  - Just
  - Let's
  - Please
  - Simple, simply
- **UI elements**
  - Buttons are `click`ed.
  - Checkboxes are `select`ed.
  - Toggles are `enable`d and `disable`d.
  - Labels of UI elements are bolded. For example, `Click **Confirm**.`

### Word list

- `Backend` isn't hyphenated (not `back-end`).
- `Frontend` isn't hyphenated (not `front-end`).
- `Login` is a noun. `Log in` is a verb.
- `Postgres` is capitalized, except in code, and used instead of `PostgreSQL`.
- `Setup` is a noun. `Set up` is a verb.
- `Supabase` is capitalized (not `supabase`), except in code.
- `Supabase Platform` is in title case (not `Supabase platform`).

## Search

Search is handled using a Supabase instance. During CI, [a script](https://github.com/supabase/supabase/blob/master/apps/docs/scripts/search/generate-embeddings.ts) aggregates all content sources (eg. guides, reference docs, etc), indexes them using OpenAI embeddings, and stores them in a Supabase database.

Search uses a hybrid of native Postgres FTS and embedding similarity search based on [`pgvector`](https://github.com/pgvector/pgvector). At runtime, a PostgREST call triggers the RPC that runs the weighted FTS search, and an [Edge Function](https://github.com/supabase/blob/master/supabase/functions) is executed to perform the embedding search.
