import React from 'react'

import LogTable from './LogTable'

export default {
  title: 'Logs',
}

export const Functions = (args: any) => (
  <div
  // style={{
  //   height: '600px',
  //   display: 'flex',
  //   flexDirection: 'column',
  //   flexGrow: 1,
  //   position: 'relative',
  // }}
  // className="
  // flex flex-col flex-grow relative pt-4 flex h-full flex-grow transition-opacity
  // "
  >
    <LogTable
      params={{}}
      queryType="functions"
      projectRef="123"
      data={[
        {
          event_message: 'This is a error log\n',
          event_type: 'log',
          function_id: '001b0b08-331c-403e-810c-a2004b03a019',
          level: 'error',
          timestamp: 1659545029083869,
          id: '3475cf6f-2929-4296-ab44-ce2c17069937',
        },
        {
          event_message: 'This is a uncaughtExceptop\n',
          event_type: 'uncaughtException',
          function_id: '001b0b08-331c-403e-810c-a2004b03a019',
          timestamp: 1659545029083869,
          id: '4475cf6f-2929-4296-ab44-ce2c17069937',
          level: null,
        },
      ]}
    />
  </div>
)
