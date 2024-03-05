import React from 'react'
import {
  FormDescription_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Label_Shadcn_,
  cn,
} from 'ui'
import defaultTheme from '../../../ui/src/lib/theme/defaultTheme'

export type FormLayoutProps = {
  description?: string | React.ReactNode | undefined
  label?: string | React.ReactNode
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical'
  isForm?: boolean
}

type Props = {
  align?: 'left' | 'right'
  descriptionText?: string | React.ReactNode
  error?: string | React.ReactNode
  label?: string | React.ReactNode
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex'
  // flex?: boolean
  responsive?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  beforeLabel?: string
  afterLabel?: string | React.ReactNode
  nonBoxInput?: boolean
  labelLayout?: 'horizontal' | 'vertical'
  isForm?: boolean
}

export const FormLayout = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & Props
>(
  (
    {
      align = 'left',
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
      ...props
    },
    ref
  ) => {
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

    const hasLabel = Boolean(label || beforeLabel || afterLabel)

    const renderError = props.isForm && <FormMessage_Shadcn_ className="mt-2" />

    const renderDescription =
      descriptionText && props.isForm ? (
        <FormDescription_Shadcn_
          className={[__styles.description.base, __styles.description.size[size]].join(' ')}
          id={id + '-description'}
        >
          {descriptionText}
        </FormDescription_Shadcn_>
      ) : (
        <p
          className={cn(
            [__styles.description.base, __styles.description.size[size]].join(' '),
            'text-sm text-foreground-light'
          )}
        >
          {descriptionText}
        </p>
      )

    const Label = (props.isForm && FormLabel_Shadcn_) || Label_Shadcn_

    return (
      <div ref={ref} {...props} className={cn(containerClasses.join(' '), className)}>
        {flex && <div className={__styles.flex[align].content}>{props.children}</div>}
        {hasLabel || labelOptional || layout === 'horizontal' ? (
          <div
            // direction={
            //   (layout && layout === 'horizontal') ||
            //   (flex && layout && layout === 'vertical')
            //     ? 'vertical'
            //     : 'horizontal'
            // }
            className={labelContainerClasses.join(' ')}
          >
            {hasLabel && (
              <Label>
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
                    className={[__styles.label_after.base, __styles.label_after.size[size]].join(
                      ' '
                    )}
                    id={id + '-after'}
                  >
                    {afterLabel}
                  </span>
                )}
              </Label>
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
                {props.children}
              </div>
              {renderError}
              {renderDescription}
            </>
          </div>
        )}
      </div>
    )
  }
)
