export function Header() {
  return (
    <header className="border-b border-default">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
        <a href="https://supabase.com" className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}supabase-logo-wordmark.svg`}
            alt="Supabase"
            className="h-5 w-auto"
          />
        </a>
        <span className="text-sm text-foreground-light">Knowledge Base</span>
      </div>
    </header>
  )
}
