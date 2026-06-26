import Link from './Link'
import Text from './Text'
import Title from './Title'

function Typography({ children, tag = 'div', style }: any) {
  let CustomTag: any = `${tag}`
  return <CustomTag style={style}>{children}</CustomTag>
}

Typography.Title = Title
Typography.Text = Text
Typography.Link = Link

export default Typography
