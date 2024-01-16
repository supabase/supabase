const ContentFile = ({ pooler }: { pooler: boolean }) => {
  const portNumber = pooler ? 12456 : 654321

  return (
    <div>
      {pooler ? 'pooler' : 'no pooler'}
      <pre>
        {`
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_PRISMA_SOMETHING=your-key
PORT_NUMBER=${portNumber}
        `}
      </pre>
    </div>
  )
}

export default ContentFile
