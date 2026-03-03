import { InlineLink } from 'components/ui/InlineLink'

const PG_DELTA_REPO_URL = 'https://github.com/supabase/pg-toolbelt'

export const PgDeltaDiffPreview = () => {
  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">
        Use the <InlineLink href={PG_DELTA_REPO_URL}>pg-delta</InlineLink> project to generate
        schema diffs instead of migra when creating migrations from branch comparisons. pg-delta is
        in alpha and is designed to better handle RLS (Row Level Security) and other schema
        constructs.
      </p>
      <div className="my-6">
        <p className="text-sm text-foreground mb-2 font-medium">Please note:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>pg-delta is in alpha; behavior may change.</li>
          <li>
            Generated migrations may contain errors. Review each migration carefully before
            executing it.
          </li>
        </ul>
      </div>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Use pg-delta to compute schema diffs when comparing branches, instead of migra</li>
        </ul>
      </div>
    </div>
  )
}
