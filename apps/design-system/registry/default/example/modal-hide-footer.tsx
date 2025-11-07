import { Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Modal } from 'ui'

export default function ModalVerticalHideFooter() {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <Button type="default" onClick={() => setVisible(!visible)}>
        Open Modal
      </Button>
      <Modal
        visible={visible}
        onCancel={() => setVisible(!visible)}
        onConfirm={() => setVisible(!visible)}
        title="This is the title of the modal"
        description="And i am the description"
        hideFooter={true}
        size="medium"
        hideClose={false}
        header={
          <div className="flex items-center gap-2 text-foreground">
            <div className="text-brand">
              <Link2 />
            </div>
            <div className="flex items-baseline gap-2">
              <h3>This is the title</h3>
              <span className="text-xs text-foreground-muted">This is the title</span>
            </div>
          </div>
        }
      >
        <Modal.Content>
          <p>
            Modal content is inserted here, if you need to insert anything into the Modal you can do
            so via `children`.
          </p>
        </Modal.Content>
      </Modal>
    </>
  )
}
