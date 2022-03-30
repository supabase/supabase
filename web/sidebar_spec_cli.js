module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['reference/cli/index'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Command reference',
      items: ['reference/cli/supabase-help', 'reference/cli/supabase-login', 'reference/cli/supabase-link', 'reference/cli/supabase-init', 'reference/cli/supabase-start', 'reference/cli/supabase-stop', 'reference/cli/supabase-db-branch-list', 'reference/cli/supabase-db-branch-create', 'reference/cli/supabase-db-branch-delete', 'reference/cli/supabase-db-switch', 'reference/cli/supabase-db-changes', 'reference/cli/supabase-db-commit', 'reference/cli/supabase-db-reset', 'reference/cli/supabase-db-remote-set', 'reference/cli/supabase-db-remote-commit', 'reference/cli/supabase-db-push', 'reference/cli/supabase-functions-delete', 'reference/cli/supabase-functions-deploy', 'reference/cli/supabase-functions-new', 'reference/cli/supabase-functions-serve', 'reference/cli/supabase-migration-new', 'reference/cli/supabase-secrets-list', 'reference/cli/supabase-secrets-set', 'reference/cli/supabase-secrets-unset'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Config reference',
      items: ['reference/cli/config-reference'],
      collapsed: true,
    }
  ],
}