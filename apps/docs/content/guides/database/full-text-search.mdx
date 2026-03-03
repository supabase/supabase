---
id: 'full-text-search'
title: 'Full Text Search'
description: 'How to use full text search in PostgreSQL.'
subtitle: 'How to use full text search in PostgreSQL.'
tocVideo: 'GRwIa-ce7RA'
---

Postgres has built-in functions to handle `Full Text Search` queries. This is like a "search engine" within Postgres.

## Preparation

For this guide we'll use the following example data:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="data"
  queryGroup="example-view"
>
<TabPanel id="data" label="Data">

{/* supa-mdx-lint-disable Rule003Spelling */}

| id  | title                               | author                 | description                                                        |
| --- | ----------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| 1   | The Poky Little Puppy               | Janette Sebring Lowrey | Puppy is slower than other, bigger animals.                        |
| 2   | The Tale of Peter Rabbit            | Beatrix Potter         | Rabbit eats some vegetables.                                       |
| 3   | Tootle                              | Gertrude Crampton      | Little toy train has big dreams.                                   |
| 4   | Green Eggs and Ham                  | Dr. Seuss              | Sam has changing food preferences and eats unusually colored food. |
| 5   | Harry Potter and the Goblet of Fire | J.K. Rowling           | Fourth year of school starts, big drama ensues.                    |

{/* supa-mdx-lint-enable Rule003Spelling */}

</TabPanel>
<TabPanel id="sql" label="SQL">

```sql
create table books (
  id serial primary key,
  title text,
  author text,
  description text
);

insert into books
  (title, author, description)
values
  (
    'The Poky Little Puppy',
    'Janette Sebring Lowrey',
    'Puppy is slower than other, bigger animals.'
  ),
  ('The Tale of Peter Rabbit', 'Beatrix Potter', 'Rabbit eats some vegetables.'),
  ('Tootle', 'Gertrude Crampton', 'Little toy train has big dreams.'),
  (
    'Green Eggs and Ham',
    'Dr. Seuss',
    'Sam has changing food preferences and eats unusually colored food.'
  ),
  (
    'Harry Potter and the Goblet of Fire',
    'J.K. Rowling',
    'Fourth year of school starts, big drama ensues.'
  );
```

</TabPanel>
</Tabs>

## Usage

The functions we'll cover in this guide are:

### `to_tsvector()` [#to-tsvector]

Converts your data into searchable tokens. `to_tsvector()` stands for "to text search vector." For example:

```sql
select to_tsvector('green eggs and ham');
-- Returns 'egg':2 'green':1 'ham':4
```

Collectively these tokens are called a "document" which Postgres can use for comparisons.

### `to_tsquery()` [#to-tsquery]

Converts a query string into tokens to match. `to_tsquery()` stands for "to text search query."

This conversion step is important because we will want to "fuzzy match" on keywords.
For example if a user searches for `eggs`, and a column has the value `egg`, we probably still want to return a match.

Postgres provides several functions to create tsquery objects:

- **`to_tsquery()`** - Requires manual specification of operators (`&`, `|`, `!`)
- **`plainto_tsquery()`** - Converts plain text to an AND query: `plainto_tsquery('english', 'fat rats')` → `'fat' & 'rat'`
- **`phraseto_tsquery()`** - Creates phrase queries: `phraseto_tsquery('english', 'fat rats')` → `'fat' <-> 'rat'`
- **`websearch_to_tsquery()`** - Supports web search syntax with quotes, "or", and negation

### Match: `@@` [#match]

The `@@` symbol is the "match" symbol for Full Text Search. It returns any matches between a `to_tsvector` result and a `to_tsquery` result.

Take the following example:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select *
from books
where title = 'Harry';
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.from('books').select().eq('title', 'Harry')
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .eq('title', 'Harry');
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await supabase.from("books")
  .select()
  .eq("title", value: "Harry")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        eq("title", "Harry")
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = supabase.from_('books').select().eq('title', 'Harry').execute()
```

</TabPanel>
</$Show>
</Tabs>

The equality symbol above (`=`) is very "strict" on what it matches. In a full text search context, we might want to find all "Harry Potter" books and so we can rewrite the
example above:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select *
from books
where to_tsvector(title) @@ to_tsquery('Harry');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.from('books').select().textSearch('title', `'Harry'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('title', "'Harry'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await supabase.from("books")
  .select()
  .textSearch("title", value: "'Harry'")
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("title", "'Harry'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
</Tabs>

## Basic full text queries

### Search a single column

To find all `books` where the `description` contain the word `big`:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  to_tsvector(description)
  @@ to_tsquery('big');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.from('books').select().textSearch('description', `'big'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('description', "'big'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = await client.from("books")
  .select()
  .textSearch("description", value: "'big'")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("description", "'big'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = supabase.from_('books').select().text_search('description', "'big'").execute()
```

</TabPanel>
</$Show>

<TabPanel id="data" label="Data">

{/* supa-mdx-lint-disable Rule003Spelling */}

| id  | title                               | author            | description                                     |
| --- | ----------------------------------- | ----------------- | ----------------------------------------------- |
| 3   | Tootle                              | Gertrude Crampton | Little toy train has big dreams.                |
| 5   | Harry Potter and the Goblet of Fire | J.K. Rowling      | Fourth year of school starts, big drama ensues. |

{/* supa-mdx-lint-enable Rule003Spelling */}

</TabPanel>
</Tabs>

### Search multiple columns

Right now there is no direct way to use JavaScript or Dart to search through multiple columns but you can do it by creating [computed columns](https://postgrest.org/en/stable/api.html#computed-virtual-columns) on the database.

To find all `books` where `description` or `title` contain the word `little`:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  to_tsvector(description || ' ' || title) -- concat columns, but be sure to include a space to separate them!
  @@ to_tsquery('little');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```sql
create function title_description(books) returns text as $$
  select $1.title || ' ' || $1.description;
$$ language sql immutable;
```

```js
const { data, error } = await supabase
  .from('books')
  .select()
  .textSearch('title_description', `little`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```sql
create function title_description(books) returns text as $$
  select $1.title || ' ' || $1.description;
$$ language sql immutable;
```

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('title_description', "little")
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```sql
create function title_description(books) returns text as $$
  select $1.title || ' ' || $1.description;
$$ language sql immutable;
```

```swift
let response = try await client
  .from("books")
  .select()
  .textSearch("title_description", value: "little")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```sql
create function title_description(books) returns text as $$
  select $1.title || ' ' || $1.description;
$$ language sql immutable;
```

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("title_description", "title", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```sql
create function title_description(books) returns text as $$
  select $1.title || ' ' || $1.description;
$$ language sql immutable;
```

```python
data = supabase.from_('books').select().text_search('title_description', "little").execute()
```

</TabPanel>
</$Show>
<TabPanel id="data" label="Data">

{/* supa-mdx-lint-disable Rule003Spelling */}

| id  | title                 | author                 | description                                 |
| --- | --------------------- | ---------------------- | ------------------------------------------- |
| 1   | The Poky Little Puppy | Janette Sebring Lowrey | Puppy is slower than other, bigger animals. |
| 3   | Tootle                | Gertrude Crampton      | Little toy train has big dreams.            |

{/* supa-mdx-lint-enable Rule003Spelling */}

</TabPanel>
</Tabs>

### Match all search words

To find all `books` where `description` contains BOTH of the words `little` and `big`, we can use the `&` symbol:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  to_tsvector(description)
  @@ to_tsquery('little & big'); -- use & for AND in the search query
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase
  .from('books')
  .select()
  .textSearch('description', `'little' & 'big'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('description', "'little' & 'big'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await client
  .from("books")
  .select()
  .textSearch("description", value: "'little' & 'big'");
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("description", "'title' & 'big'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = supabase.from_('books').select().text_search('description', "'little' & 'big'").execute()
```

</TabPanel>
</$Show>
<TabPanel id="data" label="Data">

{/* supa-mdx-lint-disable Rule003Spelling */}

| id  | title  | author            | description                      |
| --- | ------ | ----------------- | -------------------------------- |
| 3   | Tootle | Gertrude Crampton | Little toy train has big dreams. |

{/* supa-mdx-lint-enable Rule003Spelling */}

</TabPanel>
</Tabs>

### Match any search words

To find all `books` where `description` contain ANY of the words `little` or `big`, use the `|` symbol:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  to_tsvector(description)
  @@ to_tsquery('little | big'); -- use | for OR in the search query
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase
  .from('books')
  .select()
  .textSearch('description', `'little' | 'big'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('description', "'little' | 'big'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await client
  .from("books")
  .select()
  .textSearch("description", value: "'little' | 'big'")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("description", "'title' | 'big'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
response = client.from_('books').select().text_search('description', "'little' | 'big'").execute()
```

</TabPanel>
</$Show>
<TabPanel id="data" label="Data">

{/* supa-mdx-lint-disable Rule003Spelling */}

| id  | title                 | author                 | description                                 |
| --- | --------------------- | ---------------------- | ------------------------------------------- |
| 1   | The Poky Little Puppy | Janette Sebring Lowrey | Puppy is slower than other, bigger animals. |
| 3   | Tootle                | Gertrude Crampton      | Little toy train has big dreams.            |

{/* supa-mdx-lint-enable Rule003Spelling */}

</TabPanel>
</Tabs>

Notice how searching for `big` includes results with the word `bigger` (or `biggest`, etc).

## Partial search

Partial search is particularly useful when you want to find matches on substrings within your data.

### Implementing partial search

You can use the `:*` syntax with `to_tsquery()`. Here's an example that searches for any book titles beginning with "Lit":

```sql
select title from books where to_tsvector(title) @@ to_tsquery('Lit:*');
```

### Extending functionality with RPC

To make the partial search functionality accessible through the API, you can wrap the search logic in a stored procedure.

After creating this function, you can invoke it from your application using the SDK for your platform. Here's an example:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
create or replace function search_books_by_title_prefix(prefix text)
returns setof books AS $$
begin
  return query
  select * from books where to_tsvector('english', title) @@ to_tsquery(prefix || ':*');
end;
$$ language plpgsql;
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.rpc('search_books_by_title_prefix', { prefix: 'Lit' })
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final data = await supabase.rpc('search_books_by_title_prefix', params: { 'prefix': 'Lit' });
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await supabase.rpc(
  "search_books_by_title_prefix",
  params: ["prefix": "Lit"]
)
.execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val rpcParams = mapOf("prefix" to "Lit")
val result = supabase.postgrest.rpc("search_books_by_title_prefix", rpcParams)
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = client.rpc('search_books_by_title_prefix', { 'prefix': 'Lit' }).execute()
```

</TabPanel>
</$Show>
</Tabs>

This function takes a prefix parameter and returns all books where the title contains a word starting with that prefix. The `:*` operator is used to denote a prefix match in the `to_tsquery()` function.

## Handling spaces in queries

When you want the search term to include a phrase or multiple words, you can concatenate words using a `+` as a placeholder for space:

```sql
select * from search_books_by_title_prefix('Little+Puppy');
```

## Web search syntax with `websearch_to_tsquery()` [#websearch-to-tsquery]

The `websearch_to_tsquery()` function provides an intuitive search syntax similar to popular web search engines, making it ideal for user-facing search interfaces.

### Basic usage

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select *
from books
where to_tsvector(description) @@ websearch_to_tsquery('english', 'green eggs');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase
  .from('books')
  .select()
  .textSearch('description', 'green eggs', { type: 'websearch' })
```

</TabPanel>
</Tabs>

### Quoted phrases

Use quotes to search for exact phrases:

```sql
select * from books
where to_tsvector(description || ' ' || title) @@ websearch_to_tsquery('english', '"Green Eggs"');
-- Matches documents containing "Green" immediately followed by "Eggs"
```

### OR searches

Use "or" (case-insensitive) to search for multiple terms:

```sql
select * from books
where to_tsvector(description) @@ websearch_to_tsquery('english', 'puppy or rabbit');
-- Matches documents containing either "puppy" OR "rabbit"
```

### Negation

Use a dash (-) to exclude terms:

```sql
select * from books
where to_tsvector(description) @@ websearch_to_tsquery('english', 'animal -rabbit');
-- Matches documents containing "animal" but NOT "rabbit"
```

### Complex queries

Combine multiple operators for sophisticated searches:

```sql
select * from books
where to_tsvector(description || ' ' || title) @@
  websearch_to_tsquery('english', '"Harry Potter" or "Dr. Seuss" -vegetables');
-- Matches books by "Harry Potter" or "Dr. Seuss" but excludes those mentioning vegetables
```

## Creating indexes

Now that you have Full Text Search working, create an `index`. This allows Postgres to "build" the documents preemptively so that they
don't need to be created at the time we execute the query. This will make our queries much faster.

### Searchable columns

Let's create a new column `fts` inside the `books` table to store the searchable index of the `title` and `description` columns.

We can use a special feature of Postgres called
[Generated Columns](https://www.postgresql.org/docs/current/ddl-generated-columns.html)
to ensure that the index is updated any time the values in the `title` and `description` columns change.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="example-view"
>
<TabPanel id="sql" label="SQL">

```sql
alter table
  books
add column
  fts tsvector generated always as (to_tsvector('english', description || ' ' || title)) stored;

create index books_fts on books using gin (fts); -- generate the index

select id, fts
from books;
```

</TabPanel>
<TabPanel id="data" label="Data">

```
| id  | fts                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------- |
| 1   | 'anim':7 'bigger':6 'littl':10 'poki':9 'puppi':1,11 'slower':3                                                 |
| 2   | 'eat':2 'peter':8 'rabbit':1,9 'tale':6 'veget':4                                                               |
| 3   | 'big':5 'dream':6 'littl':1 'tootl':7 'toy':2 'train':3                                                         |
| 4   | 'chang':3 'color':9 'eat':7 'egg':12 'food':4,10 'green':11 'ham':14 'prefer':5 'sam':1 'unus':8                |
| 5   | 'big':6 'drama':7 'ensu':8 'fire':15 'fourth':1 'goblet':13 'harri':9 'potter':10 'school':4 'start':5 'year':2 |
```

</TabPanel>
</Tabs>

### Search using the new column

Now that we've created and populated our index, we can search it using the same techniques as before:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  fts @@ to_tsquery('little & big');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.from('books').select().textSearch('fts', `'little' & 'big'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('fts', "'little' & 'big'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await client
  .from("books")
  .select()
  .textSearch("fts", value: "'little' & 'big'")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("fts", "'title' & 'big'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = client.from_('books').select().text_search('fts', "'little' & 'big'").execute()
```

</TabPanel>
</$Show>
<TabPanel id="data" label="Data">

{/* supa-mdx-lint-disable Rule003Spelling */}

| id  | title  | author            | description                      | fts                                                     |
| --- | ------ | ----------------- | -------------------------------- | ------------------------------------------------------- |
| 3   | Tootle | Gertrude Crampton | Little toy train has big dreams. | 'big':5 'dream':6 'littl':1 'tootl':7 'toy':2 'train':3 |

{/* supa-mdx-lint-enable Rule003Spelling */}

</TabPanel>
</Tabs>

## Query operators

Visit [Postgres: Text Search Functions and Operators](https://www.postgresql.org/docs/current/functions-textsearch.html)
to learn about additional query operators you can use to do more advanced `full text queries`, such as:

### Proximity: `<->` [#proximity]

The proximity symbol is useful for searching for terms that are a certain "distance" apart.
For example, to find the phrase `big dreams`, where the a match for "big" is followed immediately by a match for "dreams":

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  to_tsvector(description) @@ to_tsquery('big <-> dreams');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase
  .from('books')
  .select()
  .textSearch('description', `'big' <-> 'dreams'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('description', "'big' <-> 'dreams'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await client
  .from("books")
  .select()
  .textSearch("description", value: "'big' <-> 'dreams'")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("description", "'big' <-> 'dreams'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = client.from_('books').select().text_search('description', "'big' <-> 'dreams'").execute()
```

</TabPanel>
</$Show>
</Tabs>

We can also use the `<->` to find words within a certain distance of each other. For example to find `year` and `school` within 2 words of each other:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  to_tsvector(description) @@ to_tsquery('year <2> school');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase
  .from('books')
  .select()
  .textSearch('description', `'year' <2> 'school'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('description', "'year' <2> 'school'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await supabase
  .from("books")
  .select()
  .textSearch("description", value: "'year' <2> 'school'")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("description", "'year' <2> 'school'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = client.from_('books').select().text_search('description', "'year' <2> 'school'").execute()
```

</TabPanel>
</$Show>
</Tabs>

### Negation: `!` [#negation]

The negation symbol can be used to find phrases which _don't_ contain a search term.
For example, to find records that have the word `big` but not `little`:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

```sql
select
  *
from
  books
where
  to_tsvector(description) @@ to_tsquery('big & !little');
```

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase
  .from('books')
  .select()
  .textSearch('description', `'big' & !'little'`)
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .from('books')
  .select()
  .textSearch('description', "'big' & !'little'");
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await client
  .from("books")
  .select()
  .textSearch("description", value: "'big' & !'little'")
  .execute()
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
val data = supabase.from("books").select {
    filter {
        textSearch("description", "'big' & !'little'", TextSearchType.NONE)
    }
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = client.from_('books').select().text_search('description', "'big' & !'little'").execute()
```

</TabPanel>
</$Show>
</Tabs>

## Ranking search results [#ranking]

Postgres provides ranking functions to sort search results by relevance, helping you present the most relevant matches first. Since ranking functions need to be computed server-side, use RPC functions and generated columns.

### Creating a search function with ranking [#search-function-ranking]

First, create a Postgres function that handles search and ranking:

```sql
create or replace function search_books(search_query text)
returns table(id int, title text, description text, rank real) as $$
begin
  return query
  select
    books.id,
    books.title,
    books.description,
    ts_rank(to_tsvector('english', books.description), to_tsquery(search_query)) as rank
  from books
  where to_tsvector('english', books.description) @@ to_tsquery(search_query)
  order by rank desc;
end;
$$ language plpgsql;
```

Now you can call this function from your client:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.rpc('search_books', { search_query: 'big' })
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .rpc('search_books', params: { 'search_query': 'big' });
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = client.rpc('search_books', { 'search_query': 'big' }).execute()
```

</TabPanel>
</$Show>
<TabPanel id="sql" label="SQL">

```sql
select * from search_books('big');
```

</TabPanel>
</Tabs>

### Ranking with weighted columns [#weighted-ranking]

Postgres allows you to assign different importance levels to different parts of your documents using weight labels. This is especially useful when you want matches in certain fields (like titles) to rank higher than matches in other fields (like descriptions).

#### Understanding weight labels

Postgres uses four weight labels: **A**, **B**, **C**, and **D**, where:

- **A** = Highest importance (weight 1.0)
- **B** = High importance (weight 0.4)
- **C** = Medium importance (weight 0.2)
- **D** = Low importance (weight 0.1)

#### Creating weighted search columns

First, create a weighted tsvector column that gives titles higher priority than descriptions:

```sql
-- Add a weighted fts column
alter table books
add column fts_weighted tsvector
generated always as (
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', description), 'B')
) stored;

-- Create index for the weighted column
create index books_fts_weighted on books using gin (fts_weighted);
```

Now create a search function that uses this weighted column:

```sql
create or replace function search_books_weighted(search_query text)
returns table(id int, title text, description text, rank real) as $$
begin
  return query
  select
    books.id,
    books.title,
    books.description,
    ts_rank(books.fts_weighted, to_tsquery(search_query)) as rank
  from books
  where books.fts_weighted @@ to_tsquery(search_query)
  order by rank desc;
end;
$$ language plpgsql;
```

#### Custom weight arrays

You can also specify custom weights by providing a weight array to `ts_rank()`:

```sql
create or replace function search_books_custom_weights(search_query text)
returns table(id int, title text, description text, rank real) as $$
begin
  return query
  select
    books.id,
    books.title,
    books.description,
    ts_rank(
      '{0.0, 0.2, 0.5, 1.0}'::real[], -- Custom weights {D, C, B, A}
      books.fts_weighted,
      to_tsquery(search_query)
    ) as rank
  from books
  where books.fts_weighted @@ to_tsquery(search_query)
  order by rank desc;
end;
$$ language plpgsql;
```

This example uses custom weights where:

- A-labeled terms (titles) have maximum weight (1.0)
- B-labeled terms (descriptions) have medium weight (0.5)
- C-labeled terms have low weight (0.2)
- D-labeled terms are ignored (0.0)

#### Using the weighted search

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
// Search with standard weighted ranking
const { data, error } = await supabase.rpc('search_books_weighted', { search_query: 'Harry' })

// Search with custom weights
const { data: customData, error: customError } = await supabase.rpc('search_books_custom_weights', {
  search_query: 'Harry',
})
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
# Search with standard weighted ranking
data = client.rpc('search_books_weighted', { 'search_query': 'Harry' }).execute()

# Search with custom weights
custom_data = client.rpc('search_books_custom_weights', { 'search_query': 'Harry' }).execute()
```

</TabPanel>
</$Show>
<TabPanel id="sql" label="SQL">

```sql
-- Standard weighted search
select * from search_books_weighted('Harry');

-- Custom weighted search
select * from search_books_custom_weights('Harry');
```

</TabPanel>
</Tabs>

#### Practical example with results

Say you search for "Harry". With weighted columns:

1. **"Harry Potter and the Goblet of Fire"** (title match) gets weight A = 1.0
2. **Books mentioning "Harry" in description** get weight B = 0.4

This ensures that books with "Harry" in the title ranks significantly higher than books that only mention "Harry" in the description, providing more relevant search results for users.

### Using ranking with indexes [#ranking-with-indexes]

When using the `fts` column you created earlier, ranking becomes more efficient. Create a function that uses the indexed column:

```sql
create or replace function search_books_fts(search_query text)
returns table(id int, title text, description text, rank real) as $$
begin
  return query
  select
    books.id,
    books.title,
    books.description,
    ts_rank(books.fts, to_tsquery(search_query)) as rank
  from books
  where books.fts @@ to_tsquery(search_query)
  order by rank desc;
end;
$$ language plpgsql;
```

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.rpc('search_books_fts', { search_query: 'little & big' })
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final result = await client
  .rpc('search_books_fts', params: { 'search_query': 'little & big' });
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
data = client.rpc('search_books_fts', { 'search_query': 'little & big' }).execute()
```

</TabPanel>
</$Show>
<TabPanel id="sql" label="SQL">

```sql
select * from search_books_fts('little & big');
```

</TabPanel>
</Tabs>

### Using web search syntax with ranking [#websearch-ranking]

You can also create a function that combines `websearch_to_tsquery()` with ranking for user-friendly search:

```sql
create or replace function websearch_books(search_text text)
returns table(id int, title text, description text, rank real) as $$
begin
  return query
  select
    books.id,
    books.title,
    books.description,
    ts_rank(books.fts, websearch_to_tsquery('english', search_text)) as rank
  from books
  where books.fts @@ websearch_to_tsquery('english', search_text)
  order by rank desc;
end;
$$ language plpgsql;
```

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
// Support natural search syntax
const { data, error } = await supabase.rpc('websearch_books', {
  search_text: '"little puppy" or train -vegetables',
})
```

</TabPanel>
<TabPanel id="sql" label="SQL">

```sql
select * from websearch_books('"little puppy" or train -vegetables');
```

</TabPanel>
</Tabs>

## Resources

- [Postgres: Text Search Functions and Operators](https://www.postgresql.org/docs/12/functions-textsearch.html)
