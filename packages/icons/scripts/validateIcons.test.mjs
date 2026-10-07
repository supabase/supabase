import assert from 'node:assert/strict'
import test from 'node:test'

import { validateIconSource } from './validateIcons.mjs'

test('accepts a canonical stroke icon', () => {
  const source = `
    <svg fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M2 2L22 22" />
    </svg>
  `

  assert.deepEqual(validateIconSource(source), [])
})

test('accepts a fill-only icon', () => {
  const source = `
    <svg fill="none" stroke="none">
      <path d="M2 2H22V22H2Z" fill="currentColor" />
    </svg>
  `

  assert.deepEqual(validateIconSource(source), [])
})

test('rejects a non-canonical stroke width', () => {
  const source = `
    <svg fill="none" stroke="currentColor" stroke-width="1">
      <path d="M2 2L22 22" />
    </svg>
  `

  assert.deepEqual(validateIconSource(source, 'thin.svg'), [
    'thin.svg: stroke icons must use stroke-width="1.5" on the root <svg>',
  ])
})

test('rejects child-level stroke styling', () => {
  const source = `
    <svg fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M2 2L22 22" stroke="currentColor" stroke-width="1.5" />
    </svg>
  `

  assert.deepEqual(validateIconSource(source, 'fixed.svg'), [
    'fixed.svg: move shared stroke, stroke-width attributes to the root <svg>',
  ])
})

test('rejects inline styles on the root icon', () => {
  const source = `
    <svg fill="none" stroke="currentColor" stroke-width="1.5" style="stroke: none">
      <path d="M2 2L22 22" />
    </svg>
  `

  assert.deepEqual(validateIconSource(source, 'root-style.svg'), [
    'root-style.svg: inline style attributes are not allowed on the root <svg>',
  ])
})

test('rejects inline styles on child elements', () => {
  const source = `
    <svg fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M2 2L22 22" style="stroke-width: 2" />
    </svg>
  `

  assert.deepEqual(validateIconSource(source, 'child-style.svg'), [
    'child-style.svg: inline style attributes are not allowed on child elements',
  ])
})

test('rejects the legacy zero-width fill-only convention', () => {
  const source = `
    <svg fill="currentColor" stroke="currentColor" stroke-width="0">
      <path d="M2 2H22V22H2Z" />
    </svg>
  `

  assert.deepEqual(validateIconSource(source, 'logo.svg'), [
    'logo.svg: stroke icons must use fill="none" on the root <svg>',
    'logo.svg: stroke icons must use stroke-width="1.5" on the root <svg>',
  ])
})
