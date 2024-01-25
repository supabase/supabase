import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = () => {
  return (
    <div>
      <SimpleCodeBlock className="bash">
        {`
DATABASE_URL='your-database-url'
        `}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
