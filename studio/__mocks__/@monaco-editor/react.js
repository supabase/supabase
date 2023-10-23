let Editor = jest.fn().mockImplementation((props) => {
  return (
    <textarea className="monaco-editor" onChange={(e) => props.onChange(e.target.value)}></textarea>
  )
})

export const useMonaco = jest.fn().mockImplementation((v) => v)
export default Editor
