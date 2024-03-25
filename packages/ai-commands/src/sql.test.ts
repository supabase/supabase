import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import OpenAI from 'openai'
import { collectStream, extractMarkdownSql, formatSql, getPolicyInfo } from '../test/util'
import { debugSql, editSql, generateSql, titleSql } from './sql'
import { chatRlsPolicy } from './sql.edge'

const openAiKey = process.env.OPENAI_KEY
const openai = new OpenAI({ apiKey: openAiKey })

describe('generate', () => {
  test('single table with specified columns', async () => {
    const { sql, title } = await generateSql(
      openai,
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
  test('select policy using table definition', async () => {
    const responseStream = await chatRlsPolicy(
      openai,
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
