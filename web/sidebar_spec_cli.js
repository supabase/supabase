module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['reference/cli/index', 'reference/cli/supabase-init'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Local Development',
      items: ['reference/cli/supabase-start', 'reference/cli/supabase-stop', 'reference/cli/supabase-eject'],
      collapsed: true,
    }
  ],
}