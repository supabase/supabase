import Link from 'next/link'
import { Fragment } from 'react'
import { Button, IconBook, IconBookOpen, SidePanel } from 'ui'

import { useAppStateSnapshot } from 'state/app-state'
import { Introduction, UserManagement, Storage, EdgeFunctions } from './Content'
import { DOCS_CONTENT, DOCS_MENU } from './ProjectAPIDocs.constants'

const ProjectAPIDocs = () => {
  const snap = useAppStateSnapshot()

  return (
    <SidePanel
      hideFooter
      size="xxlarge"
      className="max-w-5xl"
      visible={snap.showProjectApiDocs}
      onCancel={() => snap.setShowProjectApiDocs(false)}
    >
      <div className="flex items-start h-full">
        <div className="w-64 border-r h-full">
          <div className="border-b px-4 py-2">API Docs</div>
          <div className="px-2 py-4  border-b">
            {DOCS_MENU.map((item) => {
              const isActive = snap.activeDocsSection[0] === item.key
              const sections = Object.values(DOCS_CONTENT).filter(
                (snippet) => snippet.category === item.key
              )

              // [Joshen] Need to find the right UI component for accessbility
              return (
                <Fragment key={item.key}>
                  <div
                    className={`cursor-pointer text-sm py-2 px-3 rounded-md transition ${
                      isActive ? 'bg-surface-300' : ''
                    }`}
                    onClick={() => snap.setActiveDocsSection([item.key])}
                  >
                    {item.name}
                  </div>
                  {isActive && sections.length > 0 && (
                    <div className="space-y-2 py-2">
                      {sections.map((section) => (
                        <p
                          key={section.key}
                          title={section.title}
                          className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
                        >
                          {section.title}
                        </p>
                      ))}
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
          <div className="p-4">
            <Link passHref href="https://supabase.com/docs">
              <Button block asChild type="text" size="small" icon={<IconBook />}>
                <a target="_blank" rel="noreferrer" className="!justify-start">
                  Guides
                </a>
              </Button>
            </Link>
            <Link passHref href="https://supabase.com/docs/guides/api">
              <Button block asChild type="text" size="small" icon={<IconBookOpen />}>
                <a target="_blank" rel="noreferrer" className="!justify-start">
                  API Reference
                </a>
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 divide-y space-y-4 max-h-screen overflow-auto">
          {snap.activeDocsSection[0] === 'introduction' && <Introduction />}
          {snap.activeDocsSection[0] === 'user-management' && <UserManagement />}
          {snap.activeDocsSection[0] === 'storage' && <Storage />}
          {snap.activeDocsSection[0] === 'edge-functions' && <EdgeFunctions />}
        </div>
      </div>
    </SidePanel>
  )
}

export default ProjectAPIDocs
