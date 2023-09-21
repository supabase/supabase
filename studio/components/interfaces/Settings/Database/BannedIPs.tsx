import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, IconExternalLink } from 'ui'
import { useParams } from 'common/hooks'
import {
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useBannedIPsQuery } from 'data/banned-ips/banned-ips-query'

const BannedIPs = () => {
  const { ref } = useParams()
  const [selectedIPs, setSelectedIPs] = useState<string[]>([]) // Explicitly define the type as string[]
  const { data: projectSettings } = useProjectSettingsQuery({ projectRef: ref })
  const {
    data: IPlist,
    isLoading,
    isSuccess,
  } = useBannedIPsQuery({
    projectRef: ref,
  })

   // Log the data from useProjectSettingsQuery
   console.log('Project Settings Data:', projectSettings);

   // Log the data from useBannedIPsQuery only when it's available
   useEffect(() => {
    if (isSuccess) {
      console.log('Banned IPs Data:', IPlist);
    }
  }, [isSuccess, IPlist]);

  const handleToggleIP = (ip: string) => {
    // Toggle the selection state of an IP address
    setSelectedIPs((prevSelectedIPs) =>
      prevSelectedIPs.includes(ip)
        ? prevSelectedIPs.filter((selectedIP) => selectedIP !== ip)
        : [...prevSelectedIPs, ip]
    )
  }

  const handleUnbanIPs = () => {
    // Perform the unban action for selected IPs here
    // I can use the `selectedIPs` array to unban the selected IPs
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <FormHeader title="Banned IPs" description="" />
        <div className="flex items-center space-x-2 mb-6">
          <Link href="https://supabase.com/docs/guides/platform/network-restrictions">
            <a target="_blank">
              <Button type="default" icon={<IconExternalLink />}>
                Documentation
              </Button>
            </a>
          </Link>
        </div>
      </div>
      <FormPanel>
        <div className="grid grid-cols-1 items-center lg:grid-cols-2 p-8">
          <div className="space-y-2">
            <div style={{ maxWidth: '420px' }}>
              <p className="text-sm opacity-50"></p>
            </div>
            {/* Display the list of banned IPs */}
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>IP Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {IPlist && IPlist.banned_ipv4_addresses.map((ip) => ( 
                    <tr key={ip}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIPs.includes(ip)}
                          onChange={() => handleToggleIP(ip)}
                        />
                      </td>
                      <td>{ip}</td>
                      <td>
                        {/* I can any action buttons here */}
                        <button
                          type="button"
                          onClick={() => {
                            // Implement the unban logic here for a single IP
                            // I can use the `ip` variable to unban this specific IP
                          }}
                        >
                          Unban IP
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-end justify-end">
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button
                  type="default"
                  disabled={!selectedIPs.length}
                  onClick={handleUnbanIPs}
                >
                  Unban IPs
                </Button>
              </Tooltip.Trigger>
              {!selectedIPs.length && (
                <Tooltip.Portal>
                  <Tooltip.Content align="center" side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div></div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </div>
      </FormPanel>
    </div>
  )
}

export default BannedIPs
