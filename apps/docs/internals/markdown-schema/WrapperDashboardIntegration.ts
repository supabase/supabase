export const WrapperDashboardIntegration = ({
  props,
}: {
  props: Record<string, unknown>
}): string => {
  const title = props.title ? String(props.title) : 'this'
  const path = String(props.path ?? '')
  return `> You can enable the ${title} wrapper right from the [Supabase dashboard](https://supabase.com/dashboard/project/_/integrations/${path}/overview).`
}
