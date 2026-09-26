# How to structure a page

A well-structured document drastically reduces cognitive load. This document breaks down
how to segment information so it can be found at the right time and place.

_Chunking_ is a major principle of effective technical writing. Break things up. If
there are too many chunks, group the chunks, and maybe break up some more. We want to
avoid a "too long, didn't read" situation.

Apply this document when you add a page or move content around on an existing one.

| If you're deciding                                     | Read                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| Which document type to write, and how big it should be | [Document types](#document-types)                             |
| Which reader question a chunk answers                  | [Information types](#information-types)                       |
| How to order sections on the page                      | [Grouping sections](#grouping-sections)                       |
| How many items belong in one group                     | [Chunking](#chunking)                                         |
| How to open a long page and connect its sections       | [Navigation and glue](#navigation-and-glue)                   |
| How to keep a page from going stale                    | [Write timeless documentation](#write-timeless-documentation) |
| What to leave out of the repo                          | [Keep internal context out](#keep-internal-context-out)       |

## Document types

Supabase docs contain five types of document. Decide which one you need before you start
writing.

| Type            | Purpose                     | Contains                            | Doesn't contain                  | Example                                                                            |
| --------------- | --------------------------- | ----------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| Explainer       | Learn a topic               | What it is, why, and when to use it | Instructions                     | [Auth architecture](/docs/guides/auth/architecture)                                |
| Tutorial        | Finish a multi-feature goal | Procedures plus the reasoning       | —                                | [Build a Next.js app](/docs/guides/getting-started/tutorials/with-nextjs)          |
| Guide           | Finish one task             | Procedures in sequence              | Background; link to an explainer | [Passwordless logins](/docs/guides/auth/auth-email-passwordless)                   |
| Reference       | Look something up           | Parameters, return types, samples   | Context and use cases            | [JavaScript client](/docs/reference/javascript/introduction)                       |
| Troubleshooting | Resolve one error           | The symptom, the cause, the fix     | Feature overviews                | [Too many channels](/docs/guides/troubleshooting/realtime-too-many-channels-error) |

Reference content is generated from spec files rather than hand-authored. See
[CONTRIBUTING.md](../CONTRIBUTING.md) for the reference pipeline.

Troubleshooting entries live in `content/troubleshooting/` and use TOML frontmatter.
Some sync from GitHub discussions, so check whether an entry exists before writing one.

### Open a guide with a value statement

Name what the reader can do and why it matters to them. That's what tells a reader or an
agent whether the page matches their goal.

- **Recommended**: `Restrict access to a shared table with Row Level Security. To learn how a policy is evaluated, see [Row Level Security](...).`
- **Not recommended**: Several paragraphs about how Row Level Security works before stating what the reader can do.

Keep procedures focused on what the reader must do. Move substantial background into a
separate section or an explainer and cross-reference the authoritative explanation
rather than repeating it. This keeps the action path scannable and maintains one source
of truth.

### Topic size

Each type above is one unit of work for the reader. An explainer covers one topic. A
guide covers one targeted task. A tutorial covers one multi-feature goal. A reference
page covers one thing the reader looks up.

#### One unit per page

Enabling Row Level Security is one guide. Writing policies is a second, and designing a
multi-tenant schema is a third. A reader who lands on the page from search should be
able to finish what they came for. Link to the related pages.

#### Keep a short piece inside its parent

A fact or a principle is often one sentence. Put it in the section it qualifies. A
heading whose only job is to point somewhere else is a link.

#### Give the next unit its own page

Split when a section has grown its own subsections and shares little with the rest of
the page beyond the subject word. The new page takes the second task or the second
concept, and this page links to it.

[Chunking](#chunking) limits how many items sit in one group. Topic size limits what
those items are about. A procedure can have six steps and still cover two tasks.

- **Recommended**: A passwordless email login guide with `Send a one-time password` and `Verify the code`.
- **Not recommended**: An `Authentication` page that also covers passwords, OAuth, and session storage.

## Information types

The [Information
Mapping](https://support.informationmapping.com/hc/en-us/articles/213446789-Present-your-information-in-a-clear-and-consistent-way)
method names six types of information. Each answers a different reader question, and
each has a form that suits it.

| Type      | Answers                              | Present with                                       | Build it per                                                                 |
| --------- | ------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Procedure | How do I do it?                      | Numbered steps, or an if/then table                | [Procedures](./02-elements.md#procedures), [Tables](./02-elements.md#tables) |
| Process   | What is happening? How does it work? | A stage-by-stage description, or a when/then table | [Tables](./02-elements.md#tables), [Diagrams](./02-elements.md#diagrams)     |
| Structure | What are its parts?                  | A part and description table, or a labeled diagram | [Tables](./02-elements.md#tables), [Diagrams](./02-elements.md#diagrams)     |
| Principle | What should I do or not do?          | Text, a list, or an admonition                     | [Lists](./02-elements.md#lists), [Admonitions](./02-elements.md#admonitions) |
| Concept   | What is it?                          | Text, a list, or a diagram                         | [Lists](./02-elements.md#lists), [Diagrams](./02-elements.md#diagrams)       |
| Fact      | What are the facts?                  | Text, a list, or a table                           | [Lists](./02-elements.md#lists), [Tables](./02-elements.md#tables)           |

### Classify the content

1. Split the content into chunks. One chunk is one thing you're telling the reader.
2. For each chunk, ask which reader question it answers, and read its type off the
   table above.
3. Build each chunk in the form its `Present with` column names. A chunk already in a
   different form is a defect. Fix it.
4. Group the chunks by type, per [Grouping sections](#grouping-sections).

[Example](#example) below works one paragraph through these steps.

### Separating the types

#### Separate a procedure, a process, a structure, or a concept

Each usually reads better in its own section. Procedure and process get blended most
often, because both answer a question about how, and a reader following steps can't act
on the process sentences.

#### Keep context out of the action path

A concept or a process tends to work better before the procedure or after it than
threaded through the steps.

#### Let a principle or a fact ride along

Either is often a single sentence, so it can sit in the section it qualifies rather than
getting one of its own. A fact about timing fits in the step it describes, and a
principle can close the concept paragraph that motivates it.

#### Look again at a long paragraph

Past three or four sentences, it has often picked up a second kind of information. Label
each sentence and see where the labels change.

#### Leave connective prose alone

An introduction, a transition, an outcome, and a navigation outline describe the page
rather than the product, so none of this applies to them.

### Example

Not recommended, because one paragraph blends a concept, a procedure, and a structure:

```md
Row Level Security is a Postgres feature that restricts which rows a user can read
or write, and it's the main way to secure a table that several users share. Enable
it by running `alter table profiles enable row level security`, which takes effect
immediately. Be careful, because a table with Row Level Security enabled and no
policy returns no rows to every client, so write a policy before you deploy. The
`using` clause of a policy accepts any expression that returns a boolean.
```

Recommended, with each type in the presentation that suits it:

```md
## Row Level Security

Row Level Security restricts which rows a user can read or write. It's the main way
to secure a table that several users share.

### Enable Row Level Security

1. Run `alter table profiles enable row level security`. The change takes effect
   immediately.
2. Write a policy that grants the access your app needs.

<Admonition type="caution">

A table with Row Level Security enabled and no policy returns no rows to `anon` or
`authenticated`. Write a policy before you deploy.

</Admonition>

### Policy reference

The `using` clause accepts any expression that returns a boolean.
```

## Grouping sections

Information types apply at the page level too. Group sections of related types together,
and keep the procedure group unbroken so context doesn't interrupt the action path.

### Classify a section by what the reader is doing in it

On a page about tables every section is about tables, so subject matter tells you
nothing. A reader opens a section on schemas to understand something, so it's context.

### Split a section that serves two types

Filing it under the larger half buries the other one. Give the new half a heading, keep
the heading text of the half that stays, and cross-reference the two.

One order that works: a short concept opener, then procedures, then concept and process,
then structure and fact.

```text
## What is a table?                    <- concept opener
## Creating and managing tables        <- procedures
### Creating tables
### Securing your tables
### Loading data
## How tables are organized            <- concept and process
### Primary keys
### Relationships between tables
### Schemas
## Reference                           <- structure and fact
### Data types
```

### Chunking

Apply the [Information Mapping chunking
principle](https://informationmapping.com/blogs/news/writing-for-the-web-the-magical-number-seven-plus-or-minus-two):
present 5 ± 1 related items at a time. That gives readers a manageable chunk of four to
six. Aim for the lower end when the task is complex or unfamiliar.

Information Mapping gives 7 ± 2 as the general limit and 5 ± 1 for content read on a
screen. Screen reading is less accurate than the same content on paper. Supabase docs
are read on a screen, so 5 ± 1 applies.

If a procedure has more than six steps, group related steps into named phases or smaller
procedures. Don't add steps to reach a minimum. The range organizes information.

The same limit applies to sections in a group. A page with ten top-level headings needs
grouping. Reordering them changes nothing.

Headings and lists are the other half of chunking. A long stretch of prose with no
heading gives a reader no way in and no way to skip. A reader navigating by heading has
nothing to navigate. Where a paragraph has grown past its one topic, a heading or a list
usually serves better than a longer paragraph.

A lookup surface is the exception. When a reader arrives to find one entry rather than
to read the page, the entries carry their own order: alphabetical, or the order of an
API. Grouping them into fives would hide what they came for.

A reference document is the same case. A reader opens this style guide to find one rule.
Its sections are a list to scan, not a sequence to hold in memory.

For how to format the steps inside a procedure, see
[`02-elements.md`](./02-elements.md).

## Navigation and glue

### Begin a long guide with a short outline of its major section groups

Link to each group and say when a reader should use it. Don't add section navigation to
a short guide when its headings already fit on one screen.

```md
Connect your app to Postgres through a connection pooler, a direct connection, or a
Supabase client library.

- [Choose a connection method](#choose-a-connection-method) compares the options and
  their trade-offs. Start here if you aren't sure which one fits your app.
- [Connect your app](#connect-your-app) has the steps for each method.
- [Connection parameters](#connection-parameters) lists every parameter and its
  default.
```

Each link says what the reader gets from that group, so someone who already knows which
method they want goes straight to the procedures.

### Connect contextual sections to their procedures

Do this when the relationship helps readers navigate. Add a brief introduction to each
section group, a transition when the information type changes, and an outcome after a
procedure. Add links selectively rather than linking every adjacent section.

- Group introduction: `The following sections cover each connection method in turn. Every method needs your project reference, which you find on the project settings page.`
- Transition where the type changes: `Those are the mechanics of opening a connection. To understand why a pooled connection behaves differently under load, see [Connection pooling](...).`
- Outcome after a procedure: `Your app now connects through the pooler. Queries that used to fail at the connection limit queue instead.`

## Write timeless documentation

Document the product as it is now. Language that fixes a page to a moment goes stale,
and a reader can't tell whether `currently` was written last week or three years ago.

### Avoid words that anchor a sentence to a point in time

| Avoid              | Avoid                 | Avoid                 |
| ------------------ | --------------------- | --------------------- |
| as of this writing | existing              | now                   |
| currently          | future, in the future | old, older            |
| does not yet       | latest                | presently, at present |
| eventually         | new, newer            | soon                  |

[`WORD_LIST.md`](./WORD_LIST.md) has entries for the two that come up most,
[currently](./WORD_LIST.md#currently) and [latest, new, and
soon](./WORD_LIST.md#latest-new-and-soon).

- **Recommended**: `The emulator supports the following filters.`
- **Not recommended**: `The emulator now supports the following filters.`

### Don't promise a feature that hasn't shipped

`Coming soon`, `will be available`, and `once finalized` all decay into inaccuracy, and
a reader can't act on any of them. When a phased rollout is real, state the criteria
that decide who has it: `Available to organizations on Pro and Enterprise plans`.

### Don't ship a placeholder page

A page saying `This is a placeholder` or `More details coming soon` promises content on
no schedule. Wait until the page is worth reading, or ship the smaller thing that's true
today. When navigation structure forces a page to exist, link out to resources that are
complete.

### Exceptions

Changelog, release notes, and blog content are time-sensitive by nature, and referencing
the future is their job. Procedural content can use a time word for a state change the
reader causes: `The table now appears in the editor.`

## Keep internal context out

Supabase docs are open source. Keep planning notes, unshipped features, business intent,
and references to ticketing systems out of the repo. Put review-time context in the pull
request description and product context in the team's project-management tool.
