import { ConnectionType, FRAMEWORKS, MOBILES, ORMS } from './Connect.constants'

export function getProjectRef(url: string): string | null {
  const regex: RegExp = /https:\/\/([^\.]+)\./
  const match: RegExpMatchArray | null = url.match(regex)

  if (match) {
    return match[1]
  } else {
    return null
  }
}

export const getContentFilePath = ({
  connectionObject,
  selectedParent,
  selectedChild,
  selectedGrandchild,
}: {
  selectedParent: string
  selectedChild: string
  selectedGrandchild: string
  connectionObject: ConnectionType[]
}) => {
  const parent = connectionObject.find((item) => item.key === selectedParent)

  if (parent) {
    const child = parent.children.find((child) => child.key === selectedChild)

    // check grandchild first, then child, then parent as the fallback
    if (child) {
      const grandchild = child.children.find((grandchild) => grandchild.key === selectedGrandchild)

      if (grandchild) {
        return `${selectedParent}/${selectedChild}/${selectedGrandchild}`
      } else {
        return `${selectedParent}/${selectedChild}`
      }
    } else {
      return selectedParent
    }
  }

  return ''
}

export function inferConnectTabFromParentKey(
  parentKey: string | null
): 'frameworks' | 'mobiles' | 'orms' | null {
  if (!parentKey) return null
  if (FRAMEWORKS.find((x: ConnectionType) => x.key === parentKey)) return 'frameworks'
  if (MOBILES.find((x: ConnectionType) => x.key === parentKey)) return 'mobiles'
  if (ORMS.find((x: ConnectionType) => x.key === parentKey)) return 'orms'
  return null
}
