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
import dynamic from 'next/dynamic'
import { get, find } from 'lodash'
import CopyButton from 'components/ui/CopyButton'
import DatabaseConnectionString from 'components/interfaces/Settings/Database/DatabaseSettings/DatabaseConnectionString'
import { LIBS } from '../Connect.utils'
import ConnectDropdown from './ConnectDropdown'
import { Markdown } from 'components/interfaces/Markdown'

import { BASE_PATH } from 'lib/constants'
import { SqlDebugResponse } from 'data/ai/sql-debug-mutation'
import ConnectTabContent from './ConnectTabContent'

// export async function getContentFileNames() {
//   'hello getcontentfilenames'
//   const req = await fetch(BASE_PATH + '/api/connect')

//   const res = await req.json()
//   console.log({ res })
// }

const Connect = () => {
  const [parentSelectorOpen, setParentSelectorOpen] = useState(false)
  const [childDropdownOpen, setChildDropdownOpen] = useState(false)
  const [grandChildDropdownOpen, setGrandChildDropdownOpen] = useState(false)

  // Parent -> child -> grandchild
  // nextjs -> app router -> supabase-js
  const [selectedParent, setSelectedParent] = useState(LIBS[0].key)
  const [selectedChild, setSelectedChild] = useState('')
  const [selectedGrandchild, setSelectedGrandchild] = useState('')
  // the key of the Libs item that has the files we want to display

  const [contentFiles, setContentFiles] = useState(LIBS[0]?.children[0]?.grandchildren[0].files)

  useEffect(() => {
    const selectedParentItem = LIBS.find((item) => item.key === selectedParent)

    // if parent has child, set that as the selected child
    if (selectedParentItem && selectedParentItem.children) {
      setSelectedChild(selectedParentItem.children[0]?.key)
    } else {
      setSelectedChild('')
    }

    // if parent has grandchild, set that as the selected grandchild
    if (selectedParentItem && selectedParentItem.children) {
      const selectedChildItem = selectedParentItem.children.find(
        (childItem) => childItem.key === selectedChild
      )
      if (selectedChildItem && selectedChildItem.grandchildren) {
        setSelectedGrandchild(selectedChildItem.grandchildren[0]?.key)
      } else {
        setSelectedGrandchild('')
      }
    }

    // set the current contentFiles
    const selectedGrandchildItem = LIBS.find((item) => {
      return (
        item.children &&
        item.children.some((child) => {
          return (
            child.grandchildren &&
            child.grandchildren.some((grandchild) => {
              return grandchild.key === selectedGrandchild
            })
          )
        })
      )
    })

    if (
      selectedGrandchildItem &&
      get(selectedGrandchildItem, 'children[0].grandchildren[0].files')
    ) {
      setContentFiles(get(selectedGrandchildItem, 'children[0].grandchildren[0].files', []))
    } else {
      // If selectedGrandchild is not found, check for selectedChild.files
      const selectedChildItem = LIBS.find((item) => {
        return (
          item.children &&
          item.children.some((child) => {
            return child.key === selectedChild
          })
        )
      })

      if (selectedChildItem && get(selectedChildItem, 'children[0].files')) {
        setContentFiles(get(selectedChildItem, 'children[0].files', []))
      }
    }
  }, [selectedParent, selectedChild, selectedGrandchild])

  console.log({ selectedParent, selectedChild, selectedGrandchild })

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

          <Tabs type="underlined" size="small">
            <Tabs.Panel id="api_keys" label="API Keys" key="keys">
              <div className="bg-surface-300 p-4">
                <div className="flex items-center gap-2">
                  <ConnectDropdown
                    level="parent"
                    open={parentSelectorOpen}
                    setOpen={setParentSelectorOpen}
                    state={selectedParent}
                    updateState={setSelectedParent}
                    label="Framework"
                    items={LIBS}
                  />

                  {selectedParent && LIBS.find((item) => item.key === selectedParent)?.children && (
                    <ConnectDropdown
                      level="child"
                      open={childDropdownOpen}
                      setOpen={setChildDropdownOpen}
                      state={selectedChild as string}
                      updateState={setSelectedChild}
                      label="Using"
                      items={get(find(LIBS, { key: selectedParent }), 'children', [])}
                    />
                  )}

                  {/* if item has grandchildren show them */}
                  {selectedGrandchild &&
                    get(find(LIBS, { key: selectedParent }), `children[0].grandchildren`) && (
                      <>
                        <ConnectDropdown
                          level="grandchild"
                          open={grandChildDropdownOpen}
                          setOpen={setGrandChildDropdownOpen}
                          state={selectedGrandchild as string}
                          updateState={setSelectedChild}
                          label="Client"
                          items={get(
                            find(LIBS, { key: selectedParent }),
                            'children[0].grandchildren',
                            []
                          )}
                        />
                      </>
                    )}
                </div>

                <div className="bg-surface bg-surface-100 p-4 rounded-md mt-4">
                  <Tabs type="underlined" size="small">
                    {contentFiles?.map((file) => (
                      <Tabs.Panel id={file.fileName} label={file.displayName} key={file.fileName}>
                        <ConnectTabContent path={file.path} />
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="connection_strings" label="Connection strings" key="connection_strings">
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
