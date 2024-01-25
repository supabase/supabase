import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { getProjectRef } from '../../Connect.utils'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  const { apiUrl, anonKey } = projectKeys
  const projectRef = getProjectRef(apiUrl)

  console.log({ apiUrl }, { projectRef })
  return (
    <div>
      <SimpleCodeBlock className="bash">
        {`
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_KEY=${projectKeys.anonKey ?? 'your-anon-key'}

curl -X POST https://<PROJECT_REF>.supabase.co/graphql/v1 \
    -H 'apiKey: <API_KEY>' \
    -H 'Content-Type: application/json' \
    --data-raw '{"query": "{ accountCollection(first: 1) { edges { node { id } } } }", "variables": {}}'

        `}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
