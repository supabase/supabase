import { Badge } from '@supabase/ui'
import Description from './Description'

const Param = ({
  name,
  type,
  format,
  required,
  description,
  metadata = {},
  onDesciptionUpdated = () => {},
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4 ">
        <code className="px-2 inline-block">{name}</code>
        <Badge color={required ? 'amber' : 'scale'}>{required ? 'Required' : 'Optional'}</Badge>
      </div>
      {format && format != type && (
        <div className="mb-4 flex items-center gap-2">
          <label className="uppercase text-xs font-mono text-scale-900">Format:</label>
          <code className="px-2">{format}</code>
          {type}
        </div>
      )}
      {description !== false && (
        <>
          <label className="uppercase text-xs font-mono text-scale-900">Description</label>
          <Description content={description} metadata={metadata} onChange={onDesciptionUpdated} />
        </>
      )}
    </>
  )
}
export default Param
