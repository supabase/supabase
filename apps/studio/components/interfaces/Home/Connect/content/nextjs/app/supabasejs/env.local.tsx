import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

interface ContentFileProps {
  projectKeys: {
    apiUrl: string
    anonKey: string
  }
}

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <div>
      <SimpleCodeBlock className="bash">
        {`
NEXT_PUBLIC_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
