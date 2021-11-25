import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const CodeSnippet = ({ selectedLang, snippet }) => {
  if (!snippet[selectedLang]) return null
  return (
    <>
      <h4>{snippet.title}</h4>
      <SimpleCodeBlock className={snippet[selectedLang].language}>
        {snippet[selectedLang].code}
      </SimpleCodeBlock>
    </>
  )
}
export default CodeSnippet
