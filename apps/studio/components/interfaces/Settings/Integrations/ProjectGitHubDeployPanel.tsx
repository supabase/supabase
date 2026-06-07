import { useParams } from 'common'
import { type ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Input } from 'ui'

import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-foreground-light">{label}</label>
    {children}
  </div>
)

// [console fork] Self-host GitHub deploy panel. The hosted "Connect GitHub" button
// is a GitHub-App OAuth flow that can't complete on a self-host install, so this
// gives a direct path: connect a repo + branch (optionally a PAT for private repos)
// and apply its `supabase/migrations/*.sql` to this project's database on demand.
// The same connection is what the push webhook (POST /v1/github/webhook) deploys.
export const ProjectGitHubDeployPanel = () => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [token, setToken] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)

  useEffect(() => {
    if (!ref) return
    fetch(`${API}/platform/projects/${ref}/github/connection`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.connected) {
          setConnected(true)
          setRepo(d.repository ?? '')
          setBranch(d.branch ?? 'main')
        }
      })
      .catch(() => {})
  }, [ref])

  const saveToken = async () => {
    if (!token || !org?.slug) return
    const res = await fetch(`${API}/platform/organizations/${org.slug}/github-token`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token }),
    })
    if (!res.ok) throw new Error((await res.json())?.error?.message ?? 'Failed to save token')
  }

  const onConnect = async () => {
    if (!repo.includes('/')) return toast.error('Repository must be in "owner/repo" form')
    setLoading(true)
    try {
      if (token) await saveToken()
      const res = await fetch(`${API}/platform/projects/${ref}/github/connection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository: repo.trim(), branch: branch.trim() || 'main' }),
      })
      if (!res.ok) throw new Error((await res.json())?.error?.message ?? 'Failed to connect')
      setConnected(true)
      setToken('')
      toast.success(`Connected ${repo} (${branch})`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onDisconnect = async () => {
    setLoading(true)
    try {
      await fetch(`${API}/platform/projects/${ref}/github/connection`, { method: 'DELETE' })
      setConnected(false)
      setLastResult(null)
      toast.success('Disconnected repository')
    } finally {
      setLoading(false)
    }
  }

  const onDeploy = async () => {
    setDeploying(true)
    setLastResult(null)
    try {
      const res = await fetch(`${API}/platform/projects/${ref}/github/deploy`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error?.message ?? 'Deploy failed')
      const applied = d.applied ?? []
      const skipped = d.skipped ?? []
      setLastResult(
        applied.length
          ? `Applied ${applied.length} migration(s): ${applied.join(', ')}`
          : `Up to date — ${skipped.length} migration(s) already applied`
      )
      toast.success(applied.length ? `Applied ${applied.length} migration(s)` : 'Already up to date')
    } catch (e: any) {
      toast.error(e.message)
      setLastResult(`Error: ${e.message}`)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <p className="text-foreground text-base m-0">GitHub deploy</p>
          <p className="text-foreground-light text-sm">
            Connect a repository and apply its <code>supabase/migrations</code> to this project.
            Migrations are applied idempotently and re-run automatically on push when a webhook is
            configured.
          </p>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Field label="Repository">
            <Input
              placeholder="owner/repository"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              disabled={loading}
            />
          </Field>
          <Field label="Branch">
            <Input
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={loading}
            />
          </Field>
          {!connected && (
            <Field label="Personal access token (optional — required for private repos)">
              <Input
                placeholder="github_pat_…"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
              />
            </Field>
          )}
          <div className="flex items-center gap-2">
            <Button type="primary" loading={loading} onClick={onConnect}>
              {connected ? 'Update connection' : 'Connect repository'}
            </Button>
            {connected && (
              <>
                <Button type="default" loading={deploying} onClick={onDeploy}>
                  Deploy now
                </Button>
                <Button type="text" disabled={loading} onClick={onDisconnect}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
          {lastResult && <p className="text-sm text-foreground-light">{lastResult}</p>}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
