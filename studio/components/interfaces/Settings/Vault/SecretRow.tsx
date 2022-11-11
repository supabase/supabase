import dayjs from 'dayjs'
import { FC, useState } from 'react'
import { Button, IconEye, IconEyeOff, IconTrash, Input } from 'ui'

interface Props {
  secret: any
  onSelectRemove: (secret: any) => void
}

const SecretRow: FC<Props> = ({ secret, onSelectRemove }) => {
  const [revealedValue, setRevealedValue] = useState<string>()

  const revealSecret = async () => {
    if (revealedValue === undefined) {
      // Some DB call
      setRevealedValue(secret.secret)
    } else {
      setRevealedValue(undefined)
    }
  }

  return (
    <div className="px-6 py-4 flex items-center space-x-4">
      <div className="space-y-1 min-w-[37%] max-w-[37%]">
        <p className="text-sm truncate" title={secret.description}>
          {secret.description}
        </p>
        <p className="text-sm text-scale-1000 font-mono font-bold truncate" title={secret.secret}>
          {secret.key_id}
        </p>
      </div>
      <div className="flex items-center space-x-2 w-[38%]">
        <Button
          type="text"
          className="px-1.5"
          icon={
            revealedValue === undefined ? (
              <IconEye size={16} strokeWidth={1.5} />
            ) : (
              <IconEyeOff size={16} strokeWidth={1.5} />
            )
          }
          onClick={() => revealSecret()}
        />
        <div className="flex-grow">
          {revealedValue === undefined ? (
            <p className="text-sm font-mono">••••••••••••••••••</p>
          ) : (
            // <p className="text-sm font-mono">{revealedValue}</p>
            <Input copy className="font-mono" value={revealedValue} />
          )}
        </div>
      </div>
      <div className="flex items-center justify-end w-[25%] space-x-4">
        <p className="text-sm text-scale-1100">
          Added on {dayjs(secret.created_at).format('MMM D, YYYY')}.
        </p>
        <Button
          type="default"
          className="py-2"
          icon={<IconTrash />}
          onClick={() => onSelectRemove(secret)}
        />
      </div>
    </div>
  )
}

export default SecretRow
