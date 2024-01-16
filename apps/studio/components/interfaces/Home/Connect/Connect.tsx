import { Plug } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  DialogContent_Shadcn_,
  DialogDescription_Shadcn_,
  DialogFooter_Shadcn_,
  DialogHeader_Shadcn_,
  DialogTitle_Shadcn_,
  DialogTrigger_Shadcn_,
  Dialog_Shadcn_,
  Tabs,
} from 'ui'
import { FRAMEWORKS, ORMS } from '../Connect.utils'
import ConnectDropdown from './ConnectDropdown'

import ConnectTabContent from './ConnectTabContent'

type ConnectionType = 'frameworks' | 'orms' | 'direct' | 'graphql'

const Connect = () => {
  //const [connectionType, setConnectionType] = useState<ConnectionType>('frameworks')
  const [connectionObject, setconnectionObject] = useState(FRAMEWORKS)
  const [parentSelectorOpen, setParentSelectorOpen] = useState(false)
  const [childDropdownOpen, setChildDropdownOpen] = useState(false)
  const [grandChildDropdownOpen, setGrandChildDropdownOpen] = useState(false)

  // Parent -> child -> grandchild
  // nextjs -> app router -> supabase-js
  const [selectedParent, setSelectedParent] = useState('nextjs')
  const [selectedChild, setSelectedChild] = useState('app')
  const [selectedGrandchild, setSelectedGrandchild] = useState('supabasejs')

  // the key of the item that has the files we want to display
  const [contentFiles, setContentFiles] = useState(
    connectionObject.find(
      (item) =>
        item.key === selectedGrandchild &&
        item.parentKey === selectedParent &&
        item.grandparentKey === selectedChild
    )?.files || []
  )

  // listen for changes to parent / child / grandchild
  useEffect(() => {
    const child = connectionObject.find(
      (item) => item.parentKey === selectedParent && item.parentKey
    )
    const grandchild = connectionObject.find(
      (item) => item.grandparentKey === selectedChild && item.grandparentKey
    )

    if (selectedParent) {
      setSelectedChild(child?.key || '')
      setSelectedGrandchild(grandchild?.key || '')
    }
  }, [selectedParent, selectedChild, selectedGrandchild])

  // set the selected contentFiles
  useEffect(() => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    const child = connectionObject.find(
      (item) => item.parentKey === selectedParent && item.parentKey
    )
    const grandchild = connectionObject.find(
      (item) => item.grandparentKey === selectedChild && item.grandparentKey
    )
    console.log({ grandchild })
    // check grandchild first, then child, then parent  for files[]
    if (grandchild) {
      setContentFiles(grandchild?.files || [])
    } else if (child) {
      setContentFiles(child?.files || [])
    } else {
      setContentFiles(parent?.files || [])
    }
  }, [selectedParent, selectedChild, selectedGrandchild])

  console.log({ selectedParent, selectedChild, selectedGrandchild })

  function handleConnectionTypeChange(value: string) {
    // set the selectedParent to the first item in the current connectionObject

    if (value === 'framework') {
      setconnectionObject(FRAMEWORKS)
      setSelectedParent('nextjs')
      setSelectedChild('app')
    }
    if (value === 'orm') {
      // @ts-ignore
      setconnectionObject(ORMS)
      setSelectedParent('prisma')
      setSelectedChild('')
      setSelectedGrandchild('')
    }
    console.log('connection type change', value)
  }

  console.log({ contentFiles })

  return (
    <div>
      <Dialog_Shadcn_ open={true}>
        <DialogTrigger_Shadcn_ asChild>
          <Button type="secondary">
            <span className="flex items-center gap-2">
              <Plug size={12} className="rotate-90" /> <span>Connect</span>
            </span>
          </Button>
        </DialogTrigger_Shadcn_>
        <DialogContent_Shadcn_ className="sm:max-w-5xl">
          <DialogHeader_Shadcn_>
            <DialogTitle_Shadcn_>Connect to your project</DialogTitle_Shadcn_>
            <DialogDescription_Shadcn_>
              Get the connection strings and environment variables for your app
            </DialogDescription_Shadcn_>
          </DialogHeader_Shadcn_>

          <Tabs
            type="underlined"
            size="small"
            onChange={(value: string) => handleConnectionTypeChange(value)}
          >
            <Tabs.Panel id="framework" label="App Framework" key="framework">
              <div className="bg-surface-300 p-4">
                <div className="flex items-center gap-2">
                  {/* first dropdown is every LIB item without a parentKey or grandparentKey */}
                  <ConnectDropdown
                    level="parent"
                    open={parentSelectorOpen}
                    setOpen={setParentSelectorOpen}
                    state={selectedParent}
                    updateState={setSelectedParent}
                    label="Framework"
                    items={connectionObject.filter(
                      (item) => !item.parentKey && !item.grandparentKey
                    )}
                  />

                  {/* second dropdown has a parentKey but doesn't have a grandparentKey */}
                  {selectedParent && selectedChild && (
                    <ConnectDropdown
                      level="child"
                      open={childDropdownOpen}
                      setOpen={setChildDropdownOpen}
                      state={selectedChild as string}
                      updateState={setSelectedChild}
                      label="Using"
                      items={connectionObject.filter(
                        (item) => item.parentKey === selectedParent && !item.grandparentKey
                      )}
                    />
                  )}

                  {/* third dropdown has a parentKey and a grandparentKey */}
                  {selectedParent && selectedChild && selectedGrandchild && (
                    <ConnectDropdown
                      level="grandchild"
                      open={grandChildDropdownOpen}
                      setOpen={setGrandChildDropdownOpen}
                      state={selectedGrandchild as string}
                      updateState={setSelectedChild}
                      label="With"
                      items={connectionObject.filter(
                        (item) => item.parentKey && item.grandparentKey
                      )}
                    />
                  )}
                </div>

                <div className="bg-surface bg-surface-100 p-4 rounded-md mt-4">
                  <Tabs type="underlined" size="small" defaultActiveId={contentFiles[0].path}>
                    {contentFiles?.map((file) => (
                      <Tabs.Panel id={file.path} label={file.name} key={file.displayPath}>
                        <ConnectTabContent path={file.path} />
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="orm" label="Postgres ORM" key="orm">
              <div className="bg-surface-300 p-4">
                <div className="flex items-center gap-2">
                  <ConnectDropdown
                    level="parent"
                    open={parentSelectorOpen}
                    setOpen={setParentSelectorOpen}
                    state={selectedParent}
                    updateState={setSelectedParent}
                    label="ORM"
                    items={ORMS.filter((item) => !item.parentKey && !item.grandparentKey)}
                  />
                </div>
              </div>

              <div className="bg-surface bg-surface-100 p-4 rounded-md mt-4">
                <Tabs type="underlined" size="small" defaultActiveId={contentFiles[0].path}>
                  {contentFiles?.map((file) => (
                    <Tabs.Panel id={file.path} label={file.name} key={file.displayPath}>
                      <ConnectTabContent path={file.path} />
                    </Tabs.Panel>
                  ))}
                </Tabs>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="direct_connection" label="Direct Connection" key="direct_connection">
              <div className="bg-surface-300 p-4">hello</div>
            </Tabs.Panel>

            <Tabs.Panel id="graphql" label="GraphQL" key="graphql">
              <div className="bg-surface-300 p-4">hello</div>
            </Tabs.Panel>
          </Tabs>

          <DialogFooter_Shadcn_>
            <Button type="secondary">Close</Button>
          </DialogFooter_Shadcn_>
        </DialogContent_Shadcn_>
      </Dialog_Shadcn_>
    </div>
  )
}

export default Connect
