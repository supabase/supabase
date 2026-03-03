# SQL Editor Overview

Quick run-through of the different building blocks that make up the SQL Editor, to help navigating the codebase a little easier 🙂🙏

## UI structure

- Folders and snippets (in the product menu) are rendered via `SQLEditorMenu` and `SQLEditorNav`, in which the data are all loaded from the API via React Query directly. (Refer to point 3 under "Data Structure" below)

  - [`SQLEditorMenu`](https://github.com/supabase/supabase/blob/master/apps/studio/components/layouts/SQLEditorLayout/SQLEditorMenu.tsx): Wraps around `SQLEditorNav` + renders search input + View running queries button
  - [`SQLEditorNav`](https://github.com/supabase/supabase/blob/master/apps/studio/components/layouts/SQLEditorLayout/SQLEditorNavV2/SQLEditorNav.tsx): Renders the 3 collapsible snippet sections

- The Tabs interface is powered by a separate state [`tabs.ts`](https://github.com/supabase/supabase/blob/master/apps/studio/state/tabs.ts). (Also used by the Table Editor)

- Route validation to check for snippet validity + last visited snippet lies in the page level on [`[id].tsx`](https://github.com/supabase/supabase/blob/master/apps/studio/pages/project/%5Bref%5D/sql/%5Bid%5D.tsx)

- When searching for snippets, we're deliberately opting to render the results as a flat list in [`SearchList`](https://github.com/supabase/supabase/blob/master/apps/studio/components/layouts/SQLEditorLayout/SQLEditorNavV2/SearchList.tsx) for ease of finding (rather than keeping the 3 separate sections / having folders)

## Data structure

- SQL Editor is mainly powered by a Valtio store in [`sql-editor-v2.ts`](https://github.com/supabase/supabase/blob/master/apps/studio/state/sql-editor-v2.ts), in which most of the data is being managed on the client side for optimistic rendering to keep the editor feeling snappy. (unlike other parts of the dashboard where the data is always invalidated whenever a mutation happens).

- The Valtio store here stores snippets across multiple projects as we aren't using a context provider, though this was a legacy decision (refer to [`ProjectContext`](https://github.com/supabase/supabase/blob/master/apps/studio/components/layouts/ProjectLayout/ProjectContext.tsx) for more context on using providers with stores)

- While [`SQLEditorNav`](https://github.com/supabase/supabase/blob/master/apps/studio/components/layouts/SQLEditorLayout/SQLEditorNavV2/SQLEditorNav.tsx) renders the folders + snippets directly from the API endpoints via React Query, we still store them in the Valtio store to store some properties used on the client side like `splitSizes` and `projectRef` for snippets, and `status` for folders (although it's possible that we can simplify the Valtio store).

## Data fetching

- The endpoint to fetch snippets and folders are via [`useSQLSnippetFoldersQuery`](https://github.com/supabase/supabase/blob/master/apps/studio/data/content/sql-folders-query.ts) and [`useSqlSnippetsQuery`](https://github.com/supabase/supabase/blob/master/apps/studio/data/content/sql-snippets-query.ts), both of which are paginated (limit set at 100)

  - [`useSQLSnippetFoldersQuery`](https://github.com/supabase/supabase/blob/master/apps/studio/data/content/sql-folders-query.ts): Specifically for fetching private snippets and folders
  - [`useSqlSnippetsQuery`](https://github.com/supabase/supabase/blob/master/apps/studio/data/content/sql-snippets-query.ts): For fetching shared and favorite snippets

- Page fetching is done on demand for the snippets via a "Load more" button due to the complexity of a tree view (we've deliberate avoided an infinite loading UX which we commonly do across other parts of the dashboard)

## Data flow

### Landing on the SQL Editor

- Snippets and folders are all initially loaded via React Query in [`SQLEditorNav`](https://github.com/supabase/supabase/blob/master/apps/studio/components/layouts/SQLEditorLayout/SQLEditorNavV2/SQLEditorNav.tsx), which are then initialized into the Valtio store via [`snapV2.addSnippet`](https://github.com/supabase/supabase/blob/master/apps/studio/components/layouts/SQLEditorLayout/SQLEditorNavV2/SQLEditorNav.tsx#L415) calls in the `useEffects`

- On `/editor/sql`

  - We'll redirect users to the last visited snippet if there's one (`/editor/sql/[id]`), otherwise will redirect to `/editor/sql/new` (within [`[id].tsx`](https://github.com/supabase/supabase/blob/master/apps/studio/pages/project/%5Bref%5D/sql/%5Bid%5D.tsx) )

- On `/editor/sql/[id]`
  - We'll load the content of the snippet via `useContentQuery` and update the Valtio store via [`snapV2.setSnippet`](https://github.com/supabase/supabase/blob/master/apps/studio/pages/project/%5Bref%5D/sql/%5Bid%5D.tsx#L69)

### Writing a snippet

- On `/editor/sql/new`:

  - The first character input will [update the Valtio store](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/SQLEditor/MonacoEditor.tsx#L192) with a snippet skeleton via `snapV2.addSnippet` and user will be redirected to `/editor/sql/[id]`, using the `id` from the skeleton
  - Note that `snapV2.addSnippet` only handles adding snippets to the store and does not queue the snippet for saving
  - Subsequent character inputs will follow below as per `/editor/sql/[id]`

- On `/editor/sql/[id]`:
  - [`snapV2.setSql`](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/SQLEditor/MonacoEditor.tsx#L207) will be called based on the debounced value of the code editor, in which we'll then queue the snippet for [saving](https://github.com/supabase/supabase/blob/master/apps/studio/state/sql-editor-v2.ts#L477) via `upsertSnippet`.
  - Note that we do invalidate some React Queries (snippet count, snippets, and folders) after saving via [`upsertSnippet`](https://github.com/supabase/supabase/blob/master/apps/studio/state/sql-editor-v2.ts#L412), but the invalidation is only [triggered](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/SQLEditor/MonacoEditor.tsx#L209) if it's a new snippet that's not saved in the DB yet

### Running a snippet

- There's several safeguards in place before we run the query

  - [Check for destructive operations](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx#L293): Will open a confirmation modal before running the query
  - [Check for update statements without where clause](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx#L300): Will open a confirmation modal before running the query
  - [Append a preset limit to the query if it's a select](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx#L333): To prevent accidentally running an expensive query on the database. Users can explicitly opt out of this to set "No limit"

- If the snippet's name is "Untitled query", we'll also trigger a non-blocking request to [rename the snippet via AI](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx#L317). Snippet name will be updated whenever the request completes.

### Renaming, Moving, Deleting, Sharing snippets

- These functionalities all call `upsertContent` via React Query directly without going through the Valtio store
- We thereafter update the Valtio stores for the SQL Editor and Tabs as required if the upsert is successful

## Possible areas to simplify, refactor, or improve

- `updateSnippet` and `setSql` could be consolidated in `sql-editor-v2.ts`

- Refactor renaming a query to have optimistic rendering for consistency on how we update snippets in the `sql-editor-v2.ts`

- Implement drag and drop functionality for snippets into folders

- `RenameQueryModal` and `MoveQueryModal`, could call `updateSnippet` instead of `removeSnippet` + `addSnippet`?
