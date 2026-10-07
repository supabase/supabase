import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EdgeFunctionsDiffPanel } from 'components/interfaces/BranchManagement/EdgeFunctionsDiffPanel'
import type { EdgeFunctionsDiffResult } from 'hooks/branches/useEdgeFunctionsDiff'
import { customRender as render } from 'tests/lib/custom-render'

// Monaco editor does not work in jsdom
vi.mock('@/components/ui/DiffEditor', () => ({
  DiffEditor: ({ original, modified }: { original: string; modified: string }) => (
    <div data-testid="diff-editor" data-original={original} data-modified={modified} />
  ),
}))

const baseDiffResults: EdgeFunctionsDiffResult = {
  addedSlugs: [],
  removedSlugs: [],
  modifiedSlugs: [],
  addedBodiesMap: {},
  removedBodiesMap: {},
  currentBodiesMap: {},
  mainBodiesMap: {},
  functionFileInfo: {},
  isLoading: false,
  hasChanges: false,
  refetchCurrentBranchFunctions: vi.fn(),
  refetchMainBranchFunctions: vi.fn(),
  clearDiffsOptimistically: vi.fn(),
}

describe('EdgeFunctionsDiffPanel', () => {
  it('shows no-changes state when there are no added, modified, or removed functions', () => {
    render(<EdgeFunctionsDiffPanel diffResults={baseDiffResults} currentBranchRef="branch-ref" />)

    expect(screen.getByText('No changes detected between branches')).toBeInTheDocument()
  })

  it('does NOT show no-changes state when there are only removed functions', () => {
    const diffResults: EdgeFunctionsDiffResult = {
      ...baseDiffResults,
      removedSlugs: ['my-function'],
      removedBodiesMap: {
        'my-function': {
          files: [{ name: 'index.ts', content: 'Deno.serve(() => new Response("hello"))' }],
        },
      },
      functionFileInfo: {
        'my-function': [{ key: 'index.ts', status: 'removed' }],
      },
      hasChanges: true,
    }

    render(<EdgeFunctionsDiffPanel diffResults={diffResults} currentBranchRef="branch-ref" />)

    expect(screen.queryByText('No changes detected between branches')).not.toBeInTheDocument()
  })

  it('renders removed function slugs as links', () => {
    const diffResults: EdgeFunctionsDiffResult = {
      ...baseDiffResults,
      removedSlugs: ['deleted-fn'],
      removedBodiesMap: {
        'deleted-fn': {
          files: [{ name: 'index.ts', content: 'export default () => {}' }],
        },
      },
      functionFileInfo: {
        'deleted-fn': [{ key: 'index.ts', status: 'removed' }],
      },
      hasChanges: true,
    }

    render(<EdgeFunctionsDiffPanel diffResults={diffResults} currentBranchRef="branch-ref" />)

    expect(screen.getByText('deleted-fn')).toBeInTheDocument()
  })

  it('renders all removed function slugs when multiple functions are removed', () => {
    const diffResults: EdgeFunctionsDiffResult = {
      ...baseDiffResults,
      removedSlugs: ['fn-alpha', 'fn-beta'],
      removedBodiesMap: {
        'fn-alpha': {
          files: [{ name: 'index.ts', content: 'export default () => {}' }],
        },
        'fn-beta': {
          files: [{ name: 'index.ts', content: 'export default () => {}' }],
        },
      },
      functionFileInfo: {
        'fn-alpha': [{ key: 'index.ts', status: 'removed' }],
        'fn-beta': [{ key: 'index.ts', status: 'removed' }],
      },
      hasChanges: true,
    }

    render(<EdgeFunctionsDiffPanel diffResults={diffResults} currentBranchRef="branch-ref" />)

    expect(screen.getByText('fn-alpha')).toBeInTheDocument()
    expect(screen.getByText('fn-beta')).toBeInTheDocument()
  })

  it('shows a diff editor for each removed function file', () => {
    const diffResults: EdgeFunctionsDiffResult = {
      ...baseDiffResults,
      removedSlugs: ['removed-fn'],
      removedBodiesMap: {
        'removed-fn': {
          files: [{ name: 'index.ts', content: 'Deno.serve(() => new Response("bye"))' }],
        },
      },
      functionFileInfo: {
        'removed-fn': [{ key: 'index.ts', status: 'removed' }],
      },
      hasChanges: true,
    }

    render(<EdgeFunctionsDiffPanel diffResults={diffResults} currentBranchRef="branch-ref" />)

    const editors = screen.getAllByTestId('diff-editor')
    expect(editors.length).toBeGreaterThan(0)
    // For a removed function: original is main content, modified is empty
    expect(editors[0]).toHaveAttribute('data-modified', '')
  })

  it('shows added functions without no-changes state', () => {
    const diffResults: EdgeFunctionsDiffResult = {
      ...baseDiffResults,
      addedSlugs: ['new-fn'],
      addedBodiesMap: {
        'new-fn': {
          files: [{ name: 'index.ts', content: 'Deno.serve(() => new Response("hi"))' }],
        },
      },
      functionFileInfo: {
        'new-fn': [{ key: 'index.ts', status: 'added' }],
      },
      hasChanges: true,
    }

    render(<EdgeFunctionsDiffPanel diffResults={diffResults} currentBranchRef="branch-ref" />)

    expect(screen.queryByText('No changes detected between branches')).not.toBeInTheDocument()
    expect(screen.getByText('new-fn')).toBeInTheDocument()
  })

  it('renders a loading skeleton while data is loading', () => {
    const diffResults: EdgeFunctionsDiffResult = {
      ...baseDiffResults,
      isLoading: true,
    }

    const { container } = render(
      <EdgeFunctionsDiffPanel diffResults={diffResults} currentBranchRef="branch-ref" />
    )

    expect(screen.queryByText('No changes detected between branches')).not.toBeInTheDocument()
    // Skeleton is rendered as a div with an animate-pulse class
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
