# How-to guide template

**Category:** Task content.

**Reader question:** "How do I do one task?" The page is a Procedure  
([Information types](../03-page-structure.md#information-types)); link out for the rest.

A task is one unit of work, done from beginning to end for one audience: the reader  
starts without a result and finishes with it working. A part with no usable result of its  
own is a subtask, so keep it as a step or phase. Split when the page gains a second unit  
of work or audience, or background past a short paragraph. Background goes to an explainer.

## Frontmatter

- `title`: an imperative verb phrase, 35 characters or fewer, such as `Create a table`.
- `description`: one sentence of 150 to 160 characters naming the task and the outcome.

## Headings, in order

1. **Required**: Value statement, no heading. What the reader does and what they have when done.
2. **Optional**: `## Overview`, for essential context that doesn't make sense to break out elsewhere.
3. **Optional**: `## Prerequisites`, if the reader needs something first. Link an item to where to get it unless that is self-explanatory.
4. **Required**: `## <Task>`, the happy-path procedure, or `## Procedure` if the task repeats the title.
5. **Optional**: `## Verify`, if there is something to check. A numbered procedure with a command or request and the output that means it worked.
6. **Required**: `## Next steps`: two to four links, each with a reason.
7. **Optional**: `## Related resources`, last on the page. Links to related pages that aren't a next action, each with a reason, so readers and agents can find connected information.

Repeat item 4 for each stage or variant of the task, per
[Branch procedures by what differs](#branch-procedures-by-what-differs).

## Procedure principles

### Use lead-in sentences

Put at least one sentence under every heading before a list, code block, table, or
subheading, and open every list with a lead-in sentence that says what the list holds.

### Be effortless

Remove any toil from the reader at every opportunity. If you can avoid a click by embedding a step directly, do it. Wherever possible, give the reader complete, copy-paste code and the exact  
values. If we have documented elsewhere a more complex and essential procedure, linking is fine.

### Use placeholders

A how-to guide serves the reader's own project, so don't invent a sample table or value.
Write a placeholder such as `YOUR_TABLE`, per
[Code blocks](../02-elements.md#write-a-placeholder-in-uppercase-with-a-your_-prefix),
and name it in the step that first uses it.

### Write prerequisites

List what the reader must have or do before step 1, under a lead-in sentence, and link each
item to where to get it unless that is self-explanatory. Name the path an item applies to,
such as the Management API. Setup commands, such as exporting variables, are steps, so
put them in the Procedure. A shortcut for an urgent case is a note at the top of the Procedure.

### Branch procedures by what differs

When a task branches, sort each branch by what differs:

- **A later stage of the same result**: give it its own `## <Task>` heading, in the order the
  reader does the stages, such as `Enable <thing>` then `Use <thing>`.
- **Another way to reach the same result**, such as the Dashboard or the API: keep it in one
  procedure, as tabs or parallel sub-headings with the same outcome.
- **A variant that changes the steps or the result**: give it its own `## <Task>` heading after
  the main path, named for the variant.
- **A variant with different prerequisites or a different audience**: move it to its own page
  and link to it, because it is a second unit of work.

### Chunk thoroughly

A short procedure has two to six steps: a lead-in sentence, then one numbered list. Write
every numbered list, Verify included, with at least two steps. A genuinely atomic
instruction, such as `Click **Save**.`, is a sentence rather than a list, so don't add a
redundant orientation step. When one action needs context to make sense, add a grounding
step first, such as opening the SQL Editor from the project. A long procedure, past six
steps, opens with a lead-in sentence that previews its numbered H3 phases, such as
`### 1. Configure your project`. Each phase has a lead-in sentence and its own numbered list. When you number a phase on an
existing page, keep its old anchor with a custom ID, such as
`### 1. Create a key [#create-a-key]`.

## Example

````md
---
title: Enable Row Level Security
description: Enable Row Level Security on a table in your Supabase project, then confirm that an anonymous request to that table returns no rows from the API, as intended.
---

Restrict a table so only users you allow can read it.

## Procedure

To enable Row Level Security on `YOUR_TABLE`, run one statement:

1. Connect to your database with `psql`, or open the SQL Editor in your project.
2. Run `alter table YOUR_TABLE enable row level security;`.

## Verify

To confirm it worked, check what an anonymous request returns:

1. Request `YOUR_TABLE` with the `anon` key, replacing `YOUR_PROJECT_REF` and `YOUR_ANON_KEY` with your project reference and `anon` key:

   ```bash
   curl "https://YOUR_PROJECT_REF.supabase.co/rest/v1/YOUR_TABLE" \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

2. Check that the response is empty. This result assumes `YOUR_TABLE` has no policy that allows `anon` reads. An existing permissive policy keeps returning rows after you enable RLS.

## Next steps

To keep going, use these pages:

- [Row Level Security](/docs/guides/database/postgres/row-level-security): write policies so users can read their own rows.
- [API keys](/docs/guides/getting-started/api-keys): choose the right key for each client.

## Related resources

To read more about the ideas behind this task, see these pages:

- [Securing your data](/docs/guides/database/secure-data): how Postgres roles and RLS protect your data.
````

## Not recommended and Recommended

- For location words such as _above_ and _below_, see [`WORD_LIST.md`](../WORD_LIST.md#above).
- **Not recommended**: A warning at the end of the page. **Recommended**: The warning inside its step.
- **Not recommended**: Linking to a full guide for a two-step action. **Recommended**: Write the steps and code inline.

## Checklist

- [ ] One unit of work, one audience, a value statement naming the result, and prerequisites that hold only what the reader needs before step 1, each linked.
- [ ] Every heading has a sentence under it and every list a lead-in sentence. Past six steps, numbered H3 phases that keep their old anchors.
- [ ] Steps and copy-paste code are on the page, complex actions link out, and any Verify is numbered and names the output.
- [ ] Next steps hold two to four links, any Related resources come last, and each link has a reason.
