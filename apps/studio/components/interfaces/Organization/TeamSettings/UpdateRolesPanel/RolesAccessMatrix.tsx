import { Markdown } from 'components/interfaces/Markdown'
import Table from 'components/to-be-cleaned/Table'
import { ExternalLink } from 'lucide-react'
import { Button, SheetHeader, cn } from 'ui'
import { ROLES_ACCESS_MARKDOWN } from './RolesAccessMatrix.constants'

interface RolesAccessMatrixProps {
  visible: boolean
}

// [Joshen] TODO We'll need to update this for project level permissions too
export const RolesAccessMatrix = ({ visible }: RolesAccessMatrixProps) => {
  return (
    <div
      className={cn(
        'flex flex-col border-l shadow-[rgba(0,0,0,0.13)_-4px_0px_6px_0px] z-10 bg-studio',
        visible && 'w-[52%]'
      )}
    >
      <SheetHeader className="flex items-center justify-between py-3 border-b">
        <p>Permissions across roles</p>
        <Button asChild type="default" icon={<ExternalLink size={14} />}>
          <a
            href="https://supabase.com/docs/guides/platform/access-control"
            target="_blank"
            rel="noreferrer"
          >
            Documentation
          </a>
        </Button>
      </SheetHeader>

      <div className="flex flex-col flex-grow gap-y-4 px-5 py-5 overflow-y-auto">
        <p className="text-sm text-foreground-light">
          The table below shows the corresponding permissions for each available role you can assign
          a team member in the Dashboard.
        </p>
        <Markdown
          content={ROLES_ACCESS_MARKDOWN}
          className="max-w-full [&>table>thead>tr>th:not(:first-child)]:text-center [&>table>tbody>tr>td:not(:first-child)]:text-center"
          components={{
            th: ({ children }) => {
              if (children?.[0] && typeof children[0] === 'string' && children[0].includes('[^')) {
                const text = children[0].split('[^')
                const number = text?.[1]?.[0] ?? undefined
                return (
                  <th>
                    {text[0]}
                    {number !== undefined && (
                      <sup
                        tabIndex={Number(number)}
                        className="ml-0.5 text-foreground cursor-pointer underline"
                        onClick={() => {
                          const el = document.getElementById(`roles-helper-${number}`)
                          if (el !== undefined)
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                      >
                        {number}
                      </sup>
                    )}
                  </th>
                )
              } else {
                return <th>{children?.[0]}</th>
              }
            },
            td: ({ children }) => {
              if (children?.[0] && typeof children[0] === 'string' && children[0].includes('[^')) {
                const text = children[0].split('[^')
                const number = text?.[1]?.[0] ?? undefined
                return (
                  <td>
                    {text[0]}
                    {number !== undefined && (
                      <sup
                        tabIndex={Number(number)}
                        className="ml-0.5 text-foreground cursor-pointer underline"
                        onClick={() => {
                          const el = document.getElementById(`roles-helper-${number}`)
                          if (el !== undefined)
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                      >
                        {number}
                      </sup>
                    )}
                  </td>
                )
              } else {
                return <td>{children?.[0]}</td>
              }
            },
          }}
        />

        <div className="flex flex-col gap-y-2">
          <p className="text-sm">Footnotes</p>
          <ol className="list-decimal pl-6 text-xs flex flex-col gap-y-2">
            <li id="roles-helper-1">Available on the Teams and Enterprise Plans.</li>
            <li id="roles-helper-2">
              Invites sent from a SSO account can only be accepted by another SSO account coming
              from the same identity provider. This is a security measure that prevents accidental
              invites to accounts not managed by your company's enterprise systems
            </li>
            <li id="roles-helper-3">
              <Markdown
                className="text-xs text-foreground"
                content="Only available on projects using PostgreSQL 14 and above. You can upgrade your project through [infrastructure settings](https://supabase.com/dashboard/project/_/settings/infrastructure)."
              />
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
