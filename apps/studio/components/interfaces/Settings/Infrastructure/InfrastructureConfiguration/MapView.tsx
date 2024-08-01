import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { partition, uniqBy } from 'lodash'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Database, useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import type { AWS_REGIONS_KEYS } from 'shared-data'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { AVAILABLE_REPLICA_REGIONS, REPLICA_STATUS } from './InstanceConfiguration.constants'
import GeographyData from './MapData.json'

// [Joshen] Foresee that we'll skip this view for initial launch

interface MapViewProps {
  onSelectDeployNewReplica: (region: AWS_REGIONS_KEYS) => void
  onSelectRestartReplica: (database: Database) => void
  onSelectDropReplica: (database: Database) => void
}

const MapView = ({
  onSelectDeployNewReplica,
  onSelectRestartReplica,
  onSelectDropReplica,
}: MapViewProps) => {
  const { ref } = useParams()
  const [mount, setMount] = useState(false)
  const [zoom, setZoom] = useState<number>(1.5)
  const [center, setCenter] = useState<[number, number]>([14, 7])
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    region: { key: string; country?: string; name?: string }
  }>()
  const canManageReplicas = useCheckPermissions(PermissionAction.CREATE, 'projects')

  const { data } = useReadReplicasQuery({ projectRef: ref })
  const databases = data ?? []
  const [[primary], replicas] = partition(databases, (db) => db.identifier === ref)

  const primaryCoordinates = AVAILABLE_REPLICA_REGIONS.find((region) =>
    primary.region.includes(region.region)
  )?.coordinates ?? [0, 0]
  const uniqueRegionsByReplicas = uniqBy(replicas, (r) => {
    return AVAILABLE_REPLICA_REGIONS.find((region) => r.region.includes(region.region))?.key
  })

  const selectedRegionKey =
    AVAILABLE_REPLICA_REGIONS.find((region) => region.coordinates === center)?.region ?? ''
  const showRegionDetails = zoom === 2.0 && selectedRegionKey !== undefined
  const selectedRegion = AVAILABLE_REPLICA_REGIONS.find(
    (region) => region.region === selectedRegionKey
  )
  const databasesInSelectedRegion = databases
    .filter((database) => database.region.includes(selectedRegionKey))
    .sort((a, b) => (a.inserted_at > b.inserted_at ? 1 : 0))
    .sort((database) => (database.identifier === ref ? -1 : 0))

  useEffect(() => {
    setTimeout(() => setMount(true), 100)
  }, [])

  return (
    <div className="bg-studio h-[500px] relative">
      <ComposableMap projectionConfig={{ scale: 155 }} className="w-full h-full">
        <ZoomableGroup
          className={mount ? 'transition-all duration-300' : ''}
          center={center}
          zoom={zoom}
          minZoom={1.5}
          maxZoom={2.0}
          filterZoomEvent={({ constructor: { name } }) =>
            !['MouseEvent', 'WheelEvent'].includes(name)
          }
        >
          <Geographies geography={GeographyData}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  strokeWidth={0.3}
                  pointerEvents="none"
                  className="fill-gray-800 stroke-gray-900 dark:fill-gray-300 dark:stroke-gray-200"
                />
              ))
            }
          </Geographies>

          {uniqueRegionsByReplicas.map((database) => {
            const coordinates = AVAILABLE_REPLICA_REGIONS.find((region) =>
              database.region.includes(region.region)
            )?.coordinates

            if (coordinates !== primaryCoordinates) {
              return (
                <Line
                  key={`line-${database.identifier}-${primary.identifier}`}
                  from={coordinates}
                  to={primaryCoordinates}
                  stroke="white"
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeOpacity={0.2}
                  strokeDasharray={'3, 3'}
                  className="map-path"
                />
              )
            } else {
              return null
            }
          })}

          {AVAILABLE_REPLICA_REGIONS.map((region) => {
            const dbs =
              databases.filter((database) => database.region.includes(region.region)) ?? []
            const coordinates = AVAILABLE_REPLICA_REGIONS.find(
              (r) => r.region === region.region
            )?.coordinates

            const hasNoDatabases = dbs.length === 0
            const hasPrimary = dbs.some((database) => database.identifier === ref)
            const replicas = dbs.filter((database) => database.identifier !== ref) ?? []

            return (
              <Marker
                key={region.key}
                coordinates={coordinates}
                onMouseEnter={() => {
                  setTooltip({
                    x: coordinates![0],
                    y: coordinates![1],
                    region: {
                      key: region.key,
                      country: region.name,
                      name: hasNoDatabases
                        ? undefined
                        : hasPrimary
                          ? `Primary Database${
                              replicas.length > 0
                                ? ` + ${replicas.length} replica${replicas.length > 1 ? 's' : ''} `
                                : ''
                            }`
                          : `${replicas.length} Read Replica${
                              replicas.length > 1 ? 's' : ''
                            } deployed`,
                    },
                  })
                }}
                onMouseLeave={() => setTooltip(undefined)}
                onClick={() => {
                  if (coordinates) {
                    setCenter(coordinates)
                    setZoom(2.0)
                  }
                }}
              >
                {selectedRegionKey === region.region && (
                  <circle
                    r={4}
                    className={`animate-ping ${
                      hasNoDatabases ? 'fill-border-stronger' : 'fill-brand'
                    }`}
                  />
                )}
                <circle
                  r={4}
                  className={`cursor-pointer ${
                    hasNoDatabases
                      ? 'fill-background-surface-300 stroke-border-stronger'
                      : hasPrimary
                        ? 'fill-brand stroke-brand-500'
                        : 'fill-brand-500 stroke-brand-400'
                  }`}
                />
              </Marker>
            )
          })}

          {tooltip !== undefined && zoom === 1.5 && (
            <Marker coordinates={[tooltip.x - 47, tooltip.y - 5]}>
              <foreignObject width={220} height={66.25}>
                <div className="bg-studio/50 rounded border">
                  <div className="px-3 py-2 flex flex-col gap-y-1">
                    <div className="flex items-center gap-x-2">
                      <img
                        alt="region icon"
                        className="w-4 rounded-sm"
                        src={`${BASE_PATH}/img/regions/${tooltip.region.key}.svg`}
                      />
                      <p className="text-[11px]">{tooltip.region.country}</p>
                    </div>
                    <p
                      className={`text-[11px] ${
                        tooltip.region.name === undefined ? 'text-foreground-light' : ''
                      }`}
                    >
                      {tooltip.region.name ?? 'No databases deployed'}
                    </p>
                  </div>
                </div>
              </foreignObject>
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {showRegionDetails && selectedRegion && (
        <div className="absolute bottom-4 right-4 flex flex-col bg-studio/50 backdrop-blur-sm border rounded w-[400px]">
          <div className="flex items-center justify-between py-4 px-4 border-b">
            <div>
              <p className="text-xs text-foreground-light">
                {databasesInSelectedRegion.length} database
                {databasesInSelectedRegion.length > 1 ? 's' : ''} deployed in
              </p>
              <p className="text-sm">{selectedRegion.name}</p>
            </div>
            <img
              alt="region icon"
              className="w-10 rounded-sm"
              src={`${BASE_PATH}/img/regions/${selectedRegion.key}.svg`}
            />
          </div>

          {databasesInSelectedRegion.length > 0 && (
            <ScrollArea style={{ height: databasesInSelectedRegion.length > 2 ? '180px' : 'auto' }}>
              <ul className={`flex flex-col divide-y`}>
                {databasesInSelectedRegion.map((database) => {
                  const created = dayjs(database.inserted_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

                  return (
                    <li
                      key={database.identifier}
                      className="text-sm px-4 py-2 flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-y-1">
                        <p className="flex items-center gap-x-2">
                          {database.identifier === ref
                            ? 'Primary Database'
                            : `Read Replica ${
                                database.identifier.length > 0 &&
                                `(ID: ${formatDatabaseID(database.identifier)})`
                              }`}
                          {database.status === REPLICA_STATUS.ACTIVE_HEALTHY ? (
                            <Badge variant="brand">Healthy</Badge>
                          ) : database.status === REPLICA_STATUS.COMING_UP ? (
                            <Badge>Coming up</Badge>
                          ) : database.status === REPLICA_STATUS.RESTORING ? (
                            <Badge>Restarting</Badge>
                          ) : (
                            <Badge variant="warning">Unhealthy</Badge>
                          )}
                        </p>
                        <p className="text-xs text-foreground-light">AWS • {database.size}</p>
                        {database.identifier !== ref && (
                          <p className="text-xs text-foreground-light">Created on: {created}</p>
                        )}
                      </div>
                      {database.identifier !== ref && (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button type="text" icon={<MoreVertical />} className="px-1" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-40" side="bottom" align="end">
                            <DropdownMenuItem
                              className="gap-x-2"
                              disabled={database.status !== REPLICA_STATUS.ACTIVE_HEALTHY}
                            >
                              <Link
                                href={`/project/${ref}/settings/database?connectionString=${database.identifier}`}
                              >
                                View connection string
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-x-2"
                              disabled={database.status !== REPLICA_STATUS.ACTIVE_HEALTHY}
                            >
                              <Link
                                href={`/project/${ref}/reports/database?db=${database.identifier}&chart=replication-lag`}
                              >
                                View replication lag
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="gap-x-2"
                              onClick={() => onSelectRestartReplica(database)}
                              disabled={database.status !== REPLICA_STATUS.ACTIVE_HEALTHY}
                            >
                              Restart replica
                            </DropdownMenuItem>
                            <Tooltip_Shadcn_>
                              <TooltipTrigger_Shadcn_ asChild>
                                <DropdownMenuItem
                                  className="gap-x-2 !pointer-events-auto"
                                  disabled={!canManageReplicas}
                                  onClick={() => onSelectDropReplica(database)}
                                >
                                  Drop replica
                                </DropdownMenuItem>
                              </TooltipTrigger_Shadcn_>
                              {!canManageReplicas && (
                                <TooltipContent_Shadcn_ side="left">
                                  You need additional permissions to drop replicas
                                </TooltipContent_Shadcn_>
                              )}
                            </Tooltip_Shadcn_>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          )}

          <div
            className={`flex items-center justify-end gap-x-2 px-4 py-4 ${
              databasesInSelectedRegion.length > 0 ? 'border-t' : ''
            }`}
          >
            <ButtonTooltip
              type="default"
              disabled={!canManageReplicas}
              onClick={() => onSelectDeployNewReplica(selectedRegion.key)}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: 'You need additional permissions to deploy replicas',
                },
              }}
            >
              Deploy new replica here
            </ButtonTooltip>
            <Button
              type="default"
              onClick={() => {
                setCenter([14, 7])
                setZoom(1.5)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView
