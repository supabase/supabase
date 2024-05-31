import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import OpenAI from 'openai'
import { formatSql } from '../../test/util'
import { debugSql, titleSql } from './functions'

const openAiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({ apiKey: openAiKey })

describe('debug', () => {
  test.concurrent('fix order of operations', async () => {
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

  test.concurrent('fix typos', async () => {
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
