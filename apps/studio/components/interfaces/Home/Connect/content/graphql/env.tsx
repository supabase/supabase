import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <div>
      <SimpleCodeBlock className="bash">
        {`
SUPABASE_API_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
