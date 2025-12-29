import { codeBlock } from 'common-tags'
import type OpenAI from 'openai'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { formatSql } from '../../test/util'
import { debugSql, titleSql } from './functions'

// Minimal chat completion response shape used by tests.
const buildToolCallResponse = (payload: unknown) => ({
  choices: [
    {
      message: {
        tool_calls: [
          {
            function: {
              arguments: JSON.stringify(payload),
            },
          },
        ],
      },
    },
  ],
})

const mockCompletionsCreate = vi.fn()

const openai = {
  chat: {
    completions: {
      create: mockCompletionsCreate,
    },
  },
} as unknown as OpenAI

const fixedOrderSql = codeBlock`
  create table departments (
    id bigint primary key generated always as identity,
    name text
  );

  create table employees (
    id bigint primary key generated always as identity,
    name text,
    email text,
    department_id bigint references departments (id)
  );
`

const fixedTypoSql = 'select * from employees;'

const generatedTitle = 'Employees and departments'
const generatedDescription = 'Tables to manage employees and departments'

beforeEach(() => {
  mockCompletionsCreate.mockReset()
})

describe('debug', () => {
  // Run sequentially so each test can provide its own mocked completion response.
  test('fix order of operations', async ({ expect }) => {
    mockCompletionsCreate.mockResolvedValueOnce(
      buildToolCallResponse({
        sql: fixedOrderSql,
        solution: 'Create the departments table before referencing it.',
      })
    )

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

  test('fix typos', async ({ expect }) => {
    mockCompletionsCreate.mockResolvedValueOnce(
      buildToolCallResponse({
        sql: fixedTypoSql,
        solution: 'Correct the typo in the FROM clause.',
      })
    )

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
    mockCompletionsCreate.mockResolvedValueOnce(
      buildToolCallResponse({
        title: generatedTitle,
        description: generatedDescription,
      })
    )

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
