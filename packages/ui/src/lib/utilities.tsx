import React from 'react'

// export const FormLayout = (props: any) => {
//   const {
//     align,
//     direction,
//     size,
//     label,
//     labelOptional,
//     layout,
//     children,
//     id,
//     error,
//     descriptionText,
//     className,
//     responsive
//   } = props

//   const spacingClass =
//     'space-' + (direction === 'vertical' ? 'y' : 'x') + '-' + size

//   const responsiveClasses = responsive ? ' md:grid-cols-12' : ' grid-cols-12'

//   return (
//     <div className={"grid gap-2 " + className + responsiveClasses}>
//       <Space direction={layout && layout === 'horizontal' ? 'vertical' : 'horizontal'}
//         className={"" + (layout !== 'horizontal' ? ' justify-between col-span-12' : ' col-span-5')}
//       >
//         {label && (
//           <label
//             className="block text-sm font-sml text-gray-700 dark:text-gray-200 font-medium"
//             htmlFor={id}
//           >
//             {label}
//           </label>
//         )}
//         {labelOptional && (
//           <span className="text-sm text-gray-400 dark:text-gray-300" id={id + '-optional'}>
//             {labelOptional}
//           </span>
//         )}
//       </Space>
//       <div className={layout !== 'horizontal' ? 'col-span-12' : 'col-span-7' + (align === 'right' ? ' text-right' : '')}>
//         {children}
//         {error && (
//           <p className="mt-2 text-sm text-red-500" id="email-error">
//             {error}
//           </p>
//         )}
//         {descriptionText && (
//           <p className="mt-2 text-sm text-gray-400 dark:text-gray-300" id={id + '-description'}>
//             {descriptionText}
//           </p>
//         )}
//       </div>
//     </div>
//   )
// }

// export const Space = (props: any) => {
//   const { direction, size, className } = props

//   const spacingClass =
//     'space-' + (direction === 'vertical' ? 'y' : 'x') + '-' + size

//   return (
//     <div
//       className={
//         'flex' +
//         (className ? ' ' + className : '') +
//         (spacingClass ? ' ' + spacingClass : '') +
//         (direction === 'vertical' ? ' flex-col' : ' flex-row')
//       }
//     >
//       {props.children}
//     </div>
//   )
// }
