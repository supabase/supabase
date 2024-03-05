import React from 'react'
import { FormDescription_Shadcn_, FormLabel_Shadcn_, FormMessage_Shadcn_ } from 'ui'
import defaultTheme from '../../../ui/src/lib/theme/defaultTheme'

type Props = {
  align?: 'left' | 'right'
  children?: any
  className?: string
  descriptionText?: string | React.ReactNode
  error?: string | React.ReactNode
  id?: string
  label?: string | React.ReactNode
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex'
  style?: React.CSSProperties
  // flex?: boolean
  responsive?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  beforeLabel?: string
  afterLabel?: string | React.ReactNode
  nonBoxInput?: boolean
  labelLayout?: 'horizontal' | 'vertical'
}

export function FormLayout({
  align = 'left',
  children,
  className,
  descriptionText,
  id,
  label,
  labelOptional,
  layout = 'vertical',
  style,
  // flex = false,
  labelLayout,
  responsive = true,
  size = 'medium',
  beforeLabel,
  afterLabel,
  nonBoxInput = label ? false : true,
}: Props) {
  const __styles = defaultTheme.form_layout

  const flex = layout === 'flex'

  let containerClasses = []

  containerClasses.push(__styles.size[size])

  let labelContainerClasses = []
  let dataInputContainerClasses = []

  if (layout !== 'horizontal' && !labelLayout && !flex) {
    labelContainerClasses.push(__styles.labels_horizontal_layout)
  } else if (labelLayout === 'horizontal') {
    labelContainerClasses.push(__styles.labels_horizontal_layout)
  } else if (labelLayout === 'vertical') {
    labelContainerClasses.push(__styles.labels_vertical_layout)
  } else {
    labelContainerClasses.push(__styles.labels_vertical_layout)
  }

  if (layout !== 'horizontal') {
    dataInputContainerClasses.push(__styles.data_input_horizontal_layout)
  } else {
    dataInputContainerClasses.push(__styles.data_input_vertical_layout)
    if (align === 'right') {
      dataInputContainerClasses.push(__styles.data_input_vertical_layout__align_right)
    }
  }

  if (flex) {
    containerClasses.push(__styles.flex[align].base)
    if (align === 'left') {
      labelContainerClasses.push(__styles.flex.left.labels)
      dataInputContainerClasses.push(__styles.flex.left.data_input)
    }
    if (align === 'right') {
      labelContainerClasses.push(__styles.flex.right.labels)
      dataInputContainerClasses.push(__styles.flex.right.data_input)
    }
  } else {
    containerClasses.push(
      __styles.container,
      responsive ? __styles.responsive : __styles.non_responsive
    )
  }

  if (className) {
    containerClasses.push(className)
  }

  const labeled = Boolean(label || beforeLabel || afterLabel)

  const renderError = <FormMessage_Shadcn_ className="mt-2" />

  const renderDescription = descriptionText && (
    <FormDescription_Shadcn_
      className={[__styles.description.base, __styles.description.size[size]].join(' ')}
      id={id + '-description'}
    >
      {descriptionText}
    </FormDescription_Shadcn_>
  )

  return (
    <div className={containerClasses.join(' ')}>
      {flex && <div className={__styles.flex[align].content}>{children}</div>}
      {labeled || labelOptional || layout === 'horizontal' ? (
        <div
          // direction={
          //   (layout && layout === 'horizontal') ||
          //   (flex && layout && layout === 'vertical')
          //     ? 'vertical'
          //     : 'horizontal'
          // }
          className={labelContainerClasses.join(' ')}
        >
          {labeled && (
            <FormLabel_Shadcn_>
              {beforeLabel && (
                <span
                  className={[__styles.label_before.base, __styles.label_before.size[size]].join(
                    ' '
                  )}
                  id={id + '-before'}
                >
                  {beforeLabel}
                </span>
              )}
              {label}
              {afterLabel && (
                <span
                  className={[__styles.label_after.base, __styles.label_after.size[size]].join(' ')}
                  id={id + '-after'}
                >
                  {afterLabel}
                </span>
              )}
            </FormLabel_Shadcn_>
          )}
          {labelOptional && (
            <span
              className={[__styles.label_optional.base, __styles.label_optional.size[size]].join(
                ' '
              )}
              id={id + '-optional'}
            >
              {labelOptional}
            </span>
          )}
          {flex && (
            <>
              {renderDescription}
              {renderError}
            </>
          )}
        </div>
      ) : null}
      {!flex && (
        <div className={dataInputContainerClasses.join(' ')} style={style}>
          <>
            <div
              className={
                nonBoxInput && label && layout === 'vertical'
                  ? __styles.non_box_data_input_spacing_vertical
                  : nonBoxInput && label && layout === 'horizontal'
                    ? __styles.non_box_data_input_spacing_horizontal
                    : ''
              }
            >
              {children}
            </div>
            {renderError}
            {renderDescription}
          </>
        </div>
      )}
    </div>
  )
}
