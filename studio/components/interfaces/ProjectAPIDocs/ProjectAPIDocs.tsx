import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useAppStateSnapshot } from 'state/app-state'
import { SidePanel } from 'ui'
import Introduction from './Introduction'
import { DOCS_MENU } from './ProjectAPIDocs.constants'
import { Fragment } from 'react'
import UserManagement from './UserManagement'

const ProjectAPIDocs = () => {
  const snap = useAppStateSnapshot()
  const { ref: projectRef } = useParams()
  const { data } = useProjectApiQuery({ projectRef })

  const endpoint = data?.autoApiService.endpoint ?? ''

  return (
    <SidePanel
      hideFooter
      size="xxlarge"
      visible={snap.showProjectApiDocs}
      onCancel={() => snap.setShowProjectApiDocs(false)}
    >
      <div className="flex items-start h-full">
        <div className="w-56 border-r h-full p-4">
          {DOCS_MENU.map((item) => {
            const isActive = snap.activeDocsSection[0] === item.key
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
                {isActive && item.sections && (
                  <div className="space-y-2 py-2">
                    {item.sections.map((section) => (
                      <p
                        key={section.key}
                        className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
                      >
                        {section.name}
                      </p>
                    ))}
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
        <div className="flex-1 divide-y space-y-4 max-h-screen overflow-auto">
          {snap.activeDocsSection[0] === 'introduction' && <Introduction endpoint={endpoint} />}
          {snap.activeDocsSection[0] === 'user-management' && (
            <UserManagement endpoint={endpoint} />
          )}
        </div>
      </div>
    </SidePanel>
  )
}

export default ProjectAPIDocs
