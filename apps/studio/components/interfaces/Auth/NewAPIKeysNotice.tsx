import Panel from 'components/ui/Panel'

export const NewAPIKeysNotice = () => {
  return (
    <Panel.Notice
      className="border border-t-0 rounded-lg rounded-t-none"
      title="New API keys coming 2025"
      description={`
\`anon\` and \`service_role\` API keys will be changing to \`publishable\` and \`secret\` API keys.   
    `}
      href="https://github.com/orgs/supabase/discussions/29260"
      buttonText="Read the announcement"
    />
  )
}
