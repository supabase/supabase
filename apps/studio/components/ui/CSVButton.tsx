import { Button, IconDownloadCloud } from 'ui'
import { ButtonProps } from 'ui/src/components/Button/Button'
import { flattenDeep } from 'lodash'
import React, { PropsWithChildren, useMemo, useRef } from 'react'
import { CSVLink } from 'react-csv'

interface CSVButtonProps {
  buttonType?: ButtonProps['type']
  onClick?: ButtonProps['onClick']
  disabled?: ButtonProps['disabled']
  icon?: React.ReactNode
  data?: unknown[]
  title?: string
}

const CSVButton = ({
  onClick,
  buttonType = 'default',
  icon,
  children,
  disabled,
  data,
  title,
}: PropsWithChildren<CSVButtonProps>) => {
  const csvRef = useRef(null)
  const handleDownload = () => {
    ;(csvRef.current as any)?.link.click()
  }
  const formattedData = useMemo(() => {
    const first = data?.[0]
    if (!first || !data) return
    const keys = Object.keys(first as any)
    return data.map((datum: any) => {
      return keys.reduce((acc: any, key) => {
        if (typeof datum[key] === 'object') {
          acc[key] = JSON.stringify(datum[key]) as string
        } else {
          acc[key] = String(datum[key])
        }
        return acc
      }, {})
    })
    // retrieve dot notation of all keys
  }, [JSON.stringify(data)])

  return (
    <>
      <CSVLink
        ref={csvRef}
        className="hidden"
        data={formattedData || ([] as any)}
        filename={`supabase_logs.csv`}
        title={title}
      />
      <Button
        type={buttonType}
        icon={icon || <IconDownloadCloud />}
        disabled={disabled}
        onClick={(e) => {
          if (onClick) onClick(e)
          handleDownload()
        }}
      >
        {children}
      </Button>
    </>
  )
}

export default CSVButton
