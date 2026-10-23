import { Link } from '@tanstack/react-router'
import { useParams } from 'common'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  NavMenu,
  NavMenuItem,
} from 'ui'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import { PageNav } from 'ui-patterns/PageNav'

import { IssueCheckSettings } from './IssueCheckSettings'
import { IssueNotificationSettings } from './IssueNotificationSettings'

type IssueSettingsTab = 'checks' | 'notifications'

const ISSUE_SETTINGS_TABS: { id: IssueSettingsTab; label: string }[] = [
  { id: 'checks', label: 'Checks' },
  { id: 'notifications', label: 'Notifications' },
]

/** Settings parent: breadcrumbs and tabs only, each tab renders its own page header. */
export const IssueSettings = () => {
  const { ref } = useParams()
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<IssueSettingsTab>(ISSUE_SETTINGS_TABS.map((item) => item.id))
      .withDefault('checks')
      .withOptions({ history: 'push' })
  )

  return (
    <div className="h-full overflow-y-auto">
      <PageBreadcrumbs>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/project/$ref/issues" params={{ ref: ref ?? '' }}>
                Issues
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>
      <PageNav>
        <NavMenu aria-label="Issue settings">
          {ISSUE_SETTINGS_TABS.map((item) => (
            <NavMenuItem key={item.id} active={tab === item.id}>
              <button type="button" tabIndex={0} onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>
      {tab === 'checks' && <IssueCheckSettings />}
      {tab === 'notifications' && <IssueNotificationSettings />}
    </div>
  )
}
