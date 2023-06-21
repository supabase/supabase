import Title from './Title'
import Text from './Text'
import Link from './Link'
import styleHandler from '../../lib/theme/styleHandler'
// @ts-ignore
import TypographyStyles from './Typography.module.css'

function Typography({ children, className, tag = 'div', style }: any) {
  let CustomTag: any = `${tag}`
  const __styles = styleHandler('typography')
  const classes = [__styles.base, TypographyStyles['sbui-typography'], className]

  return (
    <CustomTag style={style} className={classes.join(' ')}>
      {children}
    </CustomTag>
  )
}

Typography.Title = Title
Typography.Text = Text
Typography.Link = Link

export default Typography
