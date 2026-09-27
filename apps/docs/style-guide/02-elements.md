# Choose your components

Once you know what kind of information you have, this is the catalog of forms it can
take. Each entry leads with when the component is warranted, then its syntax.

"Component" means the MDX components the docs app provides, such as `<Admonition>` and
`<Tabs>`. "Element" means a plain Markdown construct, such as a list or a heading.

| If you're deciding                                       | Read                                          |
| -------------------------------------------------------- | --------------------------------------------- |
| Which form the information should take                   | [Choosing a component](#choosing-a-component) |
| How to handle admonitions, emphasis, headings, and lists | [Text](#text)                                 |
| How to write steps, code, and tabs                       | [Steps and code](#steps-and-code)             |
| How to show structured data or a diagram                 | [Data and diagrams](#data-and-diagrams)       |
| How to add an image or a video                           | [Media](#media)                               |
| How to link out or list related pages                    | [Navigation](#navigation)                     |
| Which constructs to leave out                            | [Don't use these](#dont-use-these)            |

## Choosing a component

Start from the information type, per [`03-page-structure.md`](./03-page-structure.md).

| You have                                          | Reach for                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Actions the reader performs in order              | A [procedure](#procedures)                         |
| A stage-by-stage explanation                      | Prose, or a when/then [table](#tables)             |
| The parts of something                            | A [table](#tables) or a [diagram](#diagrams)       |
| A warning or a rule the reader must not miss      | An [admonition](#admonitions)                      |
| A definition or an idea                           | Prose, a [list](#lists), or a [diagram](#diagrams) |
| Alternative instructions per platform or language | [Tabs](#tabs)                                      |
| A curated set of links on an index page           | A [content listing](#content-listings)             |

When a phrase fits more than one category, pick the most specific one.

## Text

### Admonitions

#### Use an admonition for information a reader might otherwise miss

Reach for one when missing the information would change the outcome of the task. Use
one to separate helpful but optional guidance from the main flow. Don't
use one for information that belongs in the main explanation or procedure. They
highlight important information and get less effective when overused, so don't stack
them or use them as decoration.

#### Begin every admonition with its impact and purpose: the "so what."

Use the first sentence to tell the reader why the information matters: what could
happen, what changes, or what benefit they gain. Add background or instructions after
the impact is clear.

- **Recommended**: `Deleting this project permanently removes its database and backups. Export any data that you want to keep before you continue.`
- **Not recommended**: `Before you continue, there are a few things that you should know about project deletion.`

#### Don't restate an admonition in the body text

An admonition and the paragraph next to it should cover distinct points. A risk stated
twice reads as an editing mistake and trains readers to skip the box.

Choose the `type` that matches the severity:

| Type          | Use for                                                             |
| ------------- | ------------------------------------------------------------------- |
| `danger`      | Data loss, exposed data, or another severe, hard-to-reverse outcome |
| `deprecation` | A deprecated feature or behavior                                    |
| `caution`     | Bugs, failed operations, or unexpected results, short of `danger`   |
| `note`        | A prerequisite, constraint, or clarification that carries no risk   |

For `danger` and `caution`, state the consequence first, then how to avoid it. For
`deprecation`, state how the change affects the reader, then the migration path. When a
note is essential to completing a step, put it in the procedure instead of an
admonition.

Structure an admonition with these props:

- `title` (optional): a short callout title. Don't put Markdown or HTML headings
  inside an admonition. If the content needs a heading to structure the page, move the
  heading and its section outside the admonition.
- `children`: rich body content such as paragraphs, lists, links, and code.
- `actions` (optional): standalone calls to action, kept separate from the body.
  Contextual links and interactive examples stay in the body when they're part of the
  explanation.

```mdx
<Admonition type="note" title="Optional title" actions={<Button>Continue</Button>}>

Your content here

</Admonition>
```

### Emphasis

#### Use bold, italics, and code for distinct purposes

Don't use them interchangeably or to add visual emphasis alone.

| Format    | Use for                                                         |
| --------- | --------------------------------------------------------------- |
| **Bold**  | A UI label, a term the reader must not miss, or an inline label |
| _Italics_ | A new term on first definition, or a title                      |
| `Code`    | Anything typed, copied, or read literally by the system         |

Bold covers the controls a reader interacts with, such as buttons, menu items, and
field names: `Click **Save**.` It also marks a term they can't afford to skip, as in
`**Never** commit your service role key.` The third case is the label opening a
paragraph or list item, as in `**Recommended**:`.

Use italics sparingly, and never for a UI label or for general emphasis. A title set in
italics by convention, such as a book or a third-party product, is the other case.

Code covers filenames, paths, commands, flags, environment variables, function and
parameter names, configuration keys, and literal values.

A command name is `code`, not **bold**, even though the reader also interacts with it.

Don't format for emphasis beyond these three. Screen readers announce text
modifications, so a sentence carrying several kinds of formatting is read aloud with the
formatting narrated between the words.

#### Name a control by its label

An icon has no accessible name a reader can match against what you wrote. Write `Click
**Notifications**` rather than `Click the bell icon`.

### Headings

#### Format headings in sentence case

Capitalize the first word and any proper nouns, and lowercase everything else: `Set up
authentication` rather than `Set Up Authentication`.

A heading can't carry meaning on its own. See
[`01-voice-and-tone.md`](./01-voice-and-tone.md).

Headings are also anchor targets. Other pages, `apps/www`, and Studio all deep-link into
guide anchors, so renaming a heading breaks those links. Moving a section or changing
its level preserves the anchor; only renaming breaks it.

### Lists

#### Choose the list type by whether order matters

Use an ordered list for steps taken in sequence, and an unordered list when order
doesn't matter. Use Arabic numerals (`1`, `2`, `3`) for ordered lists and dashes (`-`)
for unordered lists.

#### Prefer a paragraph to a single-item list

A list of one signals content that was meant to grow and didn't. Exceptions: layout
consistency across sibling sections, or an item that needs the visual separation.

#### Don't nest lists more than two deep

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

### Don't use these

#### Blockquotes

Use an admonition when the content needs emphasis, or prose when it doesn't.

#### Footnotes

Put the information in the sentence, or in a linked section when it's substantial enough
to need one.

## Steps and code

### Procedures

#### Use a procedure when a human or an agent must perform actions to reach an outcome

The format makes that expectation explicit.

Write sequential actions as an ordered list. **Begin each step with an imperative verb,
and include one action or a closely related set of actions per step.** Give the reader
enough context to know where to act.

For how many steps to present at once and when to split a procedure into phases, see
chunking in [`03-page-structure.md`](./03-page-structure.md).

An apparent one-step procedure can become two steps when there's a real orientation
action:

1. Open a terminal in your project directory.
2. Run `supabase start`.

The first step establishes the operating context for both readers and agents. Don't add
a redundant orientation step to a genuinely atomic instruction. Write `Click **Save**.`
rather than adding `Locate the **Save** button` as a separate step.

### Code blocks

#### Keep code lines short so the reader doesn't scroll

Split long shell commands with `\`.

JavaScript and TypeScript in code blocks are formatted by Prettier, and your pull
request is blocked from merging if the Prettier check fails. Run `pnpm format` from the
repository root, or set up automatic formatting in your editor.

#### Prefer lowercase for SQL

Write `select * from table` rather than `SELECT * FROM table`.

Optionally specify a filename after the language specifier:

````md
```ts environment.ts

```
````

Optionally highlight lines with `mark=${lineNumber}`:

````md
```js mark=12:13

```
````

### Tabs

#### Use tabs for alternative instructions across platforms or languages

The same task, done differently depending on the reader's stack. Don't use tabs for
sequential content or to hide information the reader needs either way.

The optional `queryGroup` prop lets a reader link directly to a tab, such as
`/docs/my-page?packagemanager=npm`.

```mdx
<Tabs scrollable size="small" type="underlined" defaultActiveId="npm" queryGroup="packagemanager">
<TabPanel id="npm" label="npm">

// ...

</TabPanel>
<TabPanel id="yarn" label="Yarn">

// ...

</TabPanel>
</Tabs>
```

## Data and diagrams

### Tables

#### Use a table when each row shares the same set of attributes

A part and its description, a type and when to use it, an if and a then. A table with
one populated column is a list.

Keep cells short. When a cell needs more than a sentence or two, the content probably
belongs in prose with the table reduced to a summary.

#### Introduce a table in the sentence before it

Not every screen reader announces that a table is coming. A reader can land in the first
cell with no idea what the rows hold.

#### Don't merge cells

A merged cell breaks the row-and-column relationship a screen reader uses to read a
table, so the reader loses track of which heading applies. If the content needs merged
cells, it needs two tables.

### Diagrams

#### Use a diagram to support the prose

A rendered diagram reaches fewer readers than the sentence next to it, so the text near
it has to carry the takeaway on its own. A reader using a screen reader, a reader on a
slow connection, and an agent reading the markdown export all depend on that sentence.

#### Every diagram needs `accTitle` and `accDescr`

Mermaid renders them into the SVG as `<title>` and `aria-labelledby`, which is what a
screen reader announces. Without them the diagram is an unlabeled graphic. `accTitle` is
one line naming what the diagram shows; `accDescr` describes the content, and takes a
braced block when it runs past one line. See the [Mermaid accessibility
options](https://mermaid.js.org/config/accessibility.html).

Write a fenced code block with `mermaid` as the language. The MDX renderer routes these
through the shared `Mermaid` component, so theming follows light and dark mode
automatically. For the full syntax, see the [Mermaid diagram
reference](https://mermaid.js.org/intro/syntax-reference.html).

````mdx
```mermaid
sequenceDiagram accTitle: Sign-in token exchange accDescr { A user clicks Sign in. The
browser requests authorization from Supabase, and Supabase returns a token to the
browser. }

participant User participant Browser participant Supabase

User->>Browser: Clicks "Sign in" Browser->>Supabase: Request authorization
Supabase->>Browser: Return token
```
````

- Put a standard Mermaid keyword, such as `sequenceDiagram`, `flowchart`, or
  `erDiagram`, on the first line. `flowchart` accepts a direction such as `LR` or `TD`.
- Write `accDescr` for someone who can't see the diagram. Name the nodes and the
  relationships between them. Restating the title tells that reader nothing.
- Keep each diagram focused on a single flow or concept. Split a dense diagram into
  smaller ones.
- Wrap node labels containing special characters in double quotes, including `*`, `/`,
  spaces, and punctuation: `A["content/**/*.md"]`.
- Don't hardcode colors. The component themes the diagram for both modes.

A diagram whose content can't survive being described in `accDescr` and the surrounding
prose is carrying too much. Split it, or replace it with a table.

## Media

### Images

#### Use an image when the reader needs to recognize something on screen

A dashboard control that's hard to describe in words is the usual case. Upload images to
`apps/docs/public/img`.

Use `.svg` for vector illustrations and `.png` for screenshots and other non-vector
graphics. Supported browsers receive `.webp` versions automatically.

#### Redact sensitive information

Remove API keys and any other secret visible in a screenshot before you upload it.

#### Write alt text that describes the image

A topic name is what the nearby heading already says. Describe what a reader who can't
see it would need: the labeled parts, the relationships between them, and any values it
carries.

#### Every image needs an `alt` attribute

Give a decorative image an empty one, `alt=""`, so a screen reader skips it rather than
reading a filename.

#### Never put new information only in an image

Whatever the image shows has to also exist in the text, because a reader who can't see
it has no other source.

#### Don't use an image of text, code, or terminal output

Use real text, which can be read aloud, searched, copied, and translated.

### Videos

#### Include a video as a table of contents video

Don't place a video in the main text. Define it in the page frontmatter:

```yaml
---
tocVideo: 'rzglqRdZUQE'
---
```

## Navigation

### Links

#### Link selectively

Every link is a decision the reader has to make, so a page dense with them costs more
attention than it saves. When a term needs one sentence of explanation, write the
sentence instead of sending the reader away. Link the same destination once per page,
unless the page is long enough that a reader is unlikely to have seen the first one.

#### Write link text that describes the destination

Use the target's title, or a phrase that names what the reader gets. The text has to
make sense read on its own, because assistive technology can list every link on a page
out of context.

- **Recommended**: `For more information about policies, see [Row Level Security](/docs/guides/database/postgres/row-level-security).`
- **Not recommended**: `For more information about policies, [click here](/docs/guides/database/postgres/row-level-security).`
- **Not recommended**: `See [this guide](/docs/guides/database/postgres/row-level-security).`

#### Put the identifying words first, and keep the text short

Use the shortest span that still describes the destination: `see the [reference
section](/link)` rather than `[see the reference section](/link)`.

#### Never use a bare URL as link text

Name the thing instead.

- **Recommended**: `[HTTP/1.1 RFC](https://www.rfc-editor.org/rfc/rfc2616)`
- **Not recommended**: `[https://www.rfc-editor.org/rfc/rfc2616](https://www.rfc-editor.org/rfc/rfc2616)`

#### Introduce a link with `see`, and say what the reader will find

Write `For more information about X, see Y` rather than `For more information on X, see
Y`. The `about` clause is what tells a reader whether the link is worth following.

#### Keep sentence punctuation outside the link

Write `see [Test your code](/link).` rather than `see [Test your code.](/link)`.

#### Say when a link does something the reader won't expect

A download, a new tab, or a jump within the page should be named in the link text or the
sentence around it.

#### Say when a link leaves Supabase docs

Name the destination in the sentence rather than relying on an icon: `see the Postgres
documentation on [row security
policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)`.

#### Don't include the `https://supabase.com` origin

For pages on `supabase.com`, link with a path. Use a `/docs/...` path for a page in
Supabase docs, such as `[getting started](/docs/guides/getting-started)`. Use a
site-root path for a page outside docs, such as `[open the Supabase
Dashboard](/dashboard)`.

#### Link to a section with its anchor

Within a page, name the section: `see the [Links](#links) section of this document`.
Across pages, append the anchor to the path:
`[Chunking](./03-page-structure.md#chunking)`. Anchors come from heading text, so
renaming a heading breaks every link to it. See [Headings](#headings).

For when to cross-reference a section rather than repeat it, see [Navigation and
glue](./03-page-structure.md#navigation-and-glue).

### Content listings

#### Use a content listing on an overview or index page

A content listing holds a curated set of links, such as "Get started", "Next steps",
"Examples", or "Resources". Place the component inline in the guide MDX:

```mdx
<ContentListings id="storage-get-started" />
```

Use a partial only when the block is reused or gated with `$Show` at the partial level.
For an individual item that depends on a feature flag, set `feature` on the item rather
than wrapping the whole listing.

For the data file, ID uniqueness rules, and the test command, see
[CONTRIBUTING.md](../CONTRIBUTING.md).
