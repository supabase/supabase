import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const CodeSnippet = ({ selectedLang, snippet }) => {
  if (!snippet[selectedLang]) return null
  return (
    <div className="codeblock-container">
      <h4>{snippet.title}</h4>
      <SimpleCodeBlock className={snippet[selectedLang].language}>
        {snippet[selectedLang].code}
      </SimpleCodeBlock>
    </div>
  )
}
export default CodeSnippet
