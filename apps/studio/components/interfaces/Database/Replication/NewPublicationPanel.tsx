import { Sheet, SheetContent } from 'ui'

interface NewPublicationPanelProps {
  visible: boolean
}

const NewPublicationPanel = ({ visible }: NewPublicationPanelProps) => {
  return (
    <>
      <Sheet open={visible}>
        <SheetContent showClose={false} size="default"></SheetContent>
      </Sheet>
    </>
  )
}

export default NewPublicationPanel
