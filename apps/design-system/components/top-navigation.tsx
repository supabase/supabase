import { docsConfig } from '@/config/docs'

function TopNavigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-t bg-studio/95 backdrop-blur supports-[backdrop-filter]:bg-studio/60">
      <div className="absolute border-b border-dashed w-full top-[3.4rem] -z-10"></div>
      <nav className="h-14 w-full flex">
        <div className="max-w-site border-b w-full flex flex-row items-center gap-6 mx-auto px-6 border-r border-l">
          <h1>Design System</h1>
          {docsConfig.mainNav.map((section) => (
            <>
              <div className="font-mono uppercase text-xs text-foreground-lighter">
                {section.title}
              </div>
            </>
          ))}
        </div>
      </nav>
    </header>
  )
}

export default TopNavigation
