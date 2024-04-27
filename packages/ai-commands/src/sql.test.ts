import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import { collectStream, extractMarkdownSql, formatSql, getPolicyInfo } from '../test/util'
import { createOpenAiClient } from './openai'
import { debugSql, editSql, generateSql, titleSql } from './sql'
import { chatRlsPolicy, generateV2 } from './sql.edge'

const { openai, model, error } = createOpenAiClient()

if (error) {
  throw error
}

console.info(`Running AI tests against model '${model}'`)

describe('generate', () => {
  test('single table with specified columns', async () => {
    const { sql, title } = await generateSql(
      openai,
      model,
      'create a table to track employees with name, email, and position'
    )

    expect(formatSql(sql)).toMatchSnapshot()
    await expect(title).toMatchCriteria('relates to employees')
  })
})

describe('edit', () => {
  test('add length constraint', async () => {
    const { sql } = await editSql(
      openai,
      model,
      'force name to be at least 4 characters',
      codeBlock`
        create table employees (
          id bigint primary key generated always as identity,
          name text,
          email text
        );
      `
    )

    expect(formatSql(sql)).toMatchSnapshot()
  })
})

describe('debug', () => {
  test('fix order of operations', async () => {
    const { sql } = await debugSql(
      openai,
      model,
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
      model,
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
      model,
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
  test('select policy using table definition', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
      model,
      [
        {
          role: 'user',
          content: 'Users can only select their own todos',
        },
      ],
      [
        codeBlock`
          create table todos (
            id bigint primary key generated always as identity,
            task text,
            email text,
            user_id uuid references auth.users (id)
          );
        `,
      ]
    )
    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)

    const { name, ...otherInfo } = await getPolicyInfo(sql)

    expect(otherInfo).toMatchSnapshot()
    await expect(name).toMatchCriteria(
      'policy says that users can select their own todos (not insert, update, delete, etc)'
    )
  })
})

describe('sql chat', () => {
  test('single table with specified columns', async () => {
    const responseStream = await generateV2(openai, model, [
      {
        role: 'user',
        content: 'create a table to track employees with name, email, and position',
      },
    ])
    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)

    expect(sql).toMatchSnapshot()
  })

  test('table referencing users creates fk to auth.users', async () => {
    const responseStream = await generateV2(openai, model, [
      {
        role: 'user',
        content: 'create a todos table and track author',
      },
    ])

    const responseText = await collectStream(responseStream)
    const [sql] = extractMarkdownSql(responseText)

    expect(sql).toMatchSnapshot()
  })
})
