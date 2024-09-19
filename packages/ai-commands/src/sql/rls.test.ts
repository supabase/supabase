import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import OpenAI from 'openai'
import {
  assertAndRenderColumn,
  assertAndUnwrapNode,
  assertDefined,
  assertEachSideOfExpression,
  assertEitherSideOfExpression,
  assertNodeType,
  getPolicies,
  getPolicyInfo,
  parseConstant,
  renderFields,
  renderJsonExpression,
  renderTargets,
  unwrapNode,
} from '../../test/sql-util'
import { collectStream, extractMarkdownSql, withMetadata } from '../../test/util'
import { chatRlsPolicy } from './rls'

const openAiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({ apiKey: openAiKey })

const tableDefs = [
  codeBlock`
    create table libraries (
      id bigint primary key generated always as identity,
      name text not null
    );

    create table authors (
      id bigint primary key generated always as identity,
      name text not null
    );

    create table books (
      id bigint primary key generated always as identity,
      title text not null,
      description text not null,
      genre text not null,
      author_id bigint references authors (id) not null,
      library_id bigint references libraries (id) not null,
      published_at timestamp with time zone not null
    );

    create table reviews (
      id bigint primary key generated always as identity,
      title text not null,
      content text not null,
      user_id uuid references auth.users (id) not null,
      book_id bigint references books (id) not null,
      published_at timestamp with time zone
    )

    create tables favorite_books (
      id bigint primary key generated always as identity,
      user_id uuid references auth.users (id) not null,
      book_id bigint references books (id) not null
    );

    create table library_memberships (
      id bigint primary key generated always as identity,
      user_id uuid references auth.users (id) not null,
      library_id bigint references libraries (id) not null
    );
  `,
]

describe('rls chat', () => {
  test.concurrent('defaults to authenticated role', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Users can only see their own favorite books',
        },
      ],
      tableDefs
    )
    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)
    const { roles } = await getPolicyInfo(policy)

    withMetadata({ sql }, () => {
      expect(roles).toStrictEqual(['authenticated'])
    })
  })

  test.concurrent('uses anon + authenticated roles when table viewable by anyone', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Published reviews can be seen by anyone',
        },
      ],
      tableDefs
    )
    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)
    const { roles } = await getPolicyInfo(policy)

    withMetadata({ sql }, () => {
      expect(roles.sort()).toStrictEqual(['anon', 'authenticated'].sort())
    })
  })

  test.concurrent('wraps every function in select', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Users can only see their own favorite books',
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)
    const { usingNode } = await getPolicyInfo(policy)

    withMetadata({ sql }, () => {
      assertDefined(usingNode, 'Expected USING expression')
      const usingExpression = assertAndUnwrapNode(
        usingNode,
        'A_Expr',
        'Expected USING to contain an expression'
      )

      assertEitherSideOfExpression(usingExpression, (node) => {
        const functionCall = unwrapNode(node, 'FuncCall')

        if (functionCall) {
          throw new Error('Expected function call to be wrapped in a select sub-query')
        }

        const subQuery = unwrapNode(node, 'SubLink')

        if (!subQuery) {
          throw new Error('Expected a sub-query wrapping the function')
        }

        assertDefined(subQuery.subselect, 'Expected SubLink to contain a subselect')
        const selectStatement = assertAndUnwrapNode(
          subQuery.subselect,
          'SelectStmt',
          'Expected subselect to contain a SELECT statement'
        )

        assertDefined(selectStatement.targetList, 'Expected SELECT statement to have a target list')

        const [target] = selectStatement.targetList.map((node) =>
          assertAndUnwrapNode(node, 'ResTarget', 'Expected every select target to be a ResTarget')
        )

        assertDefined(target, 'Expected select sub-query to have a function target')
        assertDefined(target.val, 'Expected ResTarget to have a val')
        assertNodeType(target.val, 'FuncCall', 'Expected sub-query to contain a function call')
      })
    })
  })

  test.concurrent('select policy has USING but not WITH CHECK', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'All published reviews can be seen publicly',
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)

    withMetadata({ sql }, () => {
      expect(policy.cmd_name).toBe('select')
      expect(policy.qual).not.toBeUndefined()
      expect(policy.with_check).toBeUndefined()
    })
  })

  test.concurrent('insert policy has WITH CHECK but not USING', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Users can only create their own reviews',
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)

    withMetadata({ sql }, () => {
      expect(policy.cmd_name).toBe('insert')
      expect(policy.qual).toBeUndefined()
      expect(policy.with_check).not.toBeUndefined()
    })
  })

  test.concurrent('update policy has USING and WITH CHECK', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: "You can't edit other people's reviews",
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)

    withMetadata({ sql }, () => {
      expect(policy.cmd_name).toBe('update')
      expect(policy.qual).not.toBeUndefined()
      expect(policy.with_check).not.toBeUndefined()
    })
  })

  test.concurrent('delete policy has USING but not WITH CHECK', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: "You can't delete someone else's review",
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)

    withMetadata({ sql }, () => {
      expect(policy.cmd_name).toBe('delete')
      expect(policy.qual).not.toBeUndefined()
      expect(policy.with_check).toBeUndefined()
    })
  })

  test.concurrent('splits multiple operations into separate policies', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Users can only access their own reviews',
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const policies = await getPolicies(sql)

    withMetadata({ sql }, () => {
      const allPolicy = policies.find((policy) => policy.cmd_name === 'all')
      const selectPolicy = policies.find((policy) => policy.cmd_name === 'select')
      const insertPolicy = policies.find((policy) => policy.cmd_name === 'insert')
      const updatePolicy = policies.find((policy) => policy.cmd_name === 'update')
      const deletePolicy = policies.find((policy) => policy.cmd_name === 'delete')

      expect(allPolicy).toBeUndefined()
      expect(selectPolicy).not.toBeUndefined()
      expect(insertPolicy).not.toBeUndefined()
      expect(updatePolicy).not.toBeUndefined()
      expect(deletePolicy).not.toBeUndefined()
    })
  })

  test.concurrent('discourages restrictive policies', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Can I make a policy restrict access instead of give access?',
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)

    await expect(responseText).toMatchCriteria(
      'Discourages restrictive policies and provides reasons why'
    )
  })

  test.concurrent('user id is on joined table and joins are minimized', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Users can only see books from libraries they are a member of',
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)

    withMetadata({ sql }, () => {
      // Check that USING is either a <column> IN <sub-query> or EXISTS <sub-query> expression
      assertDefined(policy.qual, 'Expected a USING statement')
      const sublink = assertAndUnwrapNode(policy.qual, 'SubLink', 'Expected USING to be a sublink')
      expect(['ANY_SUBLINK', 'EXISTS_SUBLINK']).toContain(sublink.subLinkType)

      if (sublink.subLinkType === 'ANY_SUBLINK') {
        // Validate column for IN clause
        assertDefined(sublink.testexpr, 'Expected sublink to have a test expression')
        const columnName = assertAndRenderColumn(
          sublink.testexpr,
          'Expected sublink test expression to be a column'
        )
        expect(columnName).toBe('library_id')
      }

      // Validate sub-query
      assertDefined(sublink.subselect, 'Expected sublink to have a subselect')
      const selectStatement = assertAndUnwrapNode(
        sublink.subselect,
        'SelectStmt',
        'Expected sublink subselect to be a SELECT statement'
      )

      assertDefined(selectStatement.targetList, 'Expected SELECT statement to have a target list')

      if (sublink.subLinkType === 'ANY_SUBLINK') {
        const columns = renderTargets(selectStatement.targetList, (node) =>
          assertAndRenderColumn(node, 'Expected target list to contain columns')
        )
        expect(columns).toContain('library_id')
      }

      assertDefined(selectStatement.fromClause, 'Expected SELECT statement to have a FROM clause')
      const [fromNode] = selectStatement.fromClause

      const fromRangeVar = assertAndUnwrapNode(
        fromNode,
        'RangeVar',
        'Expected FROM clause to contain a RangeVar'
      )
      expect(fromRangeVar.relname).toBe('library_memberships')

      assertDefined(selectStatement.whereClause, 'Expected SELECT statement to have a WHERE clause')
      const whereClause = assertAndUnwrapNode(
        selectStatement.whereClause,
        'A_Expr',
        'Expected WHERE clause to be an expression'
      )

      assertEachSideOfExpression(
        whereClause,
        (node) => {
          const columnName = assertAndRenderColumn(
            node,
            'Expected one side of WHERE clause to have a column'
          )
          expect(columnName).toBe('user_id')
        },
        (node) => {
          const sublink = assertAndUnwrapNode(
            node,
            'SubLink',
            'Expected one side of WHERE clause to contain a sub-query selecting auth.uid()'
          )

          assertDefined(sublink.subselect, 'Expected sublink to contain a subselect')
          const selectStatement = assertAndUnwrapNode(
            sublink.subselect,
            'SelectStmt',
            'Expected subselect to contain a SELECT statement'
          )

          assertDefined(
            selectStatement.targetList,
            'Expected SELECT statement to contain a target list'
          )
          const [functionCall] = renderTargets(selectStatement.targetList, (node) => {
            const funcCall = assertAndUnwrapNode(
              node,
              'FuncCall',
              'Expected SELECT statement to contain a function call'
            )
            assertDefined(funcCall.funcname, 'Expected function call to have a name')
            return renderFields(funcCall.funcname)
          })
          expect(functionCall).toBe('auth.uid')
        }
      )
    })
  })

  test.concurrent('mfa', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      [
        {
          role: 'user',
          content: 'Users need a second form of auth to join a library',
        },
      ],
      tableDefs
    )

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)
    const [policy] = await getPolicies(sql)

    withMetadata({ sql }, () => {
      expect(policy.cmd_name).toBe('insert')

      assertDefined(policy.with_check, 'Expected INSERT policy to have a WITH CHECK')
      const expression = assertAndUnwrapNode(
        policy.with_check,
        'A_Expr',
        'Expected WITH CHECK to be an expression'
      )

      assertEachSideOfExpression(
        expression,
        (node) => {
          const constValue = assertAndUnwrapNode(
            node,
            'A_Const',
            'Expected one side of expression to be a constant'
          )
          const stringValue = parseConstant(constValue)
          expect(stringValue).toBe('aal2')
        },
        (node) => {
          const sublink = assertAndUnwrapNode(
            node,
            'SubLink',
            'Expected one side of expression to be a sub-query'
          )

          assertDefined(sublink.subselect, 'Expected sublink to have a subselect')
          const selectStatement = assertAndUnwrapNode(
            sublink.subselect,
            'SelectStmt',
            'Expected sub-query to be a SELECT statement'
          )

          assertDefined(
            selectStatement.targetList,
            'Expected SELECT statement to have a target list'
          )
          const [jsonTarget] = renderTargets(selectStatement.targetList, (node) => {
            const expression = assertAndUnwrapNode(
              node,
              'A_Expr',
              'Expected SELECT target list to contain a JSON expression'
            )
            const jsonExpression = renderJsonExpression(expression)
            return jsonExpression
          })

          expect(jsonTarget).toBe("auth.jwt()->>'aal'")
        }
      )
    })
  })
})
