import { useEffect, useState } from 'react'
import { FRAMEWORKS, File, ORMS, Parent } from './Connect.constants'
import ConnectDropdown from './ConnectDropdown'
import ConnectTabContent from './ConnectTabContent'
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
  Toggle,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
} from 'ui'
import { Plug } from 'lucide-react'

const Connect = () => {
  const [parentSelectorOpen, setParentSelectorOpen] = useState(false)
  const [childDropdownOpen, setChildDropdownOpen] = useState(false)
  const [grandChildDropdownOpen, setGrandChildDropdownOpen] = useState(false)
  const [useConnectionPooler, setUseConnectionPooler] = useState(false)

  const [connectionObject, setConnectionObject] = useState(FRAMEWORKS)
  const [selectedParent, setSelectedParent] = useState(connectionObject[0].key)
  const [selectedChild, setSelectedChild] = useState(
    connectionObject.find((item) => item.key === selectedParent)?.children[0]?.key ?? ''
  )
  const [selectedGrandchild, setSelectedGrandchild] = useState(
    FRAMEWORKS.find((item) => item.key === selectedParent)?.children.find(
      (child) => child.key === selectedChild
    )?.children[0]?.key || ''
  )

  const [contentFiles, setContentFiles] = useState(
    connectionObject
      .find((item) => item.key === selectedParent)
      ?.children.find((child) => child.key === selectedChild)
      ?.children.find((grandchild) => grandchild.key === selectedGrandchild)?.files || []
  )
  console.log(
    { selectedParent },
    { selectedChild },
    { selectedGrandchild },
    { contentFiles },
    contentFiles
  )

  function getContentFiles() {
    const parent = connectionObject.find((item) => item.key === selectedParent)

    if (parent) {
      const child = parent.children.find((child) => child.key === selectedChild)

      // check grandchild first, then child, then parent as the fallback
      if (child) {
        const grandchild = child.children.find(
          (grandchild) => grandchild.key === selectedGrandchild
        )

        if (grandchild) {
          return grandchild.files || []
        } else {
          return child.files || []
        }
      } else {
        return parent.files || []
      }
    }

    return []
  }

  // set the content files when the parent/child/grandchild changes
  useEffect(() => {
    const files = getContentFiles()
    setContentFiles(files)
  }, [selectedParent, selectedChild, selectedGrandchild])

  const handleParentChange = (value: string) => {
    setSelectedParent(value)

    // check if parent has children
    setSelectedChild(connectionObject.find((item) => item.key === value)?.children[0]?.key ?? '')

    // check if child has grandchildren
    setSelectedGrandchild(
      connectionObject.find((item) => item.key === value)?.children[0]?.children[0]?.key ?? ''
    )
  }

  const handleChildChange = (value: string) => {
    setSelectedChild(value)

    const parent = connectionObject.find((item) => item.key === selectedParent)
    const child = parent?.children.find((child) => child.key === value)

    if (child && child.children.length > 0) {
      setSelectedGrandchild(child.children[0].key)
    } else {
      setSelectedGrandchild('')
    }
  }

  const handleGrandchildChange = (value: string) => {
    setSelectedGrandchild(value)
  }

  useEffect(() => {
    const files = getContentFiles()
    setContentFiles(files)
  }, [connectionObject])

  // reset the parent/child/grandchild when the connection type (tab) changes
  function handleConnectionTypeChange(connections: Parent[]) {
    setSelectedParent(connections[0].key)

    if (connections[0]?.children.length > 0) {
      setSelectedChild(connections[0].children[0].key)

      if (connections[0].children[0]?.children.length > 0) {
        setSelectedGrandchild(connections[0].children[0].children[0].key)
      } else {
        setSelectedGrandchild('')
      }
    } else {
      setSelectedChild('')
      setSelectedGrandchild('')
    }
  }

  function handleConnectionType(type: string) {
    if (type === 'frameworks') {
      setConnectionObject(FRAMEWORKS)
      handleConnectionTypeChange(FRAMEWORKS)
    }

    if (type === 'orms') {
      setConnectionObject(ORMS)
      handleConnectionTypeChange(ORMS)
    }
  }

  const getChildOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    if (parent && parent.children.length > 0) {
      return parent.children
    }
    return []
  }

  const getGrandchildrenOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    const subCategory = parent?.children.find((child) => child.key === selectedChild)
    if (subCategory && subCategory.children.length > 0) {
      return subCategory.children
    }
    return []
  }

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

          <Tabs_Shadcn_
            defaultValue="frameworks"
            onValueChange={(value) => handleConnectionType(value)}
          >
            <TabsList_Shadcn_>
              <TabsTrigger_Shadcn_ value="frameworks">App Frameworks</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="orms">ORMs</TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>

            <TabsContent_Shadcn_ value="frameworks">
              <div className="bg-surface-300 p-4">
                <div className="flex items-center gap-2">
                  {/* all parents */}
                  <ConnectDropdown
                    level="parent"
                    open={parentSelectorOpen}
                    setOpen={setParentSelectorOpen}
                    state={selectedParent}
                    updateState={handleParentChange}
                    label="Framework"
                    items={connectionObject}
                  />

                  {/* children of those parents */}
                  {selectedParent &&
                    (connectionObject.find((parent) => parent.key === selectedParent)?.children
                      .length || 0) > 0 && (
                      <ConnectDropdown
                        level="child"
                        open={childDropdownOpen}
                        setOpen={setChildDropdownOpen}
                        state={selectedChild}
                        updateState={handleChildChange}
                        label="Using"
                        items={getChildOptions()}
                      />
                    )}

                  {/* grandchildren if any */}
                  {selectedChild &&
                    (connectionObject
                      .find((parent) => parent.key === selectedParent)
                      ?.children.find((child) => child.key === selectedChild)?.children.length ||
                      0) > 0 && (
                      <ConnectDropdown
                        level="grandchild"
                        open={grandChildDropdownOpen}
                        setOpen={setGrandChildDropdownOpen}
                        state={selectedGrandchild}
                        updateState={handleGrandchildChange}
                        label="With"
                        items={getGrandchildrenOptions()}
                      />
                    )}
                </div>

                <TabsContent files={contentFiles} />
              </div>
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="orms">
              <div className="bg-surface-300 p-4">
                <div className="flex items-center gap-2">
                  {/* all parents */}
                  <ConnectDropdown
                    level="parent"
                    open={parentSelectorOpen}
                    setOpen={setParentSelectorOpen}
                    state={selectedParent}
                    updateState={handleParentChange}
                    label="Framework"
                    items={connectionObject}
                  />

                  {/* children of those parents */}
                  {selectedParent &&
                    (connectionObject.find((parent) => parent.key === selectedParent)?.children
                      .length || 0) > 0 && (
                      <ConnectDropdown
                        level="child"
                        open={childDropdownOpen}
                        setOpen={setChildDropdownOpen}
                        state={selectedChild}
                        updateState={handleChildChange}
                        label="Using"
                        items={getChildOptions()}
                      />
                    )}
                </div>

                <TabsContent files={contentFiles} />
              </div>
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>

          <DialogFooter_Shadcn_>
            <Button type="secondary">Close</Button>
          </DialogFooter_Shadcn_>
        </DialogContent_Shadcn_>
      </Dialog_Shadcn_>
    </div>
  )
}
const TabsContent = ({ files, pooler }: { files: File[]; pooler?: boolean }) => {
  console.log(files[0].path)
  return (
    <div className="bg-surface bg-surface-100 p-4 rounded-md mt-4">
      <Tabs_Shadcn_ defaultValue={files[0].path}>
        <TabsList_Shadcn_>
          {files?.map((file: File) => (
            <TabsTrigger_Shadcn_ key={file.path} value={file.path}>
              {file.displayPath}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>

        {files?.map((file: File) => (
          <TabsContent_Shadcn_ key={file.path} value={file.path}>
            <ConnectTabContent path={file.path} pooler={pooler} />
          </TabsContent_Shadcn_>
        ))}
      </Tabs_Shadcn_>
    </div>
  )
}
export default Connect
