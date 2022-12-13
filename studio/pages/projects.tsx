import ProjectList from 'components/interfaces/Home/ProjectList'
import { AccountLayout } from 'components/layouts'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import Connecting from 'components/ui/Loading/Loading'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { NextPageWithLayout } from 'types'
import { Button, Popover, SidePanel } from 'ui'

const ProjectsPage: NextPageWithLayout = () => {
  const { app } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <>
      {app.organizations.isLoading ? (
        <div className="flex h-full items-center justify-center space-x-2">
          <Connecting />
        </div>
      ) : (
        <div className="py-4 px-5">
          <Button onClick={() => setOpen(!open)}>Open sidebar</Button>
          <SidePanel header="something" visible={!open} onCancel={() => setOpen(!open)}>
            Something in here
            <Popover
              overlay={
                <div className="max-h-[110px] w-[64px] overflow-y-auto">
                  <p>World 1</p>
                  <p>World 2</p>
                  <p>World 3</p>
                  <p>World 4</p>
                  <p>World 5</p>
                  <p>World 6</p>
                  <p>World 7</p>
                  <p>World 8</p>
                </div>
              }
            >
              Hello
            </Popover>
          </SidePanel>

          <Popover
            overlay={
              <div className="max-h-[110px] w-[64px] overflow-y-auto">
                <p>World 1</p>
                <p>World 2</p>
                <p>World 3</p>
                <p>World 4</p>
                <p>World 5</p>
                <p>World 6</p>
                <p>World 7</p>
                <p>World 8</p>
              </div>
            }
          >
            Hello
          </Popover>

          {IS_PLATFORM && (
            <div className="my-2">
              <div className="flex">
                <div className="">
                  <OrganizationDropdown organizations={app.organizations} />
                </div>
              </div>
            </div>
          )}
          <div className="my-8 space-y-8">
            <ProjectList />
          </div>
        </div>
      )}
    </>
  )
}

ProjectsPage.getLayout = (page) => (
  <AccountLayout
    title="Supabase"
    breadcrumbs={[
      {
        key: `supabase-projects`,
        label: 'Projects',
      },
    ]}
  >
    {page}
  </AccountLayout>
)

export default observer(ProjectsPage)
