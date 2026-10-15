import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PipelineCreationHeader } from './PipelineCreationHeader'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/components/layouts/Navigation/LayoutHeader/HomeIcon', () => ({
  HomeIcon: () => (
    <a tabIndex={0} href="/organizations">
      Supabase home
    </a>
  ),
}))
vi.mock('@/components/layouts/AppLayout/OrganizationDropdown', () => ({
  OrganizationDropdown: () => <span>Organization</span>,
}))
vi.mock('@/components/layouts/Navigation/NavigationBar/OrgSelector', async () => {
  const { SidebarMenuButton } = await import('ui')
  return { OrgSelector: () => <SidebarMenuButton>Organization</SidebarMenuButton> }
})
vi.mock('@/components/layouts/AppLayout/ProjectDropdown', async () => {
  const { createPortal } = await import('react-dom')
  return {
    ProjectDropdown: () =>
      createPortal(
        <a tabIndex={0} href="/project/other/database/pipelines">
          Project
        </a>,
        document.body
      ),
  }
})

describe('PipelineCreationHeader', () => {
  it('shows the project context and routes close through its handler', () => {
    const onClose = vi.fn()
    customRender(<PipelineCreationHeader onClose={onClose} onNavigate={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'Pipeline creation' })).toBeInTheDocument()
    expect(screen.getByText('New pipeline')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
  it.each(['Supabase home', 'Project'])('guards navigation from %s', (name) => {
    const onNavigate = vi.fn()
    customRender(<PipelineCreationHeader onClose={vi.fn()} onNavigate={onNavigate} />)
    const link = screen.getByRole('link', { name })
    expect(fireEvent.click(link)).toBe(false)
    expect(onNavigate).toHaveBeenCalledWith(
      link.getAttribute('href') === '/organizations'
        ? 'http://localhost:3000/organizations'
        : 'http://localhost:3000/project/other/database/pipelines'
    )
  })
})
