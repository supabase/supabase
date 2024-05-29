import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import OpenAI from 'openai'
import {
  assertAndUnwrapNode,
  assertDefined,
  getPolicies,
  getPolicyInfo,
  unwrapNode,
} from '../test/sql-util'
import { collectStream, extractMarkdownSql, formatSql } from '../test/util'
import { debugSql, titleSql } from './sql'
import { chatRlsPolicy } from './sql.edge'

const openAiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({ apiKey: openAiKey })

describe('debug', () => {
  test('fix order of operations', async () => {
    const { sql } = await debugSql(
      openai,
      'relation "departments" does not exist',
      codeBlock`
        create table employees (
          id bigint primary key generated always as identity,
          name text,
          email text,
          department_id bigint references departments (id)
        );

        create table departments (
          id bigint primary key generated always as identity,
          name text
        );
      `
    )

    expect(formatSql(sql)).toMatchSnapshot()
  })

  test('fix typos', async () => {
    const { sql, solution } = await debugSql(
      openai,
      'syntax error at or near "fromm"',
      codeBlock`
        select * fromm employees;
      `
    )

    expect(solution).toBeDefined()
    expect(formatSql(sql)).toMatchSnapshot()
  })
})

describe('title', () => {
  test('title matches content', async () => {
    const { title, description } = await titleSql(
      openai,
      codeBlock`
        create table employees (
          id bigint primary key generated always as identity,
          name text,
          email text,
          department_id bigint references departments (id)
        );

        create table departments (
          id bigint primary key generated always as identity,
          name text
        );
      `
    )

    await expect(title).toMatchCriteria('relates to employees and departments')
    await expect(description).toMatchCriteria('describes employees and departments')
  })
})

describe('rls chat', () => {
  const tableDefs = [
    codeBlock`
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
    `,
  ]

  test('defaults to authenticated role', async () => {
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

    expect(roles).toStrictEqual(['authenticated'])
  })

  test('uses anon + authenticated roles when table viewable by anyone', async () => {
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

    expect(roles.sort()).toStrictEqual(['anon', 'authenticated'].sort())
  })

  test('wraps every function in select', async () => {
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

    assertDefined(usingNode, 'Expected USING expression')
    const usingExpression = assertAndUnwrapNode(
      usingNode,
      'A_Expr',
      'Expected USING to contain an expression'
    )

    assertDefined(usingExpression.lexpr, 'Expected left side of USING expression to exist')
    assertDefined(usingExpression.rexpr, 'Expected right side of USING expression to exist')

    const leftFunctionCall = unwrapNode(usingExpression.lexpr, 'FuncCall')
    const rightFunctionCall = unwrapNode(usingExpression.lexpr, 'FuncCall')

    if (leftFunctionCall || rightFunctionCall) {
      throw new Error('Expected function call to be wrapped in a select sub-query')
    }

    const leftSubQuery = unwrapNode(usingExpression.lexpr, 'SubLink')
    const rightSubQuery = unwrapNode(usingExpression.rexpr, 'SubLink')

    if (!leftSubQuery && !rightSubQuery) {
      throw new Error('Expected a sub-query wrapping the function')
    }

    const hasFunctionWrappedSubQuery = [leftSubQuery, rightSubQuery].some((subQuery) => {
      if (!subQuery) {
        return false
      }

      assertDefined(subQuery.subselect, 'Expected SubLink to contain a subselect')
      const selectStatement = unwrapNode(subQuery.subselect, 'SelectStmt')

      if (!selectStatement) {
        return false
      }

      assertDefined(selectStatement.targetList, 'Expected SELECT statement to have a target list')

      const [target] = selectStatement.targetList.map((node) =>
        assertAndUnwrapNode(node, 'ResTarget', 'Expected every select target to be a ResTarget')
      )

      if (!target) {
        return false
      }

      assertDefined(target.val, 'Expected ResTarget to have a val')

      return unwrapNode(target.val, 'FuncCall') !== undefined
    })

    expect(hasFunctionWrappedSubQuery).toBe(true)
  })

  test('splits multiple operations into separate policies', async () => {
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

    const selectPolicy = policies.find((policy) => policy.cmd_name === 'select')
    const insertPolicy = policies.find((policy) => policy.cmd_name === 'insert')
    const updatePolicy = policies.find((policy) => policy.cmd_name === 'update')
    const deletePolicy = policies.find((policy) => policy.cmd_name === 'delete')

    expect(selectPolicy).not.toBeUndefined()
    expect(insertPolicy).not.toBeUndefined()
    expect(updatePolicy).not.toBeUndefined()
    expect(deletePolicy).not.toBeUndefined()
  })
})
