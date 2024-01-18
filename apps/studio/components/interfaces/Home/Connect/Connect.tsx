import { useEffect, useState } from 'react'
import { FRAMEWORKS, ORMS, Parent } from './Connect.constants'

const Connect = () => {
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

  const generateDropdownOptions = (data: Parent[]) => {
    return data.map((item) => (
      <option key={item.key} value={item.key}>
        {item.label}
      </option>
    ))
  }

  const getParentOptions = () => {
    return connectionObject.map((item) => (
      <option key={item.key} value={item.key}>
        {item.label}
      </option>
    ))
  }

  const getSubCategoryOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    if (parent && parent.children.length > 0) {
      return generateDropdownOptions(parent.children)
    }
    return []
  }

  const getGrandchildrenOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    const subCategory = parent?.children.find((child) => child.key === selectedChild)
    if (subCategory && subCategory.children.length > 0) {
      return generateDropdownOptions(subCategory.children)
    }
    return []
  }

  return (
    <div>
      <div className="my-4 flex gap-3">
        <button onClick={() => handleConnectionType('frameworks')}>frameworks</button>
        <button onClick={() => handleConnectionType('orms')}>orms</button>
      </div>
      <label>Parent:</label>
      <select value={selectedParent} onChange={(e) => handleParentChange(e.target.value)}>
        {getParentOptions()}
      </select>

      {selectedParent &&
        (connectionObject.find((parent) => parent.key === selectedParent)?.children.length || 0) >
          0 && (
          <div>
            <label>Child: </label>
            <select value={selectedChild} onChange={(e) => handleChildChange(e.target.value)}>
              {getSubCategoryOptions()}
            </select>
          </div>
        )}

      {selectedChild &&
        (connectionObject
          .find((parent) => parent.key === selectedParent)
          ?.children.find((child) => child.key === selectedChild)?.children.length || 0) > 0 && (
          <div>
            <label>Grandchild:</label>
            <select
              value={selectedGrandchild}
              onChange={(e) => handleGrandchildChange(e.target.value)}
            >
              {getGrandchildrenOptions()}
            </select>
          </div>
        )}

      <div className="my-4">
        <h2>Connection files: </h2>
        <ul>
          {contentFiles.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Connect
