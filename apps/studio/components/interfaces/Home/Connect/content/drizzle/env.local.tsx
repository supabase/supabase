const ContentFile = () => {
  return (
    <div>
      <pre>
        {`
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DRIZZLE_SOMETHING=your-key
        `}
      </pre>
    </div>
  )
}

export default ContentFile
