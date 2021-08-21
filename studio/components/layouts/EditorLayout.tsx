import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { ReactElement, useState } from 'react'
import { Select, Divider, Input, Button, IconPlus, SidePanel, Typography } from '@supabase/ui'

export default function EditorLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  const { tables, isLoading, error } = fetchOpenApiSpec()
  const [sidePanelVisible, setSidePanelVisible] = useState(false)

  if (isLoading) return <Loading />
  if (error) return <Error />

  const tableNames = tables.map((table) => table.name)

  const buildSidebar = (tableNames: string[]) => {
    return [
      {
        label: 'All tables',
        links: tableNames.map((name) => ({ label: name, href: `/editor/tables/${name}` })),
      },
    ]
  }

  const buildSidebarButton = () => {
    return {
      label: 'New table',
      action: (_e: any) => setSidePanelVisible(true),
    }
  }

  const toggleSidePanel = () => {
    setSidePanelVisible(!sidePanelVisible)
  }

  const handleTypeSelect = () => {}

  const handleDefaultSelect = () => {}

  return (
    <DashboardLayout
      title={title || 'Table Editor'}
      sidebar={{
        title: 'Tables',
        categories: buildSidebar(tableNames),
        searchable: true,
        button: buildSidebarButton(),
      }}
    >
      <>
        <SidePanel
          wide
          align="right"
          visible={sidePanelVisible}
          title="Add new table"
          onCancel={toggleSidePanel}
        >
          <Input label="Name" />
          <Input label="Description" labelOptional="Optional" />
          <Divider className="my-8" />
          <div className="flex flex-col">
            <Typography.Title level={5}>Add existing content to new table</Typography.Title>
            <Typography.Text type="secondary">
              Upload a CSV or TSV file, or paste copied text from a spreadsheet.
            </Typography.Text>
            <Button className="my-4" icon={<IconPlus />} type="secondary">
              Add existing content
            </Button>
          </div>
          <Divider className="my-4" />
          <div>
            <Input label="Name" />
            <Select label="Type" onChange={handleTypeSelect}>
              <Select.Option value="">---</Select.Option>
              <Select.Option value="int2">int2</Select.Option>
              <Select.Option value="int4">int4</Select.Option>
              <Select.Option value="int8">int8</Select.Option>
              <Select.Option value="text">text</Select.Option>
              <Select.Option value="uuid">uuid</Select.Option>
            </Select>
            <Select label="Default Value" onChange={handleDefaultSelect}>
              <Select.Option value="">---</Select.Option>
              <Select.Option value="Automatically generate as identity">
                Automatically generate as identity
              </Select.Option>
            </Select>
          </div>
        </SidePanel>
        {children}
      </>
    </DashboardLayout>
  )
}
