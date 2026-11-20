import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$ref/api/')({
  component: ApiDocsRedirect,
})

function ApiDocsRedirect() {
  const { ref } = Route.useParams()

  return (
    <Navigate
      to="/project/$ref/integrations/$id/$pageId"
      params={{ ref, id: 'data_api', pageId: 'docs' }}
      search={true}
      replace
    />
  )
}
