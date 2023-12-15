import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import OpenAI from 'openai'
import { collectStream, extractMarkdownSql, formatSql } from '../test/util'
import { chatRlsPolicy, debugSql, editSql, generateSql, titleSql } from './sql'

const openAiKey = process.env.OPENAI_KEY
console.log(openAiKey)
const openai = new OpenAI({ apiKey: openAiKey })

describe('generate', () => {
  test('single table with specified columns', async () => {
    const { sql, title } = await generateSql(
      openai,
      'create a table to track employees with name, email, and position'
    )

    expect(formatSql(sql)).toBe(codeBlock`
      create table employees (
        id bigint primary key generated always as identity,
        name text,
        email text,
        position text
      );
    `)
    expect(title).toBeDefined()
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

    expect(formatSql(sql)).toBe(codeBlock`
      create table employees (
        id bigint primary key generated always as identity,
        name text check (length(name) >= 4),
        email text
      );
    `)
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

    expect(formatSql(sql)).toBe(codeBlock`
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
    `)
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

    expect(title).toBe('Employee and Department Tables')
    expect(description).toBeDefined()
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

    expect(formatSql(sql)).toBe(codeBlock`
      create policy select_todo_policy on todos for
      select
        using (user_id = auth.uid ());
    `)
  })
})
