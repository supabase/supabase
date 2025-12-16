import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Feature } from 'common'
import { showRemark } from './Show'
import { fromDocsMarkdown } from './utils.server'

// Mock the isFeatureEnabled function from common package
vi.mock('common/enabled-features', () => ({
  isFeatureEnabled: vi.fn(),
}))

const { isFeatureEnabled } = await import('common/enabled-features')

describe('$Show', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should keep children and remove $Show wrapper when feature is enabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true)

    const markdown = `
# Test content

<$Show if="test-feature">
This content should be visible when feature is enabled.

## A nested heading

Some more content.
</$Show>

Content after the show block.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = showRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Test content

This content should be visible when feature is enabled.

## A nested heading

Some more content.

Content after the show block.
`.trimStart()

    expect(output).toEqual(expected)
    expect(isFeatureEnabled).toHaveBeenCalledWith('test-feature')
  })

  it('should keep children when negated feature is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false)

    const markdown = `
# Test content

<$Show if="!negated-feature">
This content should be visible when the feature is disabled.

## Additional content

More text that should remain.
</$Show>

Content after the show block.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = showRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Test content

This content should be visible when the feature is disabled.

## Additional content

More text that should remain.

Content after the show block.
`.trimStart()

    expect(output).toEqual(expected)
    expect(isFeatureEnabled).toHaveBeenCalledWith('negated-feature')
  })

  it('should remove $Show block when negated feature is enabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true)

    const markdown = `
# Test content

<$Show if="!enabled-negated-feature">
This content should NOT be visible because the feature is enabled.
</$Show>

Content after the show block should remain.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = showRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Test content

Content after the show block should remain.
`.trimStart()

    expect(output).toEqual(expected)
    expect(isFeatureEnabled).toHaveBeenCalledWith('enabled-negated-feature')
  })

  it('should handle multiple $Show blocks with different feature flags', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((feature) => {
      if (feature === ('enabled-feature' as Feature)) return true
      return false
    })

    const markdown = `
# Test content

<$Show if="enabled-feature">
This should be visible.
</$Show>

<$Show if="disabled-feature">
This should be hidden.
</$Show>

<$Show if="another-disabled-feature">
This should also be hidden.
</$Show>

Final content.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = showRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Test content

This should be visible.

Final content.
`.trimStart()

    expect(output).toEqual(expected)
    expect(isFeatureEnabled).toHaveBeenCalledWith('enabled-feature')
    expect(isFeatureEnabled).toHaveBeenCalledWith('disabled-feature')
    expect(isFeatureEnabled).toHaveBeenCalledWith('another-disabled-feature')
  })

  it('should handle nested $Show blocks correctly', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((feature) => {
      if (feature === ('outer-feature' as Feature)) return true
      return false
    })

    const markdown = `
# Test content

<$Show if="outer-feature">
Outer content visible.

<$Show if="inner-feature">
Inner content should be hidden.
</$Show>

More outer content.
</$Show>
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = showRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Test content

Outer content visible.

More outer content.
`.trimStart()

    expect(output).toEqual(expected)
    expect(isFeatureEnabled).toHaveBeenCalledWith('outer-feature')
    expect(isFeatureEnabled).toHaveBeenCalledWith('inner-feature')
  })

  it('should throw error when "if" attribute is missing', () => {
    const markdown = `
<$Show>
Content without if attribute.
</$Show>
`.trim()

    const mdast = fromDocsMarkdown(markdown)

    expect(() => {
      showRemark()(mdast)
    }).toThrow('$Show directive requires a string value for the "if" attribute')
  })

  it('should throw error when "if" attribute is not a string', () => {
    const markdown = `
<$Show if={true}>
Content with non-string if attribute.
</$Show>
`.trim()

    const mdast = fromDocsMarkdown(markdown)

    expect(() => {
      showRemark()(mdast)
    }).toThrow('$Show directive requires a string value for the "if" attribute')
  })
})
