import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cn } from 'ui'

import { isAllowedSupabaseEmail, normalizeEmail } from '@/lib/auth-email'
import { createClient } from '@/lib/supabase/server'

type LatestRepoMetric = {
  owner: string
  name: string
  html_url: string
  computed_quality_score: number | null
  stars: number | null
  last_commit_at: string | null
  has_docs_folder: boolean | null
  has_examples: boolean | null
  has_ci: boolean | null
  tier: string | null
  is_archived: boolean | null
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

function Flag({ value, label }: { value: boolean | null; label: string }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-xs',
        value ? 'bg-brand/20 text-foreground' : 'bg-surface-200 text-foreground-muted'
      )}
    >
      {label}
    </span>
  )
}

const QualityPage = async () => {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const email = normalizeEmail(String(claimsData?.claims?.email ?? ''))

  if (!email) {
    redirect('/login?next=/quality')
  }

  if (!isAllowedSupabaseEmail(email)) {
    await supabase.auth.signOut()
    redirect(
      `/login?next=/quality&message=${encodeURIComponent(
        'Only @supabase.com and @supabase.io emails can sign in.'
      )}`
    )
  }

  const { data: allowlist, error: allowlistError } = await supabase
    .from('community_dashboard_allowlist')
    .select('email, role')
    .ilike('email', email)
    .maybeSingle()

  if (allowlistError || !allowlist) {
    await supabase.auth.signOut()
    redirect(
      `/login?next=/quality&message=${encodeURIComponent(
        'Your email is not on the quality dashboard allowlist.'
      )}`
    )
  }

  const { data: metrics, error: metricsError } = await supabase
    .from('latest_repo_metrics')
    .select(
      'owner, name, html_url, computed_quality_score, stars, last_commit_at, has_docs_folder, has_examples, has_ci, tier, is_archived'
    )
    .order('computed_quality_score', { ascending: false, nullsFirst: false })

  const rows = (metrics ?? []) as LatestRepoMetric[]

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-8 pb-16">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium text-foreground">Quality dashboard</h1>
          <p className="text-sm text-foreground-light">
            Signed in as {email} ({allowlist.role}). Scores come from weekly sync runs.
          </p>
        </div>
        <Link className="text-sm text-foreground-light hover:text-foreground" href="/">
          Back to docs
        </Link>
      </div>

      {metricsError ? (
        <p className="rounded-md border border-destructive-500/40 bg-destructive-200/10 px-3 py-2 text-sm text-foreground">
          Failed to load metrics: {metricsError.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-foreground-light">
          No metrics yet. Run{' '}
          <code className="rounded bg-surface-200 px-1.5 py-0.5 text-xs">
            pnpm --filter community-docs sync-repos
          </code>{' '}
          after applying migrations.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-surface-100 text-foreground-light">
              <tr>
                <th className="px-3 py-2 font-medium">Repo</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">Stars</th>
                <th className="px-3 py-2 font-medium">Last commit</th>
                <th className="px-3 py-2 font-medium">Signals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.owner}/${row.name}`}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-3 py-2">
                    <a
                      className="text-foreground hover:underline"
                      href={row.html_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {row.name}
                    </a>
                    {row.is_archived ? (
                      <span className="ml-2 text-xs text-foreground-muted">archived</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-foreground">
                    {row.computed_quality_score ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-foreground">{row.tier ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-foreground">{row.stars ?? '—'}</td>
                  <td className="px-3 py-2 text-foreground-light">
                    {formatDate(row.last_commit_at)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Flag label="docs" value={row.has_docs_folder} />
                      <Flag label="examples" value={row.has_examples} />
                      <Flag label="ci" value={row.has_ci} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default QualityPage
