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
        <code className="inline-block px-4 inline-block">
          {name}: {type}
        </code>
        <span className="text-gray-400 text-xs uppercase mx-4 inline-block">
          {required ? 'required' : 'optional'}
        </span>
      </div>
      {format && format != type && (
        <div className="mb-4">
          <h5 className="uppercase text-xs font-medium text-gray-400">Format</h5>
          <code className="p-0 text-sm bg-white dark:bg-gray-700">{format}</code>
        </div>
      )}
      {description !== false && (
        <>
          <h5 className="uppercase text-xs font-medium text-gray-400">Description</h5>

          <Description content={description} metadata={metadata} onChange={onDesciptionUpdated} />
        </>
      )}
    </>
  )
}
export default Param
