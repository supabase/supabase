import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const Clientfile = () => {
  return (
    <div>
      {/* prettier-ignore */}
      <SimpleCodeBlock>
        NEXT_PUBLIC_SUPABASE_URL=your-project-url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
      </SimpleCodeBlock>
    </div>
  )
}

export default Clientfile
