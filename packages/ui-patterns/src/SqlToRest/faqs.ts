import { someFilter } from '@supabase/sql-to-rest'
import { stripIndent } from 'common-tags'

import { ResultBundle } from './util'

export type Faq = {
  id: string
  condition: (result: ResultBundle) => boolean
  question: string
  answer: string
}

export const faqs: Faq[] = [
  {
    id: 'what-is-curl',
    condition: (result) => result.language === 'curl',
    question: 'What is `curl`?',
    answer: stripIndent`
      \`curl\` is a popular command-line tool for performing HTTP requests. It's useful for testing your API to make sure it returns what you expect.

      You can also import \`curl\` commands into tools like [Postman](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-curl-commands/) via copy-paste.
    `,
  },
  {
    id: 'what-is-http',
    condition: (result) => result.language === 'http',
    question: 'What format is this?',
    answer: stripIndent`
      This shows the raw HTTP request sent to PostgREST. It gives you a detailed view of the exact HTTP method, path, headers, and body sent to the API.
    `,
  },
  {
    id: 'what-is-supabase-js',
    condition: (result) => result.language === 'js',
    question: 'What library is this?',
    answer: stripIndent`
      This snippet uses [\`supabase-js\`](https://github.com/supabase/supabase-js), a JavaScript/TypeScript client that provides a convenient SDK wrapper around your project's API.

      See [Installing](/docs/reference/javascript/installing) to get started.
    `,
  },
  {
    id: 'curl-flags',
    condition: (result) =>
      result.language === 'curl' && result.method === 'GET' && result.params.size > 0,
    question: 'What do `-G` and `-d` do?',
    answer: stripIndent`
      In \`curl\`, \`-d\` is short for \`--data-urlencode\` and is typically used to add payload to \`POST\` requests.

      The \`-G\` flag tells \`curl\` to apply the \`-d\` data as \`GET\` request query parameters instead, which is a bit more readable than adding them directly to the path.
    `,
  },
  {
    id: 'how-do-aliases-work',
    condition: ({ statement }) =>
      // Show this if there is at least one alias
      statement.targets.some((target) => target.alias),
    question: 'How do aliases work?',
    answer: stripIndent`
      PostgREST supports [renaming columns](https://postgrest.org/en/latest/references/api/tables_views.html#renaming-columns) by prefixing the column name with an alias and a colon:

      *Request*

      \`\`\`bash
      /books?select=myTitle:title
      \`\`\`

      *Response*
      \`\`\`json
      [
        {
          "myTitle": "The Cheese Tax"
        }
      ]
      \`\`\`

    `,
  },
  {
    id: 'why-alias-lower-case',
    condition: ({ statement }) =>
      // Show this if there is at least one alias and no aliases have capital letters
      statement.targets.some((target) => target.alias) &&
      !statement.targets.some(
        (target) => target.alias && target.alias !== target.alias.toLowerCase()
      ),
    question: 'Why is my alias lower case?',
    answer: stripIndent`
      Postgres converts all SQL identifiers to lowercase by default. To keep casing when converting from SQL, wrap your alias in double quotes:

      \`\`\`sql
      select
        title as "myTitle"
      from
        books
      \`\`\`
    `,
  },
  {
    id: 'how-does-and-work',
    condition: ({ statement }) =>
      // Show this if there is at least one `AND` operator
      !!statement.filter &&
      statement.filter.type === 'logical' &&
      statement.filter.operator === 'and',
    question: 'How does the `AND` operator work?',
    answer: stripIndent`
      PostgREST treats each \`AND\` expression as a separate query parameter.
      
      For example the following SQL:

      \`\`\`sql
      select
        *
      from
        books
      where
        description ilike '%cheese%' and
        pages > 100
      \`\`\`

      is equivalent to this API request:

      \`\`\`bash
      /books?description=ilike.*cheese*&pages=gt.100
      \`\`\`

      There are exceptions when you have nested \`AND\` expressions, but otherwise this provides an API most consistent with other REST APIs.
    `,
  },
  {
    id: 'how-do-joins-work',
    condition: ({ statement }) =>
      // Show this if there is at least one resource embedding
      statement.targets.some((target) => target.type === 'embedded-target'),
    question: 'How do joins work?',
    answer: stripIndent`
      PostgREST supports joins through [resource embeddings](https://postgrest.org/en/latest/references/api/resource_embedding.html). Resource embeddings are defined within the \`select\` field using the syntax:

      \`\`\`bash
      /books?select=authors(name)
      \`\`\`

      The above query will join \`books\` with \`authors\` and select the name of the author who wrote the book. The fields inside the parenthesis refer to those in the joined table.

      Some important notes about resource embeddings:
      - A [foreign key](https://postgrest.org/en/latest/references/api/resource_embedding.html#foreign-key-joins) _must_ exist between the tables, otherwise PostgREST won't know how to join them
      - Because of this, not all joins are supported - only those that join on the foreign key columns
      - Joins are \`LEFT\` by default. To perform an \`INNER\` join, add \`!inner\` to the embedded resource:
          \`\`\`bash
          /books?select=author!inner(name)
          \`\`\`
          PostgREST only supports \`LEFT\` and \`INNER\` joins.
      - Resource embeddings are nested by default:

          *Request*

          \`\`\`bash
          /books?select=title,author(name)
          \`\`\`

          *Response*

          \`\`\`json
          {
            "title": "The Cheese Tax",
            "author": {
              "name": "Bobby Bobson"
            }
          }
          \`\`\`

          To flatten the resource embedding into its parent, use the [spread syntax](https://postgrest.org/en/latest/references/api/resource_embedding.html#spread-embedded-resource):

          *Request*

          \`\`\`bash
          /books?select=...author(authorName:name)
          \`\`\`

          *Response*

          \`\`\`json
          {
            "authorName": "Bobby Bobson"
          }
          \`\`\`

          Note that we also aliased the author's name as \`authorName\` for better clarity (otherwise it would have been just \`name\`).

          Only many-to-one and one-to-one relationships support the spread syntax.

    `,
  },
  {
    id: 'why-percent-sign-conversion',
    condition: ({ type, statement }) =>
      // Show this if this is an HTTP render, there is a like/ilike filter, and at least one filter contains '%' character
      type === 'http' &&
      !!statement.filter &&
      someFilter(
        statement.filter,
        (filter) =>
          ['like', 'ilike'].includes(filter.operator) &&
          typeof filter.value === 'string' &&
          filter.value.includes('%')
      ),
    question: 'Why is `%` getting converted to `*`?',
    answer: stripIndent`
      PostgREST [supports](https://postgrest.org/en/latest/references/api/tables_views.html#operators) \`*\` as an alias for \`%\` in \`LIKE\` and \`ILIKE\` expressions to avoid URL encoding.

    `,
  },
  {
    id: 'why-range-supabase-js',
    condition: (result) =>
      // Show this if viewing the JS code and there is both a limit and offset
      result.language === 'js' &&
      result.statement.limit?.count !== undefined &&
      result.statement.limit.offset !== undefined,
    question: 'Why `range()` instead of `limit()` and `offset()`?',
    answer: stripIndent`
      [\`supabase-js\`](https://github.com/supabase/supabase-js) supports \`limit()\` but not \`offset()\`.

      \`range()\` allows us to accomplish the equivalent logic.
    `,
  },
]
