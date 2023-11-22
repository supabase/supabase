import { Button } from 'ui'

export const Footer = () => {
  return (
    <div className="flex justify-end gap-2 p-4 bg-overlay border-t border-overlay">
      <Button type="default" onClick={() => {}}>
        Cancel
      </Button>
      <Button htmlType="submit" onClick={() => {}}>
        Insert policy
      </Button>
    </div>
  )
}
