import { stripIndent } from 'common-tags'
import { HttpRequest, Statement, SupabaseJsQuery } from 'sql-to-rest'

export type BaseResult = {
  statement: Statement
}

export type HttpResult = BaseResult &
  HttpRequest & {
    type: 'http'
    language: 'http' | 'curl'
  }

export type SupabaseJsResult = BaseResult &
  SupabaseJsQuery & {
    type: 'supabase-js'
    language: 'js'
  }

export type Result = HttpResult | SupabaseJsResult

export type Faq = {
  id: string
  condition: (result: Result) => boolean
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
    question: 'How do I use this code?',
    answer: stripIndent`
      This snippet uses [\`supabase-js\`](https://github.com/supabase/supabase-js), a JavaScript/TypeScript client that provides a convenient SDK wrapper around your project's API.

      See [Installing](/docs/reference/javascript/installing) to get started.
    `,
  },
  {
    id: 'curl-flags',
    condition: (result) => result.language === 'curl' && result.method === 'GET',
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
      PostgREST supports aliasing columns by prefixing the column name with an alias and a colon:

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
