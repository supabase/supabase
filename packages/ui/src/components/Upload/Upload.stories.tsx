import React, { useState } from 'react'

import Upload from '.'
import Typography from '../Typography'

export default {
  title: 'Data Input/Upload',
  component: Upload,
}

export const Draggable = () => {
  const [files, setFiles] = useState<Array<File>>([])

  return (
    <Upload.Dragger
      label="Upload CSV"
      layout="horizontal"
      files={files}
      setFiles={setFiles}
    >
      <div className="flex flex-col gap-8 justify-evenly">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <Typography.Text className="m-auto text-center">
              <Typography.Link
                style={{
                  textDecoration: 'none',
                }}
              >
                Upload a file
              </Typography.Link>
              {' or drag and drop'}
            </Typography.Text>
          </div>
          <Typography.Text small type="secondary">
            PNG, JPG, GIF up to 10MB
          </Typography.Text>
          {/* <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p> */}
        </div>

        {/* Previews */}
        {files.length > 0 && (
          <div className="grid grid-flow-row grid-cols-3 gap-8 items-center justify-evenly m-auto">
            {files.map((file) => (
              <img
                className="h-32 object-cover w-full rounded-lg"
                src={URL.createObjectURL(file)}
                alt={file.name}
              />
            ))}
          </div>
        )}
      </div>
    </Upload.Dragger>
  )
}
