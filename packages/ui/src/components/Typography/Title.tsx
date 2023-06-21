import React from 'react';
import styleHandler from '../../lib/theme/styleHandler'

interface Props {
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

function Title({ className, level = 1, children, style }: Props) {
  const __styles = styleHandler('title');
  const classes = [className, __styles.base, __styles.fontSize[`h${level}`]];

  const CustomTag: any = `h${level}`;

  return (
    <CustomTag style={style} className={classes.join(' ')}>
      {children}
    </CustomTag>
  );
}

export default Title;
