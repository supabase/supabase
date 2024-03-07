type GuideRefItem = { id: string; title: string; libraries: Array<string> }

const NavigationMenuGuideRef = ({ refData }: { refData: Array<GuideRefItem> }) => {
  return <pre>{JSON.stringify(refData, null, 2)}</pre>
}

export type { GuideRefItem }
export { NavigationMenuGuideRef }
