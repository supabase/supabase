import { FC } from 'react'
import {
  Button,
  Dropdown,
  Typography,
  IconDownload,
  IconCopy,
  IconChevronDown,
  IconHeart,
} from '@supabase/ui'

interface Props {
  isRunning: boolean
  runQuery: () => void
  onSelectDownload: () => void
  onSelectCopy: () => void
  onSelectFavourite: () => void
}

const Toolbar: FC<Props> = ({
  isRunning,
  runQuery = () => {},
  onSelectDownload = () => {},
  onSelectCopy = () => {},
  onSelectFavourite = () => {},
}) => {
  return (
    <div className="flex items-center justify-between px-5 py-2">
      <div className="flex items-center space-x-2">
        <Dropdown
          side="bottom"
          align="start"
          overlay={[
            <Dropdown.Item
              key="download-csv"
              icon={<IconDownload size={14} strokeWidth={2} />}
              onClick={onSelectDownload}
            >
              Download as CSV
            </Dropdown.Item>,
            <Dropdown.Item
              key="copy-markdown"
              icon={<IconCopy size={14} strokeWidth={2} />}
              onClick={onSelectCopy}
            >
              Copy as markdown
            </Dropdown.Item>,
          ]}
        >
          <Button as="span" type="text" iconRight={<IconChevronDown size={14} strokeWidth={2} />}>
            <div>Results</div>
          </Button>
        </Dropdown>
      </div>
      <div className="flex items-center space-x-2">
        <Button type="text" onClick={() => onSelectFavourite()}>
          <div className="py-1">
            <IconHeart size={14} strokeWidth={2} />
          </div>
        </Button>
        <Button type="default" loading={isRunning} onClick={() => runQuery()}>
          <div className="space-x-2">
            <Typography.Text small>Run</Typography.Text>
            <Typography.Text keyboard>⌘</Typography.Text>
            <Typography.Text small>+</Typography.Text>
            <Typography.Text keyboard>↵</Typography.Text>
          </div>
        </Button>
      </div>
    </div>
  )
}

export default Toolbar
