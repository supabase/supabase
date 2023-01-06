import React from 'react'

import { IconMail } from '../../../internals/icons'
import Typography from '../Typography'

export default {
  title: 'General/Icon',
  component: IconMail,
}

export const Default = (args: any) => (
  <div className="block font-sans">
    <div>
      <Typography.Text>
        <IconMail {...args} />
      </Typography.Text>
    </div>
  </div>
)

Default.args = {
  size: 16,
  strokeWidth: 2,
}

// export const IconList = (args: any) => (
//   <>
//     <div className="p-5 mb-3 font-sans text-xl bg-blue-100 rounded-md">
//       This icons uses react-feather from Feather Icons. For detail you can check
//       it <a href="https://github.com/feathericons/react-feather">here</a> and{' '}
//       <a href="https://feathericons.com/">here</a>
//     </div>
//     <div className="flex flex-wrap font-sans">
//       {LIST_ICONS.map((icon) => (
//         <div className="flex flex-col items-center justify-center m-2 rounded-lg shadow-lg w-36 h-36 dark:text-white">
//           <Icon type={icon} key={icon} {...args} />
//           <span className="mt-2">{icon}</span>
//         </div>
//       ))}
//     </div>
//   </>
// )

// IconList.args = {
//   size: 16,
//   strokeWidth: 2,
// }

// // const SvgMessagesIcon = () => (
// //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
// //     <path
// //       stroke-linecap="round"
// //       stroke-linejoin="round"
// //       stroke-width="2"
// //       d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
// //     />
// //   </svg>
// // )

// // export const IconWithSVG = (args: any) => (
// //   <Icon {...args} src={<SvgMessagesIcon />} />
// // )

// // IconWithSVG.args = {
// //   size: 'xxxlarge',
// //   strokeWidth: 4,
// // }
